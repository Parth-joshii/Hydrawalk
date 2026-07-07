import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { User, Activity, Settings as SettingsIcon, Volume2, VolumeX, Moon, Sun, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { setAutostart } from "../services/autostart";

export const FirstTimeSetup: React.FC = () => {
  const { updateProfile } = useApp();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    gender: "Female",
    age: 26,
    weight: 65, // in kg
    wake_time: "07:00",
    sleep_time: "23:00",
    daily_goal: 2275, // auto calculated (65 * 35)
    reminder_interval: 60, // in minutes
    sound_enabled: true,
    sound_volume: 0.5,
    startup_enabled: true,
    overlay_enabled: true,
    theme: "dark" as "light" | "dark",
    animations_enabled: true,
    character_outfit: "hoodie_blue",
    language: "en",
  });

  // Recalculate daily goal when weight changes
  useEffect(() => {
    const calculatedGoal = Math.round(formData.weight * 35);
    setFormData((prev) => ({ ...prev, daily_goal: calculatedGoal }));
  }, [formData.weight]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === "number") {
      finalValue = parseFloat(value);
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleToggle = (name: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleNext = () => {
    if (step === 1 && !formData.name.trim()) return;
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const finalProfile = {
      ...formData,
      member_since: new Date().toISOString(),
    };

    try {
      await updateProfile(finalProfile);
    } catch (err) {
      console.error("Failed to complete first-time setup:", err);
      setSubmitError("Setup could not be saved. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Startup is optional; never let it block completing the profile setup.
    void (async () => {
      try {
        await setAutostart(formData.startup_enabled);
      } catch (err) {
        console.error("Failed to set autostart registry configuration:", err);
      }
    })();
  };

  // Steps variants
  const slideVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-transparent text-slate-900 dark:text-slate-100 selection:bg-blue-500/30">
      {/* Background glowing bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bubble w-12 h-12 left-10" style={{ animationDelay: "0s", animationDuration: "12s" }}></div>
        <div className="bubble w-8 h-8 left-1/4" style={{ animationDelay: "2s", animationDuration: "16s" }}></div>
        <div className="bubble w-16 h-16 right-1/4" style={{ animationDelay: "4s", animationDuration: "14s" }}></div>
        <div className="bubble w-10 h-10 right-10" style={{ animationDelay: "1s", animationDuration: "18s" }}></div>
      </div>

      <div className="w-full max-w-xl glass-panel p-8 rounded-3xl relative z-10 overflow-hidden">
        {/* Header Progress Indicators */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-sm font-semibold tracking-wider text-blue-400 uppercase">
            Step {step} of 3
          </span>
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? "w-8 bg-blue-500"
                    : s < step
                    ? "w-2 bg-blue-500/50"
                    : "w-2 bg-slate-700"
                }`}
              ></div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                  Create Your Profile
                </h1>
                <p className="text-slate-400">
                  Let's gather some basic stats to optimize your daily hydration goal.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                    <User size={16} className="text-blue-400" /> What should we call you?
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                    >
                      <option>Female</option>
                      <option>Male</option>
                      <option>Non-binary</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      min="1"
                      max="120"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                    <Activity size={16} className="text-blue-400" /> Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    min="10"
                    max="300"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    We use your weight to calculate a standard daily hydration intake.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!formData.name.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 disabled:text-slate-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                  Daily Schedule
                </h1>
                <p className="text-slate-400">
                  Set your waking hours and how often you want to be reminded.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Wake Up Time
                    </label>
                    <input
                      type="time"
                      name="wake_time"
                      value={formData.wake_time}
                      onChange={handleChange}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Sleep Time
                    </label>
                    <input
                      type="time"
                      name="sleep_time"
                      value={formData.sleep_time}
                      onChange={handleChange}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Reminder Interval
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[30, 45, 60, 90, 120].map((interval) => (
                      <button
                        key={interval}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, reminder_interval: interval }))
                        }
                        className={`py-2.5 px-1 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                          formData.reminder_interval === interval
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600"
                        }`}
                      >
                        {interval}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-300">
                      Calculated Water Goal: <span className="text-blue-400 font-bold">{formData.daily_goal} ml</span>
                    </label>
                  </div>
                  <input
                    type="range"
                    name="daily_goal"
                    min="1000"
                    max="5000"
                    step="50"
                    value={formData.daily_goal}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, daily_goal: parseInt(e.target.value) }))
                    }
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>1.0 L</span>
                    <span>3.0 L</span>
                    <span>5.0 L</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-5 py-3 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                  Preferences
                </h1>
                <p className="text-slate-400">
                  Fine-tune how HydraWalk interacts with you.
                </p>
              </div>

              <div className="space-y-4">
                {/* Preference Toggles */}
                <div className="flex items-center justify-between p-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    {formData.sound_enabled ? (
                      <Volume2 className="text-blue-400" size={20} />
                    ) : (
                      <VolumeX className="text-slate-500" size={20} />
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-white">Reminder Sounds</h4>
                      <p className="text-xs text-slate-400">Play a pleasant chime when reminding.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("sound_enabled")}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                      formData.sound_enabled ? "bg-blue-500" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        formData.sound_enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <SettingsIcon className="text-blue-400" size={20} />
                    <div>
                      <h4 className="text-sm font-semibold text-white">Launch on Startup</h4>
                      <p className="text-xs text-slate-400">Start app minimized when Windows boots.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("startup_enabled")}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                      formData.startup_enabled ? "bg-blue-500" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        formData.startup_enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400 text-lg">🚶‍♀️</span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Desktop Overlay Walk</h4>
                      <p className="text-xs text-slate-400">Show the walking girl animation on screen.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("overlay_enabled")}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                      formData.overlay_enabled ? "bg-blue-500" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        formData.overlay_enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    {formData.theme === "dark" ? (
                      <Moon className="text-purple-400" size={20} />
                    ) : (
                      <Sun className="text-yellow-400" size={20} />
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-white">Color Theme</h4>
                      <p className="text-xs text-slate-400">Toggle dark mode or light mode.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        theme: prev.theme === "dark" ? "light" : "dark",
                      }))
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-650 text-xs font-semibold rounded-lg text-slate-200 transition-all cursor-pointer"
                  >
                    {formData.theme === "dark" ? "Dark Mode" : "Light Mode"}
                  </button>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-3 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer disabled:cursor-wait"
                >
                  {isSubmitting ? "Saving..." : "Complete Setup"} <Check size={18} />
                </button>
              </div>
              {submitError && (
                <p className="text-sm font-semibold text-red-300 bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3">
                  {submitError}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
