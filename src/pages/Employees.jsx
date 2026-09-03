import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, Trash2, Users, Mail, Phone, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import { useLanguage } from '@/lib/i18n';
import { useHrLabels } from '@/lib/hrHelpers';
import EmployeeForm from '@/components/EmployeeForm';

export default function Employees() {
  const { t, lang } = useLanguage();
  const { statusLabels, formatCurrency } = useHrLabels();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [emps, depts] = await Promise.all([
        base44.entities.Employee.list('-created_date', 200),
        base44.entities.Department.list(),
      ]);
      setEmployees(emps);
      setDepartments(depts);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = employees.filter(e => {
    const matchSearch = (e.full_name + e.email + e.position + (e.department || '')).toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSave = async (data) => {
    if (editing) {
      await base44.entities.Employee.update(editing.id, data);
    } else {
      await base44.entities.Employee.create(data);
    }
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm(t.emp_confirmDelete)) return;
    await base44.entities.Employee.delete(id);
    load();
  };

  const openEdit = (emp) => { setEditing(emp); setShowForm(true); };
  const openAdd = () => { setEditing(null); setShowForm(true); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient">{t.emp_title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} {t.emp_count}</p>
        </div>
        <Button onClick={openAdd} className="gradient-primary text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-violet-500/30">
          <Plus className="w-5 h-5 ml-2" /> {t.emp_add}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.emp_search} className="pr-10 rounded-2xl h-12" />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'inactive', 'suspended'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 h-12 rounded-2xl text-sm font-medium transition-all ${
                filterStatus === s ? 'gradient-primary text-white shadow-lg' : 'glass border border-border/50 hover:bg-muted'
              }`}
            >
              {s === 'all' ? t.all : statusLabels[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center border border-border/50">
          <Users className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">{t.emp_empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filtered.map((emp, i) => (
              <motion.div
                key={emp.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-3xl p-5 border border-border/50 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-extrabold shrink-0 shadow-lg shadow-violet-500/30 overflow-hidden">
                    {emp.avatar ? <Image src={emp.avatar} className="w-full h-full" fittingType="fill" /> : emp.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base truncate">{emp.full_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><Briefcase className="w-3.5 h-3.5" /> {emp.position}</p>
                    <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[emp.status]?.color || ''}`}>
                      {statusLabels[emp.status]?.label}
                    </span>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-sm">
                  {emp.email && <p className="flex items-center gap-2 text-muted-foreground truncate"><Mail className="w-4 h-4 shrink-0" /> {emp.email}</p>}
                  {emp.phone && <p className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4 shrink-0" /> {emp.phone}</p>}
                  {emp.department && <p className="text-muted-foreground">{t.emp_dept}: <span className="font-medium text-foreground">{emp.department}</span></p>}
                  {emp.salary != null && <p className="text-muted-foreground">{t.emp_salary}: <span className="font-bold text-emerald-600">{formatCurrency(emp.salary)}</span></p>}
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" onClick={() => openEdit(emp)} className="rounded-xl flex-1"><Pencil className="w-4 h-4 ml-1" /> {t.edit}</Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(emp.id)} className="rounded-xl text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showForm && <EmployeeForm employee={editing} departments={departments} onSave={handleSave} onClose={() => setShowForm(false)} />}
      </AnimatePresence>
    </div>
  );
}