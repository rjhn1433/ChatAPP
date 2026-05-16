import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ProfileModal from "./ProfileModal";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    openProfile,
    typingUsers,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  const isTyping = typingUsers.includes(selectedUser._id);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto h-full w-full">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
        <ProfileModal />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto h-full w-full bg-[url('/chat-pattern.png')] bg-fixed bg-opacity-5">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 w-full hide-scrollbar">
        <AnimatePresence>
          {messages.map((message) => {
            const isMe = message.senderId === authUser._id;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                key={message._id}
                className={`flex w-full ${isMe ? "justify-end" : "justify-start"} mb-4`}
                ref={messageEndRef}
              >
                <div className={`flex max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"} gap-3 items-end`}>
                  <div className="avatar hidden sm:block">
                    <div
                      className="w-8 h-8 rounded-full border border-base-content/10 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        if (!isMe) openProfile();
                      }}
                    >
                      <img
                        src={isMe ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"}
                        alt="profile pic"
                        className="object-cover"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div 
                      className={`relative px-4 py-2.5 shadow-sm 
                        ${isMe ? "bg-primary text-primary-content rounded-2xl rounded-br-sm" 
                              : "bg-base-200/80 backdrop-blur-sm text-base-content rounded-2xl rounded-bl-sm border border-white/5"}`}
                    >
                      {message.image && (
                        <img
                          src={message.image}
                          alt="Attachment"
                          className="sm:max-w-[250px] max-w-[200px] rounded-xl mb-2 cursor-pointer hover:opacity-95 transition-opacity"
                        />
                      )}
                      
                      {message.text && (
                        <p className="text-[15px] leading-relaxed break-words">{message.text}</p>
                      )}
                    </div>

                    <div className={`flex items-center gap-1.5 text-[11px] font-medium opacity-60 ${isMe ? "justify-end" : "justify-start"} px-1`}>
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {isMe && (
                        <span className="flex">
                          {message.seen ? (
                            <CheckCheck className="w-3.5 h-3.5 text-info" />
                          ) : message.delivered ? (
                            <CheckCheck className="w-3.5 h-3.5" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex justify-start mb-4"
              ref={messageEndRef}
            >
              <div className="flex max-w-[75%] flex-row gap-3 items-end">
                <div className="avatar hidden sm:block">
                  <div className="w-8 h-8 rounded-full border border-base-content/10">
                    <img src={selectedUser.profilePic || "/avatar.png"} alt="profile pic" />
                  </div>
                </div>
                <div className="bg-base-200/80 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-bl-sm border border-white/5 flex items-center gap-1.5">
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-base-content/40 rounded-full" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-base-content/40 rounded-full" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-base-content/40 rounded-full" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
