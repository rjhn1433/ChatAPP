import { useState } from "react";
import { Loader2, Lock, MessageSquare } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import AuthImagePattern from "../components/AuthImagePattern";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post(`/auth/reset-password/${token}`, { password });
      toast.success("Password reset successfully. You can now login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen grid lg:grid-cols-2 pt-16 bg-base-300"
    >
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 z-10 relative">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 mix-blend-screen" />
        <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-3xl">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30"
              >
                <MessageSquare className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold mt-4 tracking-tight">New Password</h1>
              <p className="text-base-content/60 font-medium">Create a new secure password</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content/80">New Password</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-base-content/40 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="password"
                  className="input w-full pl-11 bg-base-200/50 border-base-content/10 focus:border-primary focus:bg-base-200 transition-all rounded-xl"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content/80">Confirm Password</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-base-content/40 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="password"
                  className="input w-full pl-11 bg-base-200/50 border-base-content/10 focus:border-primary focus:bg-base-200 transition-all rounded-xl"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="btn btn-primary w-full rounded-xl shadow-lg shadow-primary/30 mt-2 font-semibold text-white border-none bg-gradient-to-r from-primary to-primary-focus" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </motion.button>
          </form>

          <div className="text-center mt-6">
            <Link to="/login" className="link link-hover text-primary font-medium">
              Back to Login
            </Link>
          </div>
        </div>
      </div>

      <AuthImagePattern
        title="Secure your account"
        subtitle="Make sure your new password is secure and unique."
      />
    </motion.div>
  );
};
export default ResetPasswordPage;
