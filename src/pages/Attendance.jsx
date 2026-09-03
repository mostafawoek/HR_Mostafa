import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Clock, Plus, Search, Download, X, Calendar, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useHrLabels } from '@/lib/hrHelpers';
import { exportToCSV } from '@/lib/excelUtils';

export default function Attendance() {
  const { t, lang } = useLanguage();
  const { attendanceStatusLabels, formatDate, formatTime } = useHrLabels();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [form, setForm] = useState({ employee_id: '', employee_name: '', date: '', check_in: '09:00', check_out: '17:00', status: 'present', notes: '' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [att, emps] = await Promise.all([
        base44.entities.Attendance.list('-date', 200),
        base44.entities.Employee.list()
      ]);
      setRecords(att);
      setEmployees(emps);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const calcHours = (cin, cout) => {
    if (!cin || !cout) return 0;
    const [h1, m1] = cin.split(':').map(Number);
    const [h2, m2] = cout.split(':').map(Number);
    return Math.round(((h2 * 60 + m2) - (h1 * 60 + m1)) / 60 * 10) / 10;
  };

  const handleSave = async () => {
    if (!form.employee_name || !form.date) return;
    setSaving(true);
    try {
      const work_hours = calcHours(form.check_in, form.check_out);
      await base44.entities.Attendance.create({ ...form, work_hours });
      setShowForm(false);
      setForm({ employee_id: '', employee_name: '', date: '', check_in: '09:00', check_out: '17:00', status: 'present', notes: '' });
      loadData();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Attendance.delete(id);
    loadData();
  };

  const selectEmployee = (id) => {
    const emp = employees.find(e => e.id === id);
    setForm(f => ({ ...f, employee_id: id, employee_name: emp?.full_name || '' }));
  };

  const filtered = records.filter(r => {
    const matchSearch = !search || r.employee_name?.includes(search);
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchDate = !filterDate || r.date === filterDate;
    return matchSearch && matchStatus && matchDate;
  });

  const stats = {
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    leave: records.filter(r => r.status === 'leave').length,
  };

  const handleExport = () => {
    exportToCSV(lang === 'ar' ? 'سجل_الحضور' : 'attendance_log', [
      { key: 'employee_name', label: t.att_col_employee },
      { key: 'date', label: t.att_col_date },
      { key: 'check_in', label: t.att_col_in },
      { key: 'check_out', label: t.att_col_out },
      { key: 'work_hours', label: t.att_col_hours },
      { key: 'status', label: t.att_col_status },
      { key: 'notes', label: t.notes },
    ], filtered);
  };

  const statCards = [
    { label: t.att_present, value: stats.present, icon: CheckCircle2, color: 'from-emerald-500 to-teal-600' },
    { label: t.att_absent, value: stats.absent, icon: XCircle, color: 'from-rose-500 to-red-600' },
    { label: t.att_late, value: stats.late, icon: AlertCircle, color: 'from-amber-500 to-orange-600' },
    { label: t.att_leave, value: stats.leave, icon: Clock, color: 'from-violet-500 to-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gradient">{t.att_title}</h1>
          <p className="text-muted-foreground mt-1">{t.att_sub}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" /> {t.exportExcel}
          </Button>
          <Button onClick={() => setShowForm(true)} className="gap-2 gradient-primary text-white">
            <Plus className="w-4 h-4" /> {t.att_record}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5 border border-border/50"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
              <s.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-extrabold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 border border-border/50 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label className="mb-1.5">{t.att_searchName}</Label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.att_searchPh} className="pr-9" />
          </div>
        </div>
        <div className="min-w-[150px]">
          <Label className="mb-1.5">{t.status}</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.all}</SelectItem>
              {Object.entries(attendanceStatusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[150px]">
          <Label className="mb-1.5">{t.date}</Label>
          <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>
      </div>

      {/* Records */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-border/50">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t.att_empty}</p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-right">
                  <th className="p-4 font-semibold">{t.att_col_employee}</th>
                  <th className="p-4 font-semibold">{t.att_col_date}</th>
                  <th className="p-4 font-semibold">{t.att_col_in}</th>
                  <th className="p-4 font-semibold">{t.att_col_out}</th>
                  <th className="p-4 font-semibold">{t.att_col_hours}</th>
                  <th className="p-4 font-semibold">{t.att_col_status}</th>
                  <th className="p-4 font-semibold">{t.att_col_action}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-t border-border/50 hover:bg-muted/30"
                  >
                    <td className="p-4 font-medium">{r.employee_name}</td>
                    <td className="p-4 text-muted-foreground">{formatDate(r.date)}</td>
                    <td className="p-4">{formatTime(r.check_in)}</td>
                    <td className="p-4">{formatTime(r.check_out)}</td>
                    <td className="p-4">
                      <span className={`font-bold ${r.work_hours >= 8 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {r.work_hours || 0} {t.att_hoursShort}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${attendanceStatusLabels[r.status]?.color}`}>
                        {attendanceStatusLabels[r.status]?.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="text-rose-500 hover:bg-rose-500/10">
                        <X className="w-4 h-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-border"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold">{t.att_formTitle}</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-5 h-5" /></Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="mb-1.5">{t.employee}</Label>
                  <Select onValueChange={selectEmployee}>
                    <SelectTrigger><SelectValue placeholder={t.selectEmployee} /></SelectTrigger>
                    <SelectContent>
                      {employees.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5">{t.date}</Label>
                    <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div>
                    <Label className="mb-1.5">{t.status}</Label>
                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(attendanceStatusLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5">{t.att_checkIn}</Label>
                    <Input type="time" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} />
                  </div>
                  <div>
                    <Label className="mb-1.5">{t.att_checkOut}</Label>
                    <Input type="time" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5">{t.notes}</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-white">
                  {saving ? t.saving : t.att_saveRecord}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}