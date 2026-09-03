import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Users, CalendarDays, AlertTriangle, FileText, Building2, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { statusLabels, leaveStatusLabels } from '@/lib/hrHelpers';
import { useLanguage } from '@/lib/i18n';

export default function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ employees: 0, leaves: 0, warnings: 0, documents: 0, departments: 0, pending: 0, active: 0 });
  const [byDept, setByDept] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [emps, leaves, warns, docs, depts] = await Promise.all([
          base44.entities.Employee.list(),
          base44.entities.Leave.list(),
          base44.entities.Warning.list(),
          base44.entities.Document.list(),
          base44.entities.Department.list(),
        ]);
        const active = emps.filter(e => e.status === 'active').length;
        const pending = leaves.filter(l => l.status === 'pending').length;
        setStats({
          employees: emps.length, leaves: leaves.length, warnings: warns.length,
          documents: docs.length, departments: depts.length, pending, active,
        });
        // department distribution
        const deptMap = {};
        emps.forEach(e => { const d = e.department || t.noDept; deptMap[d] = (deptMap[d] || 0) + 1; });
        setByDept(Object.entries(deptMap).map(([name, value]) => ({ name, value })));
        // leave status pie
        const statusMap = { pending: 0, approved: 0, rejected: 0 };
        leaves.forEach(l => { statusMap[l.status] = (statusMap[l.status] || 0) + 1; });
        setByStatus([
          { name: t.pending, value: statusMap.pending },
          { name: t.approved, value: statusMap.approved },
          { name: t.rejected, value: statusMap.rejected },
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    { label: t.totalEmployees, value: stats.employees, sub: `${stats.active} ${t.active}`, icon: Users, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30' },
    { label: t.leaves, value: stats.leaves, sub: `${stats.pending} ${t.pendingReview}`, icon: CalendarDays, gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/30' },
    { label: t.warnings, value: stats.warnings, sub: t.needsAttention, icon: AlertTriangle, gradient: 'from-rose-500 to-red-600', glow: 'shadow-rose-500/30' },
    { label: t.documents, value: stats.documents, sub: t.uploaded, icon: FileText, gradient: 'from-cyan-500 to-sky-600', glow: 'shadow-cyan-500/30' },
    { label: t.departments, value: stats.departments, sub: t.activeDepts, icon: Building2, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30' },
  ];

  const PIE_COLORS = ['#f59e0b', '#10b981', '#f43f5e'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-3xl p-5 border border-border/50 hover:scale-[1.03] transition-transform duration-300 cursor-default"
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg ${c.glow} mb-3`}>
              <c.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-extrabold text-foreground">{c.value}</p>
            <p className="text-sm font-medium text-foreground/80 mt-1">{c.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-3xl p-6 border border-border/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-lg">{t.deptDist}</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byDept}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'Tajawal' }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '1rem', fontFamily: 'Tajawal' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {byDept.map((_, i) => (
                  <Cell key={i} fill={`hsl(${160 + i * 25}, 70%, 38%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-3xl p-6 border border-border/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-lg">{t.leaveStatus}</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4}>
                {byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '1rem', fontFamily: 'Tajawal' }} />
              <Legend wrapperStyle={{ fontFamily: 'Tajawal', fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Quick info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-3xl p-6 border border-border/50"
      >
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-lg">{t.quickOverview}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
            <p className="text-2xl font-extrabold text-emerald-600">{stats.active}</p>
            <p className="text-sm text-muted-foreground">{t.activeEmployee}</p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10">
            <p className="text-2xl font-extrabold text-amber-600">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">{t.pendingLeave}</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
            <p className="text-2xl font-extrabold text-emerald-600">{stats.departments}</p>
            <p className="text-sm text-muted-foreground">{t.deptCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10">
            <p className="text-2xl font-extrabold text-cyan-600">{stats.documents}</p>
            <p className="text-sm text-muted-foreground">{t.uploadedDoc}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}