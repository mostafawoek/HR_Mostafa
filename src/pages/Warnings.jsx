import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, AlertTriangle, Pencil, Trash2, Printer, Search, X, CalendarDays, FileText, ShieldAlert, Clock3, CheckCircle2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n';
import { useHrLabels } from '@/lib/hrHelpers';
import WarningDocument from './WarningDocument';

const emptyForm = {
  employee_id: '',
  employee_name: '',
  department: '',
  job_title: '',
  phone: '',
  hire_date: '',
  date: new Date().toISOString().slice(0, 10),
  type: 'written',
  violation_type: 'late',
  violation_text: '',
  reason: '',
  severity: 'medium',
  action: 'يُحفظ هذا الإنذار في الملف الوظيفي للموظف',
  employee_statement: ''
};

const violationOptions = [
  { id: 'late', label: 'التأخر عن الدوام' },
  { id: 'absent', label: 'الغياب بدون عذر' },
  { id: 'instructions', label: 'عدم الالتزام بتعليمات العمل' },
  { id: 'neglect', label: 'إهمال في أداء العمل' },
  { id: 'misconduct', label: 'سوء التعامل مع الزملاء أو العملاء' },
  { id: 'rules', label: 'مخالفة أنظمة وقواعد الشركة' },
  { id: 'phone', label: 'استخدام الهاتف أثناء الدوام' },
  { id: 'permission', label: 'خروج من العمل بدون إذن' },
  { id: 'other', label: 'أخرى' }
];

const severityStyles = {
  low: { card: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
  medium: { card: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  high: { card: 'from-rose-500 to-red-700', badge: 'bg-rose-100 text-rose-700', border: 'border-rose-200' },
};

export default function Warnings() {
  const { t } = useLanguage();
  const { warningTypeLabels, severityLabels, formatDate } = useHrLabels();
  const [warnings, setWarnings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeDocument, setActiveDocument] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [warnRes, empRes] = await Promise.all([
        base44.entities.Warning.list('-created_date', 200),
        base44.entities.Employee.list('-created_date', 500)
      ]);
      setWarnings(Array.isArray(warnRes) ? warnRes : []);
      setEmployees(Array.isArray(empRes) ? empRes : []);
    } catch (e) {
      console.error('Error loading warnings data:', e);
      setError(e.message || 'تعذر تحميل بيانات الإنذارات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: warnings.length,
    high: warnings.filter(w => w.severity === 'high').length,
    medium: warnings.filter(w => w.severity === 'medium').length,
    low: warnings.filter(w => w.severity === 'low').length,
  }), [warnings]);

  const filteredWarnings = useMemo(() => warnings.filter(w => {
    const haystack = `${w.employee_name || ''} ${w.reason || ''} ${w.warning_number || ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase()) && (severityFilter === 'all' || w.severity === severityFilter);
  }), [warnings, search, severityFilter]);

  const handleSelectEmployee = (empId) => {
    const emp = employees.find(e => String(e.id) === String(empId));
    if (emp) {
      setForm(prev => ({
        ...prev,
        employee_id: emp.id,
        employee_name: emp.full_name || emp.name || '',
        department: emp.department || '',
        job_title: emp.position || emp.job_title || '',
        phone: emp.phone || '',
        hire_date: emp.hire_date || ''
      }));
    }
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setShowForm(true); };
  
  const openEdit = (warning) => {
    setEditing(warning);
    setError('');
    setForm({
      employee_id: warning.employee_id || '',
      employee_name: warning.employee_name || '',
      department: warning.department || '',
      job_title: warning.job_title || '',
      phone: warning.phone || '',
      hire_date: warning.hire_date || '',
      date: warning.date || new Date().toISOString().slice(0, 10),
      type: warning.type || 'written',
      violation_type: warning.violation_type || 'late',
      violation_text: warning.violation_text || '',
      reason: warning.reason || '',
      severity: warning.severity || 'medium',
      action: warning.action || 'يُحفظ هذا الإنذار في الملف الوظيفي للموظف',
      employee_statement: warning.employee_statement || ''
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.employee_id || !form.reason.trim()) {
      setError('يرجى اختيار الموظف وكتابة سبب الإنذار');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const generatedNo = `WRN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-4)}`;
      const payload = {
        ...form,
        warning_number: editing?.warning_number || generatedNo
      };

      if (editing) {
        await base44.entities.Warning.update(editing.id, payload);
      } else {
        await base44.entities.Warning.create(payload);
      }
      setShowForm(false);
      setForm(emptyForm);
      await load();
    } catch (e) {
      setError(e.message || 'تعذر حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t.warn_confirmDelete || 'هل أنت تأكد من حذف هذا الإنذار؟')) return;
    try {
      await base44.entities.Warning.delete(id);
      await load();
    } catch (e) {
      setError(e.message || 'تعذر حذف الإنذار');
    }
  };

  const openDocumentModal = (warning) => {
    const emp = employees.find(e => String(e.id) === String(warning.employee_id));
    setActiveDocument({ warning, employee: emp || warning });
  };

  return (
    <div className="space-y-6 dir-rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gradient">{t.warn_title || 'إدارة الإنذارات الوظيفية'}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">إصدار ومتابعة الملاحظات والإنذارات الرسمية</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gradient-primary text-white rounded-2xl h-12 px-6 font-bold shadow-lg">
          <Plus className="w-5 h-5 ml-2" />
          إصدار إنذار جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={FileText} label="إجمالي الإنذارات" value={stats.total} color="from-violet-500 to-purple-600" />
        <Stat icon={ShieldAlert} label="إنذارات عالية الخطورة" value={stats.high} color="from-rose-500 to-red-700" />
        <Stat icon={Clock3} label="إنذارات متوسطة" value={stats.medium} color="from-amber-500 to-orange-600" />
        <Stat icon={CheckCircle2} label="إنذارات منخفضة" value={stats.low} color="from-emerald-500 to-teal-600" />
      </div>

      {/* Filters */}
      <div className="glass rounded-3xl p-4 border border-border/50 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="البحث باسم الموظف، الرقم المرجعي، أو سبب الإنذار..." className="pr-10 rounded-2xl h-12" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[['all', 'الكل'], ['high', 'عالي'], ['medium', 'متوسط'], ['low', 'منخفض']].map(([key, label]) => (
            <button key={key} onClick={() => setSeverityFilter(key)} className={`px-4 h-11 rounded-xl text-sm font-bold transition-all ${severityFilter === key ? 'gradient-primary text-white shadow-md' : 'bg-muted/60 hover:bg-muted'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
      ) : filteredWarnings.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center border border-border/50">
          <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">{warnings.length ? 'لا توجد نتائج مطابقة لعملية البحث' : 'لا يوجد إنذارات مسجلة حالياً'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredWarnings.map((w, index) => {
              const style = severityStyles[w.severity] || severityStyles.medium;
              return (
                <motion.div key={w.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ delay: index * 0.03 }} className={`glass rounded-3xl p-5 border ${style.border} hover:shadow-xl transition-all`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.card} flex items-center justify-center shadow-lg shrink-0`}>
                      <ShieldAlert className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-lg truncate">{w.employee_name}</h3>
                          <p className="text-xs text-muted-foreground font-mono">{w.warning_number || `WRN-${w.id}`}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${style.badge}`}>
                          {severityLabels[w.severity]?.label || w.severity}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="px-2 py-1 rounded-lg bg-muted/80">{warningTypeLabels[w.type]?.label || w.type}</span>
                        <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatDate(w.date)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed line-clamp-2">{w.reason}</p>
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
                    <Button size="sm" variant="outline" onClick={() => openDocumentModal(w)} className="rounded-xl">
                      <Eye className="w-4 h-4 ml-1" /> طباعة / معاينة
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(w)} className="rounded-xl">
                      <Pencil className="w-4 h-4 ml-1" /> تعديل
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(w.id)} className="rounded-xl text-rose-600 hover:bg-rose-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()} className="glass rounded-3xl w-full max-w-2xl border border-border/50 shadow-2xl p-6 my-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-extrabold text-gradient">{editing ? 'تعديل الإنذار' : 'إصدار إنذار وظيفي رسمي'}</h2>
                  <p className="text-sm text-muted-foreground mt-1">قم بتعبئة تفاصيل المخالفة والقرار الإداري المتخذ</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
              </div>

              {error && <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3 mb-4 text-sm">{error}</div>}

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>الموظف *</Label>
                    <Select value={String(form.employee_id)} onValueChange={handleSelectEmployee}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر الموظف..." /></SelectTrigger>
                      <SelectContent>
                        {employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.full_name || e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>تاريخ الإصدار</Label>
                    <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>نوع المخالفة المحددة</Label>
                    <Select value={form.violation_type} onValueChange={v => setForm({ ...form, violation_type: v })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {violationOptions.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>درجة الخطورة</Label>
                    <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(severityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.label || v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {form.violation_type === 'other' && (
                  <div className="space-y-1.5">
                    <Label>تحديد المخالفة الأخري</Label>
                    <Input value={form.violation_text} onChange={e => setForm({ ...form, violation_text: e.target.value })} placeholder="اكتب نوع المخالفة بالتفصيل..." className="rounded-xl" />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>تفاصيل وسبب الإنذار *</Label>
                  <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required rows={4} className="rounded-2xl" placeholder="شرح تفصيلي للواقعة والأسباب..." />
                </div>

                <div className="space-y-1.5">
                  <Label>الإجراء الإداري المتخذ</Label>
                  <Textarea value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} rows={2} className="rounded-2xl" />
                </div>

                <div className="space-y-1.5">
                  <Label>إفادة الموظف (اختياري)</Label>
                  <Textarea value={form.employee_statement} onChange={e => setForm({ ...form, employee_statement: e.target.value })} rows={2} className="rounded-2xl" placeholder="تترك فارغة ليكتبها الموظف يدوياً عند التوقيع..." />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={saving} className="flex-1 gradient-primary text-white rounded-2xl h-12 font-bold">
                    {saving ? 'جاري الحفظ...' : t.save || 'حفظ'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-2xl h-12 px-6">إلغاء</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document View Modal */}
      {activeDocument && (
        <WarningDocument
          warning={activeDocument.warning}
          employee={activeDocument.employee}
          formatDate={formatDate}
          onClose={() => setActiveDocument(null)}
        />
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="glass rounded-2xl p-4 border border-border/50 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-extrabold mt-0.5">{value}</p>
      </div>
    </div>
  );
}
