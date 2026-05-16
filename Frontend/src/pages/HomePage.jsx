import { useChatStore } from "../store/useChatStore";
import { motion } from "framer-motion";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import ProfileModal from "../components/ProfileModal";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen bg-base-300 relative overflow-hidden flex flex-col"
    >
      {/* Background ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex items-center justify-center pt-20 px-2 sm:px-4 h-full relative z-10 pb-4">
        <div className="glass-panel rounded-2xl w-full max-w-7xl h-full flex flex-col overflow-hidden border border-white/5">
          <div className="flex h-full w-full">
            <Sidebar />

            <div className="flex-1 flex flex-col h-full bg-base-100/50 relative">
              {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>

        {/* Profile Modal (Global Mount) */}
        <ProfileModal />
      </div>
    </motion.div>
  );
};
export default HomePage;
