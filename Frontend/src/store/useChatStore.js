import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  searchResults: [],
  messageRequests: [],
  unreadCounts: {},
  isRequestPending: false,
  isProfileOpen: false,
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSending: false,
  typingUsers: [], // Array of user IDs who are currently typing

  // GET USERS
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");

      // Backend now sends: unreadCount + lastMessage
      const usersWithMeta = res.data;

      // Build unreadCounts object from backend
      const unreadMap = {};
      usersWithMeta.forEach((user) => {
        unreadMap[user._id] = user.unreadCount || 0;
      });

      set({
        users: usersWithMeta,
        unreadCounts: unreadMap,
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // SEARCH USERS
  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    try {
      const res = await axiosInstance.get(`/auth/search?query=${query}`);
      set({ searchResults: res.data });
    } catch (error) {
      toast.error("Search failed");
    }
  },

  clearSearch: () => set({ searchResults: [] }),

  // 📥 GET MESSAGE REQUESTS
  getMessageRequests: async () => {
    try {
      const res = await axiosInstance.get("/messages/requests");
      set({ messageRequests: res.data });
    } catch (error) {
      toast.error("Failed to load requests");
    }
  },

  // ✅ ACCEPT REQUEST
  acceptRequest: async (userId) => {
    try {
      await axiosInstance.post(`/messages/accept/${userId}`);

      // Remove from pending list
      set((state) => ({
        messageRequests: state.messageRequests.filter(
          (u) => u._id !== userId
        ),
        isRequestPending: false,
      }));

      // 🔥 Force refresh users & requests from backend
      await get().getUsers();
      await get().getMessageRequests();

      toast.success("Request accepted");
    } catch (error) {
      console.log("Error accepting request:", error);
      toast.error("Failed to accept request");
    }
  },

  // 🚫 BLOCK USER
  blockUser: async (userId) => {
    try {
      await axiosInstance.post(`/messages/block/${userId}`);

      set((state) => ({
        messageRequests: state.messageRequests.filter(
          (u) => u._id !== userId
        ),
      }));

      toast.success("User blocked");
    } catch (error) {
      toast.error("Failed to block user");
    }
  },

  // GET MESSAGES
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);

      set({
        messages: res.data.messages,
        isRequestPending: res.data.isRequestPending,
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // SEND MESSAGE
  sendMessage: async (messageData) => {
    const { selectedUser, messages, isSending } = get();
    if (!selectedUser || isSending) return;

    set({ isSending: true });

    // optimistic UI message
    const tempMessage = {
      _id: Date.now(),
      ...messageData,
      senderId: useAuthStore.getState().authUser._id,
      receiverId: selectedUser._id,
      seen: false,
    };

    set({ messages: [...messages, tempMessage] });

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      if (res.data?.senderId) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === tempMessage._id ? res.data : m
          ),
        }));
        
        // Emit markDelivered to let sender know if we're online and receiver
        const socket = useAuthStore.getState().socket;
        if(socket) {
             socket.emit("markDelivered", { messageId: res.data._id, senderId: res.data.receiverId });
        }
      } else {
        toast(res.data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    } finally {
      set({ isSending: false });
    }
  },

  // SOCKET SUBSCRIBE
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    if (!socket || !authUser) return;

    socket.off("newMessage");
    socket.off("messagesSeen");
    socket.off("messageDelivered");
    socket.off("userTyping");
    socket.off("userStoppedTyping");

    // 🔹 HANDLE NEW MESSAGE
    socket.on("newMessage", (newMessage) => {
      set((state) => {
        const updatedUsers = [...state.users];

        const otherUserId =
          newMessage.senderId === authUser._id
            ? newMessage.receiverId
            : newMessage.senderId;

        const existingUserIndex = updatedUsers.findIndex(
          (u) => u._id === otherUserId
        );

        if (existingUserIndex !== -1) {
          const [user] = updatedUsers.splice(existingUserIndex, 1);
          updatedUsers.unshift(user);
        }

        const isConversationOpen =
          state.selectedUser &&
          (
            (newMessage.senderId === state.selectedUser._id &&
              newMessage.receiverId === authUser._id) ||
            (newMessage.senderId === authUser._id &&
              newMessage.receiverId === state.selectedUser._id)
          );

        return {
          users: updatedUsers,
          unreadCounts: isConversationOpen
            ? {
                ...state.unreadCounts,
                [otherUserId]: 0,
              }
            : {
                ...state.unreadCounts,
                [otherUserId]:
                  (state.unreadCounts[otherUserId] || 0) + 1,
              },
          messages: isConversationOpen
            ? [...state.messages, newMessage]
            : state.messages,
        };
      });
    });

    // 🔹 HANDLE SEEN EVENT (BLUE TICK)
    socket.on("messagesSeen", ({ from }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.senderId === authUser._id &&
          msg.receiverId === from
            ? { ...msg, seen: true }
            : msg
        ),
      }));
    });

    socket.on("messageDelivered", ({ messageId }) => {
        set((state) => ({
            messages: state.messages.map(msg => 
                msg._id === messageId ? { ...msg, delivered: true } : msg
            )
        }));
    });

    socket.on("userTyping", ({ senderId }) => {
        set((state) => {
            if(!state.typingUsers.includes(senderId)) {
                return { typingUsers: [...state.typingUsers, senderId] };
            }
            return state;
        });
    });

    socket.on("userStoppedTyping", ({ senderId }) => {
        set((state) => ({
            typingUsers: state.typingUsers.filter(id => id !== senderId)
        }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messagesSeen");
    socket.off("messageDelivered");
    socket.off("userTyping");
    socket.off("userStoppedTyping");
  },

  emitTyping: (receiverId) => {
      const socket = useAuthStore.getState().socket;
      if(socket) socket.emit("typing", { receiverId });
  },

  emitStopTyping: (receiverId) => {
      const socket = useAuthStore.getState().socket;
      if(socket) socket.emit("stopTyping", { receiverId });
  },

  openProfile: () => set({ isProfileOpen: true }),

  closeProfile: () => set({ isProfileOpen: false }),

  setSelectedUser: (selectedUser) =>
    set((state) => ({
      selectedUser,
      messages: [],
      searchResults: [],
      isRequestPending: false,
      unreadCounts: {
        ...state.unreadCounts,
        [selectedUser._id]: 0,
      },
    })),
}));