import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Smile } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { sendMessage, isRequestPending, selectedUser, emitTyping, emitStopTyping } = useChatStore();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    
    if (selectedUser) {
       emitTyping(selectedUser._id);
       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
       typingTimeoutRef.current = setTimeout(() => {
           emitStopTyping(selectedUser._id);
       }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        emitStopTyping(selectedUser._id);
    }

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full bg-base-100/50 backdrop-blur-md border-t border-white/5 relative z-10">
      <AnimatePresence>
        {imagePreview && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-3 flex items-center gap-2"
          >
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-xl border border-white/10 shadow-lg"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-base-300 shadow-md
                flex items-center justify-center hover:bg-error hover:text-error-content transition-colors"
                type="button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isRequestPending ? (
        <div className="text-center p-4 text-sm text-base-content/60 bg-base-200/50 rounded-2xl backdrop-blur-sm border border-white/5">
          Waiting for user to accept your request...
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
          <div className="flex-1 flex gap-2 items-center bg-base-200/60 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/5 shadow-inner">
            <button
              type="button"
              className={`flex-shrink-0 btn btn-ghost btn-circle btn-sm
                       ${imagePreview ? "text-primary" : "text-base-content/50 hover:text-primary"}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Image size={20} />
            </button>
            
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />

            <input
              type="text"
              className="w-full bg-transparent border-none focus:outline-none text-base-content placeholder:text-base-content/40"
              placeholder="Type a message..."
              value={text}
              onChange={handleTyping}
            />

            <button
              type="button"
              className="flex-shrink-0 btn btn-ghost btn-circle btn-sm text-base-content/50 hover:text-primary"
            >
              <Smile size={20} />
            </button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="btn btn-circle bg-primary hover:bg-primary-focus border-none shadow-lg shadow-primary/30 flex-shrink-0"
            disabled={!text.trim() && !imagePreview}
          >
            <Send size={20} className="text-white ml-1" />
          </motion.button>
        </form>
      )}
    </div>
  );
};
export default MessageInput;
