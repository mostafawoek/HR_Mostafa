import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, CalendarDays, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n';
import { useHrLabels } from '@/lib/hrHelpers';

export default function Leaves() {
  const { t } = useLanguage();
  const { leaveTypeLabels, leaveStatusLabels, formatDate } = useHrLabels();
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_name: '', employee_id: '', type: 'annual', start_date: '', end_date: '', reason: '' });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const [lv, emps] = await Promise.all([
        base44.entities.Leave.list('-created_date', 200),
        base44.entities.Employee.list(),
      ]);
      setLeaves(lv);
      setEmployees(emps);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const calcDays = (s, e) => {
    if (!s || !e) return 0;
    return Math.ceil((new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const days = calcDays(form.start_date, form.end_date);
    await base44.entities.Leave.create({ ...form, days, status: 'pending' });
    setForm({ employee_name: '', employee_id: '', type: 'annual', start_date: '', end_date: '', reason: '' });
    setShowForm(false);
    load();
  };

  const updateStatus = async (id, status) => {
    await base44.entities.Leave.update(id, { status });
    load();
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient">{t.leave_title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} {t.leave_count}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gradient-primary text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-emerald-500/30">
          <Plus className="w-5 h-5 ml-2" /> {t.leave_add}
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 h-11 rounded-2xl text-sm font-medium transition-all ${filter === s ? 'gradient-primary text-white shadow-lg' : 'glass border border-border/50'}`}>
            {s === 'all' ? t.all : leaveStatusLabels[s]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center border border-border/50">
          <CalendarDays className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">{t.leave_empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((l, i) => (
              <motion.div key={l.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.03 }}
                className="glass rounded-2xl p-5 border border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                    <CalendarDays className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">{l.employee_name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${leaveTypeLabels[l.type]?.color}`}>{leaveTypeLabels[l.type]?.label}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${leaveStatusLabels[l.status]?.color}`}>{leaveStatusLabels[l.status]?.label}</span>
                      <span className="text-xs text-muted-foreground">{l.days || calcDays(l.start_date, l.end_date)} {t.leave_days}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{formatDate(l.start_date)} ← {formatDate(l.end_date)}</p>
                    {l.reason && <p className="text-sm text-muted-foreground mt-1">{t.reason}: {l.reason}</p>}
                  </div>
                </div>
                {l.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => updateStatus(l.id, 'approved')} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"><Check className="w-4 h-4 ml-1" /> {t.leave_approve}</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(l.id, 'rejected')} className="rounded-xl text-rose-600 hover:bg-rose-50"><X className="w-4 h-4 ml-1" /> {t.leave_reject}</Button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
              className="glass rounded-3xl w-full max-w-md border border-border/50 shadow-2xl p-6">
              <h2 className="text-xl font-extrabold text-gradient mb-4">{t.leave_newTitle}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t.employee} *</Label>
                  <Select value={form.employee_id} onValueChange={v => {
                    const emp = employees.find(e => e.id === v);
                    setForm({ ...form, employee_id: v, employee_name: emp?.full_name || '' });
                  }}>
                    <SelectTrigger><SelectValue placeholder={t.selectEmployee} /></SelectTrigger>
                    <SelectContent>
                      {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t.leave_type}</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(leaveTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>{t.leave_from}</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required className="rounded-xl" /></div>
                  <div className="space-y-1.5"><Label>{t.leave_to}</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required className="rounded-xl" /></div>
                </div>
                <div className="space-y-1.5"><Label>{t.reason}</Label><Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={2} className="rounded-xl" /></div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 gradient-primary text-white rounded-2xl h-12 font-bold">{t.leave_submit}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-2xl h-12 px-6">{t.cancel}</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}