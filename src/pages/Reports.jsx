import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  FileBarChart, Download, Upload, Users, Wallet, Calendar, Award,
  TrendingUp, AlertTriangle, FileText, Building2
} from 'lucide-react';
import { exportToCSV, parseCSV } from '@/lib/excelUtils';
import { useLanguage } from '@/lib/i18n';
import { useHrLabels } from '@/lib/hrHelpers';

const CHART_COLORS = ['hsl(160 84% 30%)', 'hsl(38 95% 42%)', 'hsl(200 80% 40%)', 'hsl(142 60% 38%)', 'hsl(0 70% 48%)', 'hsl(28 85% 48%)'];

export default function Reports() {
  const { t, lang } = useLanguage();
  const { formatCurrency, formatDate } = useHrLabels();
  const [data, setData] = useState({
    employees: [], departments: [], leaves: [], warnings: [],
    attendance: [], salaries: [], performance: [], tasks: [], documents: []
  });
  const [loading, setLoading] = useState(true);
  const [importType, setImportType] = useState('Employee');
  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [employees, departments, leaves, warnings, attendance, salaries, performance, tasks, documents] = await Promise.all([
          base44.entities.Employee.list(),
          base44.entities.Department.list(),
          base44.entities.Leave.list(),
          base44.entities.Warning.list(),
          base44.entities.Attendance.list('-date', 500),
          base44.entities.Salary.list('-month', 500),
          base44.entities.Performance.list(),
          base44.entities.Task.list(),
          base44.entities.Document.list(),
        ]);
        setData({ employees, departments, leaves, warnings, attendance, salaries, performance, tasks, documents });
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  // Department distribution
  const deptData = React.useMemo(() => {
    const map = {};
    data.employees.forEach(e => { const d = e.department || t.noDept; map[d] = (map[d] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [data.employees, t.noDept]);

  // Attendance trend (last 7 days)
  const attendanceTrend = React.useMemo(() => {
    const map = {};
    data.attendance.forEach(a => {
      map[a.date] = map[a.date] || { date: a.date, present: 0, absent: 0, late: 0 };
      if (a.status === 'present') map[a.date].present++;
      else if (a.status === 'absent') map[a.date].absent++;
      else if (a.status === 'late') map[a.date].late++;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  }, [data.attendance]);

  // Salary by month
  const salaryByMonth = React.useMemo(() => {
    const map = {};
    data.salaries.forEach(s => { map[s.month] = map[s.month] || { month: s.month, total: 0, paid: 0 }; map[s.month].total += s.net_salary || 0; if (s.status === 'paid') map[s.month].paid += s.net_salary || 0; });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [data.salaries]);

  // Performance distribution
  const perfData = React.useMemo(() => {
    const buckets = { [t.rep_perf_5]: 0, [t.rep_perf_4]: 0, [t.rep_perf_3]: 0, [t.rep_perf_2]: 0, [t.rep_perf_1]: 0 };
    const order = [t.rep_perf_5, t.rep_perf_4, t.rep_perf_3, t.rep_perf_2, t.rep_perf_1];
    data.performance.forEach(p => {
      if (p.rating >= 5) buckets[t.rep_perf_5]++;
      else if (p.rating >= 4) buckets[t.rep_perf_4]++;
      else if (p.rating >= 3) buckets[t.rep_perf_3]++;
      else if (p.rating >= 2) buckets[t.rep_perf_2]++;
      else buckets[t.rep_perf_1]++;
    });
    return order.map(name => ({ name, value: buckets[name] }));
  }, [data.performance, t.rep_perf_5, t.rep_perf_4, t.rep_perf_3, t.rep_perf_2, t.rep_perf_1]);

  // Task status
  const taskStatusData = React.useMemo(() => {
    const map = { todo: 0, in_progress: 0, review: 0, done: 0 };
    data.tasks.forEach(tk => { map[tk.status] = (map[tk.status] || 0) + 1; });
    return [
      { name: t.task_col_todo, value: map.todo },
      { name: t.task_col_progress, value: map.in_progress },
      { name: t.task_col_review, value: map.review },
      { name: t.task_col_done, value: map.done },
    ];
  }, [data.tasks, t.task_col_todo, t.task_col_progress, t.task_col_review, t.task_col_done]);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const rows = await parseCSV(file);
      const entity = base44.entities[importType];
      const records = rows.map(r => {
        const obj = {};
        Object.keys(r).forEach(k => {
          const key = k.trim().toLowerCase();
          if (key) obj[k.trim()] = isNaN(r[k]) ? r[k] : Number(r[k]);
        });
        return obj;
      }).filter(r => Object.keys(r).length > 0);
      await entity.bulkCreate(records);
      alert(t.rep_importSuccess.replace('{n}', records.length));
      window.location.reload();
    } catch (err) {
      alert(t.rep_importError + ': ' + err.message);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const exportEmployees = () => exportToCSV(lang === 'ar' ? 'الموظفون' : 'employees', [
    { key: 'full_name', label: t.empf_fullName },
    { key: 'email', label: t.empf_email },
    { key: 'phone', label: t.empf_phone },
    { key: 'position', label: t.empf_position },
    { key: 'department', label: t.emp_dept },
    { key: 'salary', label: t.emp_salary },
    { key: 'status', label: t.status },
  ], data.employees);

  const exportSalaries = () => exportToCSV(lang === 'ar' ? 'تقرير_الرواتب' : 'salary_report', [
    { key: 'employee_name', label: t.employee },
    { key: 'month', label: t.sal_month },
    { key: 'base_salary', label: t.sal_col_base },
    { key: 'net_salary', label: t.sal_col_net },
    { key: 'status', label: t.status },
  ], data.salaries);

  const exportAttendance = () => exportToCSV(lang === 'ar' ? 'تقرير_الحضور' : 'attendance_report', [
    { key: 'employee_name', label: t.employee },
    { key: 'date', label: t.date },
    { key: 'status', label: t.status },
    { key: 'work_hours', label: t.att_col_hours },
  ], data.attendance);

  const summaryCards = [
    { label: t.totalEmployees, value: data.employees.length, icon: Users, color: 'from-blue-500 to-indigo-600' },
    { label: t.departments, value: data.departments.length, icon: Building2, color: 'from-emerald-500 to-teal-600' },
    { label: t.salaries, value: data.salaries.length, icon: Wallet, color: 'from-violet-500 to-purple-600' },
    { label: t.att_title, value: data.attendance.length, icon: Calendar, color: 'from-amber-500 to-orange-600' },
    { label: t.perf_tabReviews, value: data.performance.length, icon: Award, color: 'from-fuchsia-500 to-pink-600' },
    { label: t.perf_tabTasks, value: data.tasks.length, icon: TrendingUp, color: 'from-cyan-500 to-sky-600' },
    { label: t.warnings, value: data.warnings.length, icon: AlertTriangle, color: 'from-rose-500 to-red-600' },
    { label: t.documents, value: data.documents.length, icon: FileText, color: 'from-slate-500 to-slate-700' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gradient">{t.rep_title}</h1>
        <p className="text-muted-foreground mt-1">{t.rep_sub}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="glass rounded-2xl p-5 border border-border/50">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Export / Import Section */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 border border-border/50">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Download className="w-5 h-5 text-primary" /> {t.rep_exportTitle}</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={exportEmployees} className="gap-2 justify-start"><Users className="w-4 h-4" /> {t.nav_employees}</Button>
            <Button variant="outline" onClick={exportSalaries} className="gap-2 justify-start"><Wallet className="w-4 h-4" /> {t.nav_salaries}</Button>
            <Button variant="outline" onClick={exportAttendance} className="gap-2 justify-start"><Calendar className="w-4 h-4" /> {t.nav_attendance}</Button>
            <Button variant="outline" onClick={() => exportToCSV(lang === 'ar' ? 'تقرير_الإجازات' : 'leaves_report', [
              { key: 'employee_name', label: t.employee }, { key: 'type', label: t.leave_type },
              { key: 'start_date', label: t.leave_from }, { key: 'end_date', label: t.leave_to },
              { key: 'status', label: t.status },
            ], data.leaves)} className="gap-2 justify-start"><FileText className="w-4 h-4" /> {t.nav_leaves}</Button>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-border/50">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> {t.rep_importTitle}</h3>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">{t.rep_dataType}</Label>
              <select value={importType} onChange={e => setImportType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="Employee">{t.nav_employees}</option>
                <option value="Department">{t.nav_departments}</option>
                <option value="Attendance">{t.nav_attendance}</option>
                <option value="Salary">{t.nav_salaries}</option>
                <option value="Task">{t.perf_tabTasks}</option>
              </select>
            </div>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleImport}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground file:cursor-pointer hover:file:bg-primary/90" />
            <p className="text-xs text-muted-foreground">{t.rep_importHint}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Department Distribution */}
        <div className="glass rounded-2xl p-5 border border-border/50">
          <h3 className="font-bold mb-4">{t.rep_deptDist}</h3>
          {deptData.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{t.noData}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {deptData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Attendance Trend */}
        <div className="glass rounded-2xl p-5 border border-border/50">
          <h3 className="font-bold mb-4">{t.rep_attTrend}</h3>
          {attendanceTrend.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{t.noData}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="present" name={t.rep_presentLabel} stroke="hsl(142 71% 45%)" fill="hsl(142 71% 45% / 0.3)" />
                <Area type="monotone" dataKey="late" name={t.rep_lateLabel} stroke="hsl(38 92% 50%)" fill="hsl(38 92% 50% / 0.3)" />
                <Area type="monotone" dataKey="absent" name={t.rep_absentLabel} stroke="hsl(0 84% 60%)" fill="hsl(0 84% 60% / 0.3)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Salary by Month */}
        <div className="glass rounded-2xl p-5 border border-border/50">
          <h3 className="font-bold mb-4">{t.rep_monthlySal}</h3>
          {salaryByMonth.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{t.noData}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salaryByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="total" name={t.rep_totalLabel} fill="hsl(160 84% 30%)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="paid" name={t.rep_paidLabel} fill="hsl(38 95% 42%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Performance Distribution */}
        <div className="glass rounded-2xl p-5 border border-border/50">
          <h3 className="font-bold mb-4">{t.rep_perfDist}</h3>
          {perfData.every(d => d.value === 0) ? (
            <p className="text-center text-muted-foreground py-12">{t.noData}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={perfData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="value" name={t.rep_empCountLabel} fill="hsl(160 84% 30%)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Task Status Pie */}
      <div className="glass rounded-2xl p-5 border border-border/50">
        <h3 className="font-bold mb-4">{t.rep_taskStatus}</h3>
        {taskStatusData.every(d => d.value === 0) ? (
          <p className="text-center text-muted-foreground py-12">{t.noData}</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={taskStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {taskStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}