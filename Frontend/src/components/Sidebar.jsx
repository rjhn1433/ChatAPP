import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, X, Check, Bell, MessagesSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    searchUsers,
    searchResults,
    clearSearch,
    getMessageRequests,
    messageRequests,
    acceptRequest,
    blockUser,
    unreadCounts,
    typingUsers
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getUsers();
    getMessageRequests();
  }, [getUsers, getMessageRequests]);

  const displayUsers = search.trim().length > 0 ? searchResults : users;
  const filteredUsers = showOnlineOnly ? displayUsers.filter((user) => onlineUsers.includes(user._id)) : displayUsers;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-80 flex flex-col transition-all duration-300 glass-panel border-r-0 lg:border-r border-white/5 overflow-hidden z-20">
      <div className="w-full p-4 border-b border-white/5 bg-base-200/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
             <MessagesSquare size={20} />
          </div>
          <h2 className="text-xl font-bold tracking-tight hidden lg:block">Chats</h2>
        </div>

        <div className="hidden lg:flex flex-col gap-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40 group-focus-within:text-primary transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if(e.target.value.trim().length > 0) searchUsers(e.target.value);
                else { clearSearch(); getUsers(); }
              }}
              className="w-full pl-9 pr-8 py-2 bg-base-200/50 border border-white/5 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); clearSearch(); getUsers(); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-base-content"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-1 px-1">
            <label className="cursor-pointer flex items-center gap-2 group">
              <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={showOnlineOnly}
                    onChange={(e) => setShowOnlineOnly(e.target.checked)}
                    className="checkbox checkbox-xs checkbox-primary opacity-0 absolute w-full h-full cursor-pointer z-10"
                  />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showOnlineOnly ? 'bg-primary border-primary' : 'border-base-content/30 group-hover:border-primary/50'}`}>
                      {showOnlineOnly && <Check className="w-3 h-3 text-primary-content" />}
                  </div>
              </div>
              <span className="text-xs font-medium text-base-content/70 group-hover:text-base-content transition-colors">Online only</span>
            </label>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-base-200 text-base-content/60">
              {onlineUsers.length - 1} online
            </span>
          </div>
        </div>

        {/* Message Requests */}
        <div className="mt-4 hidden lg:block">
          <button onClick={getMessageRequests} className="w-full flex items-center justify-between p-2 rounded-xl bg-base-200/50 hover:bg-base-200 border border-white/5 transition-all group">
            <div className="flex items-center gap-2 text-sm font-medium text-base-content/80 group-hover:text-base-content">
               <Bell className="w-4 h-4" />
               Requests
            </div>
            {messageRequests.length > 0 && (
              <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-primary text-primary-content text-[11px] font-bold px-1.5 shadow-sm shadow-primary/20">
                {messageRequests.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {messageRequests.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 space-y-2 overflow-hidden">
                {messageRequests.map((user) => (
                  <div key={user._id} className="p-2.5 border border-white/5 rounded-xl flex items-center justify-between bg-base-200/30 backdrop-blur-sm">
                    <span className="text-sm font-medium truncate flex-1">{user.fullName}</span>
                    <div className="flex gap-1.5 ml-2">
                      <button onClick={() => acceptRequest(user._id)} className="w-6 h-6 rounded-md bg-success/20 text-success hover:bg-success hover:text-success-content flex items-center justify-center transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => blockUser(user._id)} className="w-6 h-6 rounded-md bg-error/20 text-error hover:bg-error hover:text-error-content flex items-center justify-center transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full py-2 hide-scrollbar">
        {filteredUsers.map((user) => {
          const isSelected = selectedUser?._id === user._id;
          const isUserTyping = typingUsers.includes(user._id);
          
          return (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-3 flex items-center gap-3 relative overflow-hidden group transition-all duration-200
              ${isSelected ? "bg-primary/10" : "hover:bg-base-200/50"}
            `}
          >
            {isSelected && <motion.div layoutId="sidebar-active" className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
            
            <div className="relative mx-auto lg:mx-0 flex-shrink-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.fullName}
                className="w-12 h-12 object-cover rounded-full border border-white/10 shadow-sm"
              />
              {onlineUsers.includes(user._id) && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success rounded-full border-2 border-base-100 shadow-sm" />
              )}
            </div>

            <div className="hidden lg:flex flex-col flex-1 min-w-0 text-left">
              <div className="flex justify-between items-center w-full mb-0.5">
                <span className={`font-semibold truncate text-[15px] ${isSelected ? "text-primary" : "text-base-content"}`}>{user.fullName}</span>
                {user.lastMessage && (
                   <span className="text-[10px] text-base-content/40 flex-shrink-0 ml-2">
                       {new Date(user.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                )}
              </div>

              <div className="flex justify-between items-center w-full">
                <div className={`text-[13px] truncate flex-1 ${user.unreadCount > 0 ? "font-semibold text-base-content" : "text-base-content/50"}`}>
                  {isUserTyping ? (
                      <span className="text-primary italic font-medium">typing...</span>
                  ) : user.lastMessage ? (
                    <>
                      {user.lastMessage.senderId === user._id ? "" : "You: "}
                      {user.lastMessage.text ? user.lastMessage.text : "📷 Photo"}
                    </>
                  ) : (
                    <span className="italic">{onlineUsers.includes(user._id) ? "Online" : "Offline"}</span>
                  )}
                </div>

                {user.unreadCount > 0 && (
                  <span className="ml-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-primary text-primary-content text-[11px] font-bold shadow-sm">
                    {user.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        )})}

        {filteredUsers.length === 0 && (
          <div className="text-center text-base-content/40 py-8 flex flex-col items-center gap-2">
            <Users className="w-8 h-8 opacity-50" />
            <span className="text-sm font-medium">No users found</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;