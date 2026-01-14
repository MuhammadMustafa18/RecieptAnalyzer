"use client";

import { useEffect, useState } from 'react';
import ReceiptUploader from '@/components/ReceiptUploader';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Wallet, Receipt, AlertCircle,
  ChevronRight, Calendar, Tag, CreditCard,
  ArrowUpRight, DollarSign, Activity, Settings
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#39ff14', '#00f3ff', '#ff00ff', '#fffd00', '#ff0000', '#ffffff'];

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(1000);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('expenses');
    if (saved) setExpenses(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('expenses', JSON.stringify(expenses));
    }
  }, [expenses, mounted]);

  const handleNewReceipt = (data) => {
    setExpenses(prev => [data, ...prev]);
  };

  const totalMonthly = expenses
    .filter(e => {
      try {
        const date = parseISO(e.date);
        const now = new Date();
        return isWithinInterval(date, {
          start: startOfMonth(now),
          end: endOfMonth(now)
        });
      } catch { return false; }
    })
    .reduce((acc, curr) => acc + curr.total, 0);

  const categoryData = Object.entries(
    expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.total;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const dailyData = expenses
    .filter(e => {
      try {
        return !isNaN(new Date(e.date).getTime());
      } catch { return false; }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc, curr) => {
      try {
        const d = new Date(curr.date);
        const dateStr = format(d, 'MMM dd');
        const existing = acc.find(d => d.date === dateStr);
        if (existing) existing.amount += curr.total;
        else acc.push({ date: dateStr, amount: curr.total });
      } catch (err) { }
      return acc;
    }, [])
    .slice(-7);

  if (!mounted) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#39ff1410,_transparent_50%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-10"
        >
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div variants={itemVariants}>

              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                Task 3
              </h1>

            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center gap-3">
              <div className="glass px-6 py-3 flex items-center gap-4">
                <div className="p-2.5 bg-primary text-black">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Reporting Period</p>
                  <p className="text-sm font-bold text-white">{format(new Date(), 'MMMM yyyy')}</p>
                </div>
              </div>

            </motion.div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Monthly Spending', value: `$${totalMonthly.toFixed(2)}`, icon: Wallet, color: 'indigo', trend: '+12%' },
              { label: 'Total Receipts', value: expenses.length, icon: Receipt, color: 'emerald', trend: '+5' },
              { label: 'Daily Average', value: `$${(totalMonthly / 30).toFixed(2)}`, icon: DollarSign, color: 'purple', trend: '-2%' },
              { label: 'Budget Status', value: totalMonthly > budget ? 'Over Limit' : 'On Track', icon: AlertCircle, color: totalMonthly > budget ? 'rose' : 'amber' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="glass p-6 relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.05] transition-opacity`}>
                  <stat.icon className="w-24 h-24" />
                </div>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 bg-zinc-900 text-primary`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-sm font-bold text-zinc-500 tracking-wide">{stat.label}</p>
                <p className="text-2xl font-black text-white mt-1">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
              <motion.div variants={itemVariants} className="glass p-8">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl text-white tracking-tight">Financial Trajectory</h3>
                    <p className="text-sm text-zinc-500 font-medium">Visualizing your spending velocity</p>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-900 p-1.5 border border-zinc-800">
                    <button className="px-4 py-1.5 bg-zinc-800 text-primary text-xs font-bold">Daily</button>
                    <button className="px-4 py-1.5 text-zinc-500 text-xs font-bold hover:text-zinc-300">Weekly</button>
                  </div>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#39ff14" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#39ff14" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }}
                        dx={-10}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '0', background: '#101014', border: '1px solid #27272a', padding: '15px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#39ff14"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorAmt)"
                        animationBegin={800}
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="glass overflow-hidden">
                <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                  <div>
                    <h3 className="text-xl text-white tracking-tight">Recent </h3>
                    <p className="text-sm text-zinc-500 font-medium">The last 5 transaction captures</p>
                  </div>

                </div>
                <div className="divide-y divide-zinc-800">
                  <AnimatePresence>
                    {expenses.length > 0 ? (
                      expenses.slice(0, 5).map((expense, idx) => (
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          key={expense.id}
                          className="p-6 flex items-center gap-5 hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                        >
                          <div className="w-14 h-14 bg-zinc-900 flex items-center justify-center text-zinc-600 border border-zinc-800 group-hover:border-primary/30 group-hover:scale-110 transition-all">
                            <Tag className="w-6 h-6 group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-white truncate tracking-tight">{expense.merchant}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-primary font-bold tracking-wider uppercase">{expense.category}</span>
                              <span className="w-1 h-1 bg-zinc-800" />
                              <span className="text-xs text-zinc-500 font-medium tracking-tight">{expense.date}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-white leading-none">${expense.total.toFixed(2)}</p>
                            <div className="inline-flex items-center text-[10px] font-bold text-primary opacity-60 mt-1">
                              Processed
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 flex items-center justify-center mx-auto mb-6 text-slate-200 group animate-pulse">
                          <CreditCard className="w-10 h-10" />
                        </div>
                        <p className="text-slate-500 text-lg font-bold tracking-tight">No intelligence captured yet</p>
                        <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Upload your first receipt using the capture module to see results.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <motion.div variants={itemVariants} className="animate-float">
                <ReceiptUploader onResult={handleNewReceipt} />
              </motion.div>

              <motion.div variants={itemVariants} className="glass p-8">
                <h3 className="text-xl font-black text-white mb-8 tracking-tight">Cluster Allocation</h3>
                <div className="h-[250px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={80}
                        outerRadius={105}
                        paddingAngle={8}
                        dataKey="value"
                        animationDuration={1500}
                        animationBegin={500}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Diversification</p>
                    <p className="text-2xl font-black text-white">{categoryData.length}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sectors</p>
                  </div>
                </div>
                <div className="mt-10 space-y-4">
                  {categoryData.slice(0, 4).map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 ring-2 ring-zinc-900 border border-white/10" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-zinc-400 font-bold tracking-tight">{cat.name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm text-white font-black tracking-tighter">${cat.value.toFixed(2)}</span>
                        <div className="w-16 h-1 bg-zinc-800 mt-2 overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(cat.value / totalMonthly) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {categoryData.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-xs text-zinc-600 font-medium">Categorization pending scan...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
