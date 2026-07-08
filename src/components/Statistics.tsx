import React, { useState, useEffect } from "react";
import { getWaterLogsForRange, getReminderLogsForRange } from "../services/db";
import { useApp } from "../contexts/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { BarChart3, TrendingUp, Percent, Hourglass, CalendarRange, ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export const Statistics: React.FC = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly" | "hourly">("weekly");
  
  // Data states
  const [intakeData, setIntakeData] = useState<any[]>([]);
  const [outcomeData, setOutcomeData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [logsByDate, setLogsByDate] = useState<Record<string, { total: number; logs: any[] }>>({});

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  // Calendar calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const numDays = new Date(year, month + 1, 0).getDate();

  const daysArray: (Date | null)[] = Array.from({ length: firstDay }).map(() => null);
  for (let d = 1; d <= numDays; d++) {
    daysArray.push(new Date(year, month, d));
  }
  
  // Summary stats
  const [statsSummary, setStatsSummary] = useState({
    avgIntake: 0,
    complianceRate: 0,
    avgResponseSec: 0,
    totalIntake: 0,
  });

  useEffect(() => {
    async function loadStats() {
      // 1. Fetch raw logs (extended range for calendar visualization)
      const waterLogs = await getWaterLogsForRange(90);
      const reminderLogs = await getReminderLogsForRange(90);

      // --- GROUP LOGS BY LOCAL DATE KEY FOR CALENDAR ---
      const grouped: Record<string, { total: number; logs: any[] }> = {};
      waterLogs.forEach((log) => {
        const logDate = new Date(log.timestamp);
        const yyyy = logDate.getFullYear();
        const mm = String(logDate.getMonth() + 1).padStart(2, "0");
        const dd = String(logDate.getDate()).padStart(2, "0");
        const dateKey = `${yyyy}-${mm}-${dd}`;

        if (!grouped[dateKey]) {
          grouped[dateKey] = { total: 0, logs: [] };
        }
        grouped[dateKey].total += log.amount;
        grouped[dateKey].logs.push(log);
      });
      setLogsByDate(grouped);

      // --- WATER INTAKE PROCESSING ---
      const today = new Date();
      
      // Weekly: group last 7 days
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const last7Days = Array.from({ length: 7 }).map((_, idx) => {
        const d = new Date();
        d.setDate(today.getDate() - idx);
        return {
          dateStr: d.toISOString().split("T")[0],
          dayName: days[d.getDay()],
          amount: 0,
        };
      }).reverse();

      // Monthly: group last 30 days
      const last30Days = Array.from({ length: 30 }).map((_, idx) => {
        const d = new Date();
        d.setDate(today.getDate() - idx);
        return {
          dateStr: d.toISOString().split("T")[0],
          dayLabel: `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}`,
          amount: 0,
        };
      }).reverse();

      let totalIntake = 0;
      waterLogs.forEach((log) => {
        const logDate = log.timestamp.split("T")[0];
        
        // Accumulate for weekly
        const weeklyIdx = last7Days.findIndex((d) => d.dateStr === logDate);
        if (weeklyIdx !== -1) {
          last7Days[weeklyIdx].amount += log.amount;
        }

        // Accumulate for monthly
        const monthlyIdx = last30Days.findIndex((d) => d.dateStr === logDate);
        if (monthlyIdx !== -1) {
          last30Days[monthlyIdx].amount += log.amount;
        }

        totalIntake += log.amount;
      });

      // Filter and set data based on active view
      if (activeTab === "weekly") {
        setIntakeData(last7Days.map((d) => ({ name: d.dayName, amount: d.amount })));
      } else {
        setIntakeData(last30Days.map((d) => ({ name: d.dayLabel, amount: d.amount })));
      }

      // --- REMINDER OUTCOMES ---
      const outcomes = { Completed: 0, Overdue: 0, Skipped: 0, Snoozed: 0 };
      reminderLogs.forEach((r) => {
        if (outcomes[r.status] !== undefined) {
          outcomes[r.status]++;
        }
      });

      const outcomeChartData = [
        { name: "Completed", value: outcomes.Completed, color: "#10b981" },
        { name: "Overdue", value: outcomes.Overdue, color: "#ef4444" },
        { name: "Skipped", value: outcomes.Skipped, color: "#94a3b8" },
      ].filter((item) => item.value > 0);

      setOutcomeData(outcomeChartData);

      // --- HOURLY INTAKE ---
      const hoursMap = Array.from({ length: 24 }).map((_, h) => ({
        hour: `${h.toString().padStart(2, "0")}:00`,
        count: 0,
      }));

      waterLogs.forEach((log) => {
        const hour = new Date(log.timestamp).getHours();
        hoursMap[hour].count++;
      });
      setHourlyData(hoursMap.filter((_, idx) => idx >= 6 && idx <= 22)); // filter daytime hours to keep chart clean

      // --- METRIC SUMMARIES ---
      // Avg Intake (last 7 days average)
      const weeklyTotal = last7Days.reduce((acc, cur) => acc + cur.amount, 0);
      const avgIntake = Math.round(weeklyTotal / 7);

      // Compliance
      const totalReminders = outcomes.Completed + outcomes.Overdue + outcomes.Skipped;
      const complianceRate = totalReminders > 0 ? Math.round((outcomes.Completed / totalReminders) * 100) : 100;

      // Avg Response Time
      const completedReminders = reminderLogs.filter((r) => r.status === "Completed");
      const avgResponseSec = completedReminders.length > 0 
        ? Math.round(completedReminders.reduce((acc, cur) => acc + cur.response_time, 0) / completedReminders.length)
        : 0;

      setStatsSummary({
        avgIntake,
        complianceRate,
        avgResponseSec,
        totalIntake,
      });
    }

    loadStats();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      
      {/* Header title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Hydration Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">
          Detailed metrics compiled from your MongoDB activity log.
        </p>
      </div>

      {/* Grid: Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="p-6 glass-card rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase">Avg. Daily Intake</span>
            <span className="text-2xl font-black text-slate-850 dark:text-white">{statsSummary.avgIntake} ml</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Over the last 7 days</span>
          </div>
        </div>

        <div className="p-6 glass-card rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
            <Percent size={24} />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase">Compliance Rate</span>
            <span className="text-2xl font-black text-slate-850 dark:text-white">{statsSummary.complianceRate}%</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Completed reminders vs skips</span>
          </div>
        </div>

        <div className="p-6 glass-card rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
            <Hourglass size={24} />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase">Response Time</span>
            <span className="text-2xl font-black text-slate-850 dark:text-white">{statsSummary.avgResponseSec}s</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Average time to click Done</span>
          </div>
        </div>

        <div className="p-6 glass-card rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
            <CalendarRange size={24} />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase">Lifetime Volume</span>
            <span className="text-2xl font-black text-slate-850 dark:text-white">{(statsSummary.totalIntake / 1000).toFixed(2)} L</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">All-time logged volume</span>
          </div>
        </div>

      </div>

      {/* Grid: Graph Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Intake History Graph (Weekly/Monthly) */}
        <div className="lg:col-span-2 p-6 glass-card rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-400" /> Intake History
            </h2>
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <button
                onClick={() => setActiveTab("weekly")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  activeTab === "weekly"
                    ? "bg-blue-600 text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Weekly (7d)
              </button>
              <button
                onClick={() => setActiveTab("monthly")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  activeTab === "monthly"
                    ? "bg-blue-600 text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Monthly (30d)
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            {intakeData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                No history data logged yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={intakeData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="ml" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderColor: "rgba(59, 130, 246, 0.2)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                    name="Intake"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Reminder outcomes pie chart */}
        <div className="lg:col-span-1 p-6 glass-card rounded-2xl flex flex-col justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Reminder Distribution</h2>
          
          <div className="h-48 w-full flex items-center justify-center">
            {outcomeData.length === 0 ? (
              <div className="text-slate-500 text-xs">No reminders logged yet today.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {outcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-2 mt-4">
            {outcomeData.map((d, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span className="text-slate-400 font-semibold">{d.name}</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white">{d.value} logged</span>
              </div>
            ))}
            {outcomeData.length === 0 && (
              <div className="text-center text-[10px] text-slate-500">
                Data accumulates as you complete or snooze reminders.
              </div>
            )}
          </div>
        </div>

        {/* Full width bottom chart: Hourly heat distribution */}
        <div className="lg:col-span-3 p-6 glass-card rounded-2xl">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Hydration Hourly Activity</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    borderColor: "rgba(59, 130, 246, 0.2)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Drinks Logged" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            This graph highlights your most active drinking periods throughout the day.
          </p>
        </div>

        {/* Full width bottom: Hydration History Calendar */}
        <div className="lg:col-span-3 p-6 glass-card rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CalendarRange size={18} className="text-blue-400" /> Hydration Calendar
            </h2>
            
            {/* Month Selectors */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 bg-[#f0f4f9] dark:bg-slate-800 border border-[#e3e3e3] dark:border-slate-700 hover:bg-[#e8f0fe] dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer transition-all active:scale-95"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-black uppercase tracking-widest px-3 text-slate-800 dark:text-slate-100">
                {currentMonth.toLocaleString("en", { month: "long", year: "numeric" })}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 bg-[#f0f4f9] dark:bg-slate-800 border border-[#e3e3e3] dark:border-slate-700 hover:bg-[#e8f0fe] dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer transition-all active:scale-95"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {daysArray.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="bg-transparent aspect-square" />;
              }

              const yyyy = date.getFullYear();
              const mm = String(date.getMonth() + 1).padStart(2, "0");
              const dd = String(date.getDate()).padStart(2, "0");
              const dateKey = `${yyyy}-${mm}-${dd}`;
              
              const dayData = logsByDate[dateKey];
              const total = dayData?.total ?? 0;
              const isSelected = selectedDate === dateKey;
              const metGoal = user && total >= user.daily_goal;

              let cellStyle = "bg-[#f0f4f9]/30 dark:bg-[#131314]/30 border border-[#e3e3e3] dark:border-slate-800/40 hover:bg-[#f0f4f9]/70 dark:hover:bg-[#1e1e1f] text-slate-800 dark:text-slate-200";
              if (total > 0) {
                if (metGoal) {
                  cellStyle = "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400 font-extrabold shadow-sm shadow-blue-500/5";
                } else {
                  cellStyle = "bg-sky-500/5 border-sky-500/25 text-sky-600 dark:text-sky-400 font-bold";
                }
              }

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                  className={`aspect-square p-1.5 rounded-xl transition-all flex flex-col justify-between items-center cursor-pointer active:scale-95 ${cellStyle} ${
                    isSelected ? "ring-2 ring-blue-500 border-transparent shadow-md" : ""
                  }`}
                >
                  <span className="text-[10px] font-bold self-start">{date.getDate()}</span>
                  {total > 0 && (
                    <span className="text-[9px] font-black tracking-tight leading-none text-blue-500 dark:text-blue-400 mb-0.5">
                      {total >= 1000 ? `${(total / 1000).toFixed(1)}L` : `${total}ml`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Details Card */}
          {selectedDate && (() => {
            const dayData = logsByDate[selectedDate];
            const logs = dayData?.logs ?? [];
            const [y, m, d] = selectedDate.split("-");
            const formattedDate = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div className="mt-6 p-5 bg-[#f0f4f9]/50 dark:bg-slate-900/40 border border-[#e3e3e3] dark:border-slate-800/50 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-500" /> Logged Intake: {formattedDate}
                  </h3>
                  {dayData && (
                    <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
                      Total: {dayData.total} ml
                    </span>
                  )}
                </div>

                {logs.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    No hydration logs saved for this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {logs.map((log, lIdx) => {
                      const timeStr = new Date(log.timestamp).toLocaleTimeString("en", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <div
                          key={log.id || lIdx}
                          className="bg-white dark:bg-[#1e1e1f] border border-slate-200/50 dark:border-slate-800/40 px-4 py-2.5 rounded-xl text-xs font-bold flex justify-between items-center"
                        >
                          <span className="text-slate-500 dark:text-slate-400">{timeStr}</span>
                          <span className="text-slate-800 dark:text-white font-extrabold">{log.amount} ml</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
};
