import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Wallet, Plus, X, Download, CheckCircle2, Clock, TrendingUp,
  DollarSign, BadgeDollarSign
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useHrLabels } from '@/lib/hrHelpers';
import { exportToCSV } from '@/lib/excelUtils';

export default function Salaries() {
  const { t, lang } = useLanguage();
  const { salaryStatusLabels, formatCurrency } = useHrLabels();
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({ employee_id: '', employee_name: '', month: '', base_salary: 0, allowances: 0, deductions: 0, bonus: 0, net_salary: 0, status: 'pending', payment_date: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sals, emps] = await Promise.all([
        base44.entities.Salary.list('-month', 200),
        base44.entities.Employee.list()
      ]);
      setSalaries(sals);
      setEmployees(emps);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const calcNet = (f) => (f.base_salary || 0) + (f.allowances || 0) + (f.bonus || 0) - (f.deductions || 0);

  const handleSave = async () => {
    if (!form.employee_name || !form.month || !form.base_salary) return;
    setSaving(true);
    try {
      const net = calcNet(form);
      await base44.entities.Salary.create({ ...form, net_salary: net });
      setShowForm(false);
      setForm({ employee_id: '', employee_name: '', month: '', base_salary: 0, allowances: 0, deductions: 0, bonus: 0, net_salary: 0, status: 'pending', payment_date: '', notes: '' });
      loadData();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const markPaid = async (id) => {
    await base44.entities.Salary.update(id, { status: 'paid', payment_date: new Date().toISOString().split('T')[0] });
    loadData();
  };

  const handleDelete = async (id) => {
    await base44.entities.Salary.delete(id);
    loadData();
  };

  const selectEmployee = (id) => {
    const emp = employees.find(e => e.id === id);
    setForm(f => ({ ...f, employee_id: id, employee_name: emp?.full_name || '', base_salary: emp?.salary || 0 }));
  };

  const filtered = salaries.filter(s => {
    const matchMonth = !filterMonth || s.month === filterMonth;
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchMonth && matchStatus;
  });

  const totalNet = filtered.reduce((sum, s) => sum + (s.net_salary || 0), 0);
  const totalPaid = filtered.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.net_salary || 0), 0);
  const totalPending = filtered.filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.net_salary || 0), 0);

  const handleExport = () => {
    exportToCSV(lang === 'ar' ? 'كشف_الرواتب' : 'payroll_sheet', [
      { key: 'employee_name', label: t.employee },
      { key: 'month', label: t.sal_month },
      { key: 'base_salary', label: t.sal_baseSalary },
      { key: 'allowances', label: t.sal_col_allowances },
      { key: 'deductions', label: t.sal_col_deductions },
      { key: 'bonus', label: t.sal_col_bonus },
      { key: 'net_salary', label: t.sal_netSalary },
      { key: 'status', label: t.status },
      { key: 'payment_date', label: t.date },
    ], filtered);
  };

  const statCards = [
    { label: t.sal_total, value: formatCurrency(totalNet), icon: Wallet, color: 'from-violet-500 to-purple-600' },
    { label: t.sal_paid, value: formatCurrency(totalPaid), icon: CheckCircle2, color: 'from-emerald-500 to-teal-600' },
    { label: t.sal_pending, value: formatCurrency(totalPending), icon: Clock, color: 'from-amber-500 to-orange-600' },
    { label: t.sal_empCount, value: filtered.length, icon: BadgeDollarSign, color: 'from-blue-500 to-indigo-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gradient">{t.sal_title}</h1>
          <p className="text-muted-foreground mt-1">{t.sal_sub}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2"><Download className="w-4 h-4" /> {t.exportExcel}</Button>
          <Button onClick={() => setShowForm(true)} className="gap-2 gradient-primary text-white"><Plus className="w-4 h-4" /> {t.sal_new}</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5 border border-border/50">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
              <s.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-xl font-extrabold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass rounded-2xl p-4 border border-border/50 flex flex-wrap gap-3 items-end">
        <div className="min-w-[150px]">
          <Label className="mb-1.5">{t.sal_month}</Label>
          <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
        </div>
        <div className="min-w-[150px]">
          <Label className="mb-1.5">{t.status}</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.all}</SelectItem>
              {Object.entries(salaryStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-border/50">
          <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t.sal_empty}</p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-right">
                  <th className="p-4 font-semibold">{t.employee}</th>
                  <th className="p-4 font-semibold">{t.sal_month}</th>
                  <th className="p-4 font-semibold">{t.sal_col_base}</th>
                  <th className="p-4 font-semibold">{t.sal_col_allowances}</th>
                  <th className="p-4 font-semibold">{t.sal_col_deductions}</th>
                  <th className="p-4 font-semibold">{t.sal_col_bonus}</th>
                  <th className="p-4 font-semibold">{t.sal_col_net}</th>
                  <th className="p-4 font-semibold">{t.status}</th>
                  <th className="p-4 font-semibold">{t.att_col_action}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-t border-border/50 hover:bg-muted/30">
                    <td className="p-4 font-medium">{s.employee_name}</td>
                    <td className="p-4 text-muted-foreground">{s.month}</td>
                    <td className="p-4">{formatCurrency(s.base_salary)}</td>
                    <td className="p-4 text-emerald-600">{formatCurrency(s.allowances)}</td>
                    <td className="p-4 text-rose-600">{formatCurrency(s.deductions)}</td>
                    <td className="p-4 text-emerald-600">{formatCurrency(s.bonus)}</td>
                    <td className="p-4 font-bold">{formatCurrency(s.net_salary)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${salaryStatusLabels[s.status]?.color}`}>
                        {salaryStatusLabels[s.status]?.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {s.status === 'pending' && (
                          <Button variant="ghost" size="icon" onClick={() => markPaid(s.id)} title={t.sal_markPaid} className="text-emerald-600 hover:bg-emerald-500/10">
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-rose-500 hover:bg-rose-500/10">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-border">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold">{t.sal_formTitle}</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-5 h-5" /></Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="mb-1.5">{t.employee}</Label>
                  <Select onValueChange={selectEmployee}>
                    <SelectTrigger><SelectValue placeholder={t.selectEmployee} /></SelectTrigger>
                    <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5">{t.sal_month}</Label>
                    <Input type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} />
                  </div>
                  <div>
                    <Label className="mb-1.5">{t.sal_baseSalary}</Label>
                    <Input type="number" value={form.base_salary} onChange={e => setForm({ ...form, base_salary: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label className="mb-1.5">{t.sal_col_allowances}</Label>
                    <Input type="number" value={form.allowances} onChange={e => setForm({ ...form, allowances: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label className="mb-1.5">{t.sal_col_deductions}</Label>
                    <Input type="number" value={form.deductions} onChange={e => setForm({ ...form, deductions: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label className="mb-1.5">{t.sal_col_bonus}</Label>
                    <Input type="number" value={form.bonus} onChange={e => setForm({ ...form, bonus: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label className="mb-1.5">{t.sal_netSalary}</Label>
                    <div className="h-9 px-3 flex items-center rounded-md bg-muted/50 font-bold text-emerald-600">
                      {formatCurrency(calcNet(form))}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5">{t.notes}</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-white">
                  {saving ? t.saving : t.sal_saveSheet}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}