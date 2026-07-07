import React, { useState } from "react";
import { loginUser, registerUser } from "../services/db";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User as UserIcon, Sparkles, Eye, EyeOff } from "lucide-react";

interface LoginViewProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailClean = email.trim();
    const passClean = password.trim();
    const nameClean = name.trim();

    if (!emailClean || !passClean || (!isLogin && !nameClean)) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const res = await loginUser(emailClean, passClean);
        onAuthSuccess(res.token, res.user);
      } else {
        const res = await registerUser(emailClean, passClean, nameClean);
        onAuthSuccess(res.token, res.user);
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-transparent text-slate-800 dark:text-slate-100 font-sans relative">
      {/* Background glowing bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="glow-blob animate-blob-1 w-[350px] h-[350px] bg-blue-400/15 dark:bg-blue-600/5 top-1/4 left-1/4" />
        <div className="glow-blob animate-blob-2 w-[400px] h-[400px] bg-purple-300/20 dark:bg-purple-900/5 bottom-1/4 right-1/4" />
      </div>

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative z-10 shadow-2xl">
        {/* Logo and Greeting Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/25 mb-4">
            💧
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome to <span className="gemini-text-gradient font-black">HydraWalk</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
            <Sparkles size={12} className="text-[#a87ffb]" />
            Sync your desktop & phone hydration cycles.
          </p>
        </div>

        {/* Tab Headers */}
        <div className="grid grid-cols-2 p-1 bg-[#f0f4f9] dark:bg-[#131314] border border-[#e3e3e3] dark:border-[#2e2e2f] rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isLogin
                ? "bg-white dark:bg-[#1e1e1f] text-[#1a73e8] dark:text-[#8ab4f8] shadow-sm border border-slate-200/50 dark:border-slate-800/50"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isLogin
                ? "bg-white dark:bg-[#1e1e1f] text-[#1a73e8] dark:text-[#8ab4f8] shadow-sm border border-slate-200/50 dark:border-slate-800/50"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Auth Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-1"
              >
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-3 pl-10 pr-4 bg-[#f0f4f9] dark:bg-[#131314] border border-[#e3e3e3] dark:border-[#2e2e2f] rounded-xl text-xs font-bold focus:outline-none focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] transition-all text-slate-800 dark:text-slate-200"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={14} />
              </div>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 pl-10 pr-4 bg-[#f0f4f9] dark:bg-[#131314] border border-[#e3e3e3] dark:border-[#2e2e2f] rounded-xl text-xs font-bold focus:outline-none focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] transition-all text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={14} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 pl-10 pr-10 bg-[#f0f4f9] dark:bg-[#131314] border border-[#e3e3e3] dark:border-[#2e2e2f] rounded-xl text-xs font-bold focus:outline-none focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] transition-all text-slate-800 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl text-center font-bold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#1a73e8] via-[#a87ffb] to-[#f472b6] text-white font-bold rounded-xl active:scale-98 transition-all cursor-pointer hover:opacity-90 disabled:opacity-50 text-xs shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
