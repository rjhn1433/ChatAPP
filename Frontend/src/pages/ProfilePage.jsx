import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Info, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [bio, setBio] = useState(authUser?.bio || "");
  const [isSavingBio, setIsSavingBio] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleSaveBio = async () => {
    if (bio === authUser.bio) return;
    setIsSavingBio(true);
    try {
      await updateProfile({ bio });
    } finally {
      setIsSavingBio(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen pt-20 pb-10 bg-base-300 relative"
    >
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 relative z-10">
        <div className="glass-panel rounded-3xl p-8 space-y-10">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
            <p className="mt-2 text-base-content/60 font-medium">Manage your personal information</p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-base-100 shadow-xl relative bg-base-200">
                <img
                  src={selectedImg || authUser.profilePic || "/avatar.png"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
                
                <label
                  htmlFor="avatar-upload"
                  className={`
                    absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-300
                    ${isUpdatingProfile ? "animate-pulse pointer-events-none opacity-100" : ""}
                  `}
                >
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-xs font-semibold uppercase tracking-wider">{isUpdatingProfile ? "Uploading" : "Change"}</span>
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUpdatingProfile}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-base-content/70 flex items-center gap-2 ml-1">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <div className="px-5 py-3.5 bg-base-200/50 backdrop-blur-sm rounded-xl border border-white/5 font-medium shadow-inner">
                {authUser?.fullName}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-base-content/70 flex items-center gap-2 ml-1">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <div className="px-5 py-3.5 bg-base-200/50 backdrop-blur-sm rounded-xl border border-white/5 font-medium shadow-inner flex justify-between items-center">
                <span>{authUser?.email}</span>
                {authUser?.isVerified ? (
                    <div className="badge badge-success badge-sm gap-1"><CheckCircle2 className="w-3 h-3"/> Verified</div>
                ) : (
                    <div className="badge badge-warning badge-sm">Unverified</div>
                )}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="text-sm font-semibold text-base-content/70 flex items-center gap-2 ml-1">
                <Info className="w-4 h-4" />
                Bio
              </div>
              <div className="relative">
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={150}
                    className="w-full px-5 py-3.5 bg-base-200/50 backdrop-blur-sm rounded-xl border border-white/5 font-medium shadow-inner resize-none focus:outline-none focus:border-primary/50 transition-colors"
                    rows={3}
                    placeholder="Tell us a little about yourself..."
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-3">
                      <span className="text-xs text-base-content/40">{bio.length}/150</span>
                      {bio !== (authUser?.bio || "") && (
                          <button 
                            onClick={handleSaveBio}
                            disabled={isSavingBio}
                            className="btn btn-primary btn-sm rounded-lg"
                          >
                            {isSavingBio ? "Saving..." : "Save Bio"}
                          </button>
                      )}
                  </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <h2 className="text-xl font-bold mb-6 tracking-tight">Account Information</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm font-medium">
              <div className="flex items-center justify-between p-4 bg-base-200/30 rounded-xl border border-white/5">
                <span className="text-base-content/60">Member Since</span>
                <span>{new Date(authUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'})}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-base-200/30 rounded-xl border border-white/5">
                <span className="text-base-content/60">Account Status</span>
                <span className="text-success flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success animate-pulse"></span> Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default ProfilePage;
