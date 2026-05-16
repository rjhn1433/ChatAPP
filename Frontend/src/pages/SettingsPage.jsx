import { useState } from "react";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { Send, Lock, MonitorSmartphone, ShieldAlert, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { changePassword, logoutAll } = useAuthStore();

  const [pwdData, setPwdData] = useState({ currentPassword: "", newPassword: "" });
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const handlePasswordChange = async (e) => {
      e.preventDefault();
      setIsChangingPwd(true);
      const success = await changePassword(pwdData);
      if(success) setPwdData({ currentPassword: "", newPassword: "" });
      setIsChangingPwd(false);
  };

  const handleLogoutAll = async () => {
      if(!window.confirm("Are you sure you want to log out from all devices? You will be logged out of this device as well.")) return;
      setIsLoggingOutAll(true);
      await logoutAll();
      setIsLoggingOutAll(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen container mx-auto px-4 pt-24 pb-12 max-w-5xl relative"
    >
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column - Theme & Security */}
        <div className="lg:col-span-2 space-y-8">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl">
                <div className="flex flex-col gap-2 mb-8">
                  <h2 className="text-2xl font-bold tracking-tight">Appearance</h2>
                  <p className="text-sm font-medium text-base-content/60">Customize the look and feel of your chat interface</p>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {THEMES.map((t) => (
                    <button
                      key={t}
                      className={`
                        group flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200
                        ${theme === t ? "bg-base-200 ring-2 ring-primary shadow-md" : "hover:bg-base-200/60 border border-white/5"}
                      `}
                      onClick={() => setTheme(t)}
                    >
                      <div className="relative h-10 w-full rounded-xl overflow-hidden shadow-inner" data-theme={t}>
                        <div className="absolute inset-0 grid grid-cols-4 gap-px p-1 bg-base-100">
                          <div className="rounded-sm bg-primary"></div>
                          <div className="rounded-sm bg-secondary"></div>
                          <div className="rounded-sm bg-accent"></div>
                          <div className="rounded-sm bg-neutral"></div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold tracking-wide truncate w-full text-center">
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </span>
                    </button>
                  ))}
                </div>
            </div>

            <div className="glass-panel p-6 sm:p-8 rounded-3xl">
                <div className="flex flex-col gap-2 mb-8 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error">
                          <ShieldAlert size={20} />
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight">Security</h2>
                  </div>
                  <p className="text-sm font-medium text-base-content/60 mt-2">Manage your password and active sessions</p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-5 max-w-md">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Lock className="w-5 h-5"/> Change Password</h3>
                    <div className="form-control">
                        <label className="label"><span className="label-text font-medium text-base-content/70">Current Password</span></label>
                        <input 
                            type="password" 
                            className="input bg-base-200/50 border-white/5 focus:border-primary/50 focus:bg-base-200 rounded-xl w-full" 
                            placeholder="••••••••"
                            value={pwdData.currentPassword}
                            onChange={(e) => setPwdData({...pwdData, currentPassword: e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text font-medium text-base-content/70">New Password</span></label>
                        <input 
                            type="password" 
                            className="input bg-base-200/50 border-white/5 focus:border-primary/50 focus:bg-base-200 rounded-xl w-full" 
                            placeholder="••••••••"
                            value={pwdData.newPassword}
                            onChange={(e) => setPwdData({...pwdData, newPassword: e.target.value})}
                            required
                            minLength={6}
                        />
                    </div>
                    <button type="submit" disabled={isChangingPwd || !pwdData.currentPassword || !pwdData.newPassword} className="btn btn-primary mt-2 rounded-xl">
                        {isChangingPwd ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-white/10">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><MonitorSmartphone className="w-5 h-5"/> Device Management</h3>
                    <p className="text-sm text-base-content/70 mb-6 max-w-md">If you notice suspicious activity, you can sign out of all active sessions across all your devices.</p>
                    
                    <button 
                        onClick={handleLogoutAll} 
                        disabled={isLoggingOutAll}
                        className="btn btn-outline btn-error rounded-xl"
                    >
                        {isLoggingOutAll ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign out of all devices"}
                    </button>
                </div>
            </div>
        </div>

        {/* Right Column - Preview */}
        <div className="lg:col-span-1">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl sticky top-24">
                <h3 className="text-lg font-bold mb-6 tracking-tight">Live Preview</h3>
                
                <div className="rounded-2xl border border-white/10 overflow-hidden bg-base-100 shadow-2xl relative">
                <div className="absolute inset-0 bg-[url('/chat-pattern.png')] opacity-5 pointer-events-none" />
                <div className="relative z-10 flex flex-col h-full">
                    {/* Chat Header */}
                    <div className="px-4 py-3 bg-base-200/90 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold shadow-sm">
                        J
                        </div>
                        <div>
                        <h3 className="font-semibold text-[15px] leading-tight">John Doe</h3>
                        <p className="text-[11px] font-medium text-success">Online</p>
                        </div>
                    </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="p-4 space-y-4 min-h-[240px] bg-transparent flex-1">
                    {PREVIEW_MESSAGES.map((message) => (
                        <div
                        key={message.id}
                        className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                        >
                        <div
                            className={`
                            max-w-[85%] rounded-2xl p-3.5 shadow-sm relative
                            ${message.isSent ? "bg-primary text-primary-content rounded-br-sm" : "bg-base-200/80 backdrop-blur-sm text-base-content rounded-bl-sm border border-white/5"}
                            `}
                        >
                            <p className="text-[14.5px] leading-snug">{message.content}</p>
                            <div
                            className={`
                                text-[10px] mt-1.5 font-medium flex justify-end gap-1 items-center
                                ${message.isSent ? "text-primary-content/70" : "text-base-content/50"}
                            `}
                            >
                            12:00 PM
                            {message.isSent && <span className="text-info">✓✓</span>}
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 bg-base-200/90 backdrop-blur-md border-t border-white/5">
                    <div className="flex gap-2">
                        <input
                        type="text"
                        className="input flex-1 text-sm h-10 bg-base-100 border-none focus:outline-none rounded-xl"
                        placeholder="Type a message..."
                        readOnly
                        />
                        <button className="btn btn-primary btn-circle min-h-0 w-10 h-10 shadow-md">
                        <Send size={18} className="ml-0.5" />
                        </button>
                    </div>
                    </div>
                </div>
                </div>
            </div>
        </div>

      </div>
    </motion.div>
  );
};
export default SettingsPage;
