import { useChatStore } from "../store/useChatStore";
import { X } from "lucide-react";

const ProfileModal = () => {
  const { isProfileOpen, selectedUser, closeProfile } = useChatStore();

  if (!isProfileOpen || !selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      
      <div className="bg-base-100 w-[360px] rounded-2xl shadow-xl relative animate-scaleIn">
        
        {/* Close button */}
        <button
          onClick={closeProfile}
          className="absolute top-3 right-3 btn btn-xs btn-circle"
        >
          <X size={16} />
        </button>

        {/* Profile Image */}
        <div className="flex flex-col items-center p-6">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-base-300">
            <img
              src={selectedUser.profilePic || "/avatar.png"}
              alt="profile"
              className="w-full h-full object-cover"
            />
          </div>

          <h2 className="mt-4 text-lg font-semibold">
            {selectedUser.fullName}
          </h2>

          <p className="text-sm text-zinc-500">
            {selectedUser.email}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-base-300" />

        {/* Extra info area (future: media/docs/etc) */}
        <div className="p-4 text-sm text-zinc-500 text-center">
          More features coming soon 👀
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;