import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n';
import { useHrLabels } from '@/lib/hrHelpers';

export default function Warnings() {
  const { t } = useLanguage();
  const { warningTypeLabels, severityLabels, formatDate } = useHrLabels();
  const [warnings, setWarnings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ employee_name: '', employee_id: '', date: '', type: 'written', reason: '', severity: 'medium' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [w, emps] = await Promise.all([
        base44.entities.Warning.list('-created_date', 200),
        base44.entities.Employee.list(),
      ]);
      setWarnings(w);
      setEmployees(emps);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing) await base44.entities.Warning.update(editing.id, form);
    else await base44.entities.Warning.create({ ...form, date: form.date || new Date().toISOString().slice(0, 10) });
    setForm({ employee_name: '', employee_id: '', date: '', type: 'written', reason: '', severity: 'medium' });
    setEditing(null);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm(t.warn_confirmDelete)) return;
    await base44.entities.Warning.delete(id);
    load();
  };

  const openEdit = (w) => {
    setEditing(w);
    setForm({ employee_name: w.employee_name, employee_id: w.employee_id || '', date: w.date || '', type: w.type, reason: w.reason, severity: w.severity });
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient">{t.warn_title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{warnings.length} {t.warn_count}</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gradient-primary text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-emerald-500/30">
          <Plus className="w-5 h-5 ml-2" /> {t.warn_add}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>
      ) : warnings.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center border border-border/50">
          <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">{t.warn_empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {warnings.map((w, i) => (
              <motion.div key={w.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.03 }}
                className="glass rounded-2xl p-5 border border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/30 shrink-0">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">{w.employee_name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${warningTypeLabels[w.type]?.color}`}>{warningTypeLabels[w.type]?.label}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${severityLabels[w.severity]?.color}`}>{t.warn_severityPrefix} {severityLabels[w.severity]?.label}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(w.date)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{w.reason}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" onClick={() => openEdit(w)} className="rounded-xl"><Pencil className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(w.id)} className="rounded-xl text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
                </div>
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
              <h2 className="text-xl font-extrabold text-gradient mb-4">{editing ? t.warn_edit : t.warn_add}</h2>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t.warn_type}</Label>
                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(warningTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t.warn_severity}</Label>
                    <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(severityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>{t.date}</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>{t.reason} *</Label><Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required rows={3} className="rounded-xl" /></div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 gradient-primary text-white rounded-2xl h-12 font-bold">{t.save}</Button>
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