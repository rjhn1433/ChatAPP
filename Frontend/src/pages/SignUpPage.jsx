import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullName.trim()) return toast.error("Full name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 6) return toast.error("Password must be at least 6 characters");

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = validateForm();
    if (success === true) signup(formData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen grid lg:grid-cols-2 pt-16 bg-base-300"
    >
      {/* left side */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 z-10 relative">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -z-10 mix-blend-screen" />
        
        <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-3xl">
          {/* LOGO */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30"
              >
                <MessageSquare className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold mt-4 tracking-tight">Create Account</h1>
              <p className="text-base-content/60 font-medium">Get started with your free account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content/80">Full Name</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="size-5 text-base-content/40 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  className="input w-full pl-11 bg-base-200/50 border-base-content/10 focus:border-primary focus:bg-base-200 transition-all rounded-xl"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content/80">Email</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="size-5 text-base-content/40 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="email"
                  className="input w-full pl-11 bg-base-200/50 border-base-content/10 focus:border-primary focus:bg-base-200 transition-all rounded-xl"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content/80">Password</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="size-5 text-base-content/40 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input w-full pl-11 bg-base-200/50 border-base-content/10 focus:border-primary focus:bg-base-200 transition-all rounded-xl"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-base-content/40" />
                  ) : (
                    <Eye className="size-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="btn btn-primary w-full rounded-xl shadow-lg shadow-primary/30 mt-2 font-semibold text-white border-none bg-gradient-to-r from-primary to-primary-focus" 
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>

          <div className="text-center mt-6">
            <p className="text-base-content/60 font-medium">
              Already have an account?{" "}
              <Link to="/login" className="link link-hover text-primary font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* right side */}
      <AuthImagePattern
        title="Join our community"
        subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
      />
    </motion.div>
  );
};
export default SignUpPage;
