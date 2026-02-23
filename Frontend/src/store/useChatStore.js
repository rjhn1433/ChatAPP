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

      set((state) => ({
        messageRequests: state.messageRequests.filter(
          (u) => u._id !== userId
        ),
      }));

      toast.success("Request accepted");
    } catch (error) {
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
    const { selectedUser, messages } = get();
    if (!selectedUser) return;

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      if (res.data?.senderId) {
        set({ messages: [...messages, res.data] });
      } else {
        toast(res.data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  },

  // SOCKET SUBSCRIBE
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    if (!socket || !authUser) return;

    socket.off("newMessage");
    socket.off("messagesSeen");

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
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messagesSeen");
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