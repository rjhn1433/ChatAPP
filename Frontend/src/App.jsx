import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";
import { useChatStore } from "./store/useChatStore";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const { theme } = useThemeStore();

  console.log({ onlineUsers });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!authUser) return;

    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, [authUser, subscribeToMessages, unsubscribeFromMessages]);

  console.log({ authUser });

  const location = useLocation();

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen bg-base-300">
        <Loader className="size-10 animate-spin text-primary" />
      </div>
    );

  return (
    <div data-theme={theme} className="h-screen flex flex-col bg-base-300 relative overflow-hidden">
      <Navbar />

      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
            <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
            <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/forgot-password" element={!authUser ? <ForgotPasswordPage /> : <Navigate to="/" />} />
            <Route path="/reset-password/:token" element={!authUser ? <ResetPasswordPage /> : <Navigate to="/" />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
          </Routes>
        </AnimatePresence>
      </main>

      <Toaster />
    </div>
  );
};
export default App;
