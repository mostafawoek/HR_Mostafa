import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, Building2, Pencil, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/lib/i18n';

export default function Departments() {
  const { t } = useLanguage();
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', manager: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [depts, emps] = await Promise.all([
        base44.entities.Department.list('-created_date', 200),
        base44.entities.Employee.list(),
      ]);
      setDepartments(depts);
      setEmployees(emps);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing) await base44.entities.Department.update(editing.id, form);
    else await base44.entities.Department.create(form);
    setForm({ name: '', description: '', manager: '' });
    setEditing(null);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm(t.dept_confirmDelete)) return;
    await base44.entities.Department.delete(id);
    load();
  };

  const openEdit = (d) => { setEditing(d); setForm({ name: d.name, description: d.description || '', manager: d.manager || '' }); setShowForm(true); };
  const openAdd = () => { setEditing(null); setForm({ name: '', description: '', manager: '' }); setShowForm(true); };

  const countEmployees = (name) => employees.filter(e => e.department === name).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient">{t.dept_title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{departments.length} {t.dept_count}</p>
        </div>
        <Button onClick={openAdd} className="gradient-primary text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-emerald-500/30">
          <Plus className="w-5 h-5 ml-2" /> {t.dept_add}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-3xl p-6 border border-border/50 hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold">{d.name}</h3>
              {d.description && <p className="text-sm text-muted-foreground mt-1">{d.description}</p>}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="w-4 h-4" /> {countEmployees(d.name)} {t.dept_employees}
                </div>
                {d.manager && <div className="text-sm text-muted-foreground">{t.dept_manager}: <span className="font-medium text-foreground">{d.manager}</span></div>}
              </div>
              <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="outline" onClick={() => openEdit(d)} className="rounded-xl flex-1"><Pencil className="w-4 h-4 ml-1" /> {t.edit}</Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(d.id)} className="rounded-xl text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
              className="glass rounded-3xl w-full max-w-md border border-border/50 shadow-2xl p-6">
              <h2 className="text-xl font-extrabold text-gradient mb-4">{editing ? t.dept_edit : t.dept_addTitle}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5"><Label>{t.dept_name}</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>{t.dept_manager}</Label><Input value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>{t.dept_desc}</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="rounded-xl" /></div>
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