import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, AlertTriangle, Pencil, Trash2, Printer, Search, X, CalendarDays, UserRound, FileText, ShieldAlert, Clock3, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n';
import { useHrLabels } from '@/lib/hrHelpers';

const emptyForm = { employee_name: '', employee_id: '', date: '', type: 'written', reason: '', severity: 'medium' };
const severityStyles = {
  low: { card: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
  medium: { card: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  high: { card: 'from-rose-500 to-red-700', badge: 'bg-rose-100 text-rose-700', border: 'border-rose-200' },
};

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));

export default function Warnings() {
  const { t, lang } = useLanguage();
  const { warningTypeLabels, severityLabels, formatDate } = useHrLabels();
  const [warnings, setWarnings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState(null);
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
      const result = await base44.entities.Warning.list('-created_date', 200);
      setWarnings(Array.isArray(result) ? result : []);
    } catch (e) {
      console.error('Failed to load warnings:', e);
      setWarnings([]);
      setError(e.message || 'تعذر تحميل الإنذارات');
    }
    try {
      const result = await base44.entities.Employee.list('-created_date', 500);
      setEmployees(Array.isArray(result) ? result : []);
    } catch (e) {
      console.warn('Employees unavailable for warnings:', e);
      setEmployees([]);
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
    const haystack = `${w.employee_name || ''} ${w.reason || ''} ${w.type || ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase()) && (severityFilter === 'all' || w.severity === severityFilter);
  }), [warnings, search, severityFilter]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setShowForm(true); };
  const openEdit = warning => { setEditing(warning); setError(''); setForm({ employee_name: warning.employee_name || '', employee_id: warning.employee_id || '', date: warning.date || '', type: warning.type || 'written', reason: warning.reason || '', severity: warning.severity || 'medium' }); setShowForm(true); };
  const closeForm = () => { if (!saving) { setShowForm(false); setEditing(null); setForm(emptyForm); } };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.employee_id || !form.reason.trim()) { setError('اختر الموظف واكتب سبب الإنذار قبل الحفظ'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, date: form.date || new Date().toISOString().slice(0, 10) };
      if (editing) await base44.entities.Warning.update(editing.id, payload);
      else await base44.entities.Warning.create(payload);
      closeForm();
      await load();
    } catch (e) { console.error('Warning save failed:', e); setError(e.message || 'تعذر حفظ الإنذار'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!confirm(t.warn_confirmDelete)) return;
    try { await base44.entities.Warning.delete(id); await load(); }
    catch (e) { console.error(e); setError(e.message || 'تعذر حذف الإنذار'); }
  };

  const printWarning = warning => {
    const typeLabel = warningTypeLabels[warning.type]?.label || warning.type || '';
    const severityLabel = severityLabels[warning.severity]?.label || warning.severity || '';
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) { setError('اسمح بفتح النوافذ المنبثقة حتى تتمكن من الطباعة'); return; }
    printWindow.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>إنذار وظيفي - ${escapeHtml(warning.employee_name)}</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#172033;margin:0;background:#fff}.sheet{border:1px solid #d9dee8;min-height:255mm;padding:34px 42px;position:relative}.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #0f766e;padding-bottom:22px}.brand{font-size:24px;font-weight:800;color:#0f766e}.muted{color:#6b7280;font-size:12px;margin-top:6px}.doc-title{text-align:center;margin:34px 0 22px}.doc-title h1{font-size:27px;margin:0;color:#111827}.doc-title p{color:#6b7280;margin:9px 0}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:22px 0}.meta div{border:1px solid #e5e7eb;background:#f8fafc;border-radius:10px;padding:13px}.meta b{display:block;color:#64748b;font-size:11px;margin-bottom:6px}.meta span{font-weight:700}.reason{margin-top:24px;border:1px solid #e5e7eb;border-radius:12px;padding:18px;min-height:120px}.reason h3{font-size:14px;margin:0 0 12px;color:#0f766e}.reason p{white-space:pre-wrap;line-height:2;margin:0;font-size:14px}.notice{margin-top:22px;padding:15px;border-right:4px solid #dc2626;background:#fff1f2;line-height:1.9;font-size:13px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:70px;margin-top:90px;text-align:center}.line{border-top:1px solid #374151;padding-top:10px;font-size:12px}.footer{position:absolute;bottom:24px;left:42px;right:42px;text-align:center;border-top:1px solid #e5e7eb;padding-top:10px;color:#9ca3af;font-size:10px}</style></head><body><main class="sheet"><header class="top"><div><div class="brand">HR - Mostafa</div><div class="muted">نظام إدارة الموارد البشرية</div></div><div class="muted">التاريخ: ${escapeHtml(formatDate(new Date().toISOString()))}</div></header><section class="doc-title"><h1>إنذار وظيفي رسمي</h1><p>إشعار إداري بشأن مخالفة أو تقصير وظيفي</p></section><section class="meta"><div><b>اسم الموظف</b><span>${escapeHtml(warning.employee_name)}</span></div><div><b>تاريخ الإنذار</b><span>${escapeHtml(formatDate(warning.date))}</span></div><div><b>نوع الإنذار</b><span>${escapeHtml(typeLabel)}</span></div><div><b>درجة الإنذار</b><span>${escapeHtml(severityLabel)}</span></div></section><section class="reason"><h3>تفاصيل وسبب الإنذار</h3><p>${escapeHtml(warning.reason)}</p></section><div class="notice">نأمل من الموظف مراجعة مضمون هذا الإنذار والالتزام بسياسات ولوائح العمل. يُحفظ هذا المستند ضمن الملف الوظيفي للموظف.</div><section class="signatures"><div class="line">توقيع الموظف</div><div class="line">اعتماد المدير المسؤول</div></section><div class="footer">هذا المستند صادر من نظام HR - Mostafa ولا يُعتد به دون الاعتماد والتوقيع الرسمي.</div></main><script>window.onload=()=>{window.focus();window.print();}</script></body></html>`);
    printWindow.document.close();
  };

  return <div className="space-y-5">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center shadow-lg shadow-rose-500/20"><ShieldAlert className="w-6 h-6 text-white" /></div><div><h1 className="text-2xl font-extrabold text-gradient">{t.warn_title}</h1><p className="text-muted-foreground text-sm mt-1">إدارة الإنذارات والملاحظات الوظيفية باحترافية</p></div></div></div><Button onClick={openCreate} className="gradient-primary text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-emerald-500/30"><Plus className="w-5 h-5 ml-2" />{t.warn_add}</Button></div>

    {error && !showForm && <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 p-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5" />{error}</div>}

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Stat icon={FileText} label="إجمالي الإنذارات" value={stats.total} color="from-violet-500 to-purple-600" /><Stat icon={ShieldAlert} label="إنذارات عالية" value={stats.high} color="from-rose-500 to-red-700" /><Stat icon={Clock3} label="إنذارات متوسطة" value={stats.medium} color="from-amber-500 to-orange-600" /><Stat icon={CheckCircle2} label="إنذارات منخفضة" value={stats.low} color="from-emerald-500 to-teal-600" /></div>

    <div className="glass rounded-3xl p-4 border border-border/50 flex flex-col lg:flex-row gap-3"><div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="البحث باسم الموظف أو سبب الإنذار..." className="pr-10 rounded-2xl h-12" /></div><div className="flex gap-2 flex-wrap">{[['all','الكل'],['high','عالي'],['medium','متوسط'],['low','منخفض']].map(([key,label]) => <button key={key} onClick={() => setSeverityFilter(key)} className={`px-4 h-11 rounded-xl text-sm font-bold transition-all ${severityFilter === key ? 'gradient-primary text-white shadow-lg' : 'bg-muted/60 hover:bg-muted'}`}>{label}</button>)}</div></div>

    {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div> : filteredWarnings.length === 0 ? <div className="glass rounded-3xl p-16 text-center border border-border/50"><AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" /><p className="text-muted-foreground">{warnings.length ? 'لا توجد نتائج مطابقة' : t.warn_empty}</p></div> : <div className="grid grid-cols-1 xl:grid-cols-2 gap-4"><AnimatePresence>{filteredWarnings.map((w, i) => <WarningCard key={w.id} warning={w} index={i} t={t} lang={lang} warningTypeLabels={warningTypeLabels} severityLabels={severityLabels} formatDate={formatDate} onEdit={() => openEdit(w)} onDelete={() => handleDelete(w.id)} onPreview={() => setPreview(w)} onPrint={() => printWarning(w)} />)}</AnimatePresence></div>}

    <AnimatePresence>{showForm && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeForm} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"><motion.div initial={{ scale: .95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()} className="glass rounded-3xl w-full max-w-2xl border border-border/50 shadow-2xl p-6 my-8"><div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-extrabold text-gradient">{editing ? 'تعديل الإنذار' : 'إصدار إنذار وظيفي'}</h2><p className="text-sm text-muted-foreground mt-1">سجّل التفاصيل بوضوح ليظهر المستند بشكل رسمي عند الطباعة.</p></div><Button type="button" variant="ghost" size="icon" onClick={closeForm}><X className="w-4 h-4" /></Button></div>{error && <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3 mb-4 text-sm">{error}</div>}<form onSubmit={handleSave} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-1.5"><Label>{t.employee} *</Label><Select value={String(form.employee_id || '')} onValueChange={v => { const emp = employees.find(e => String(e.id) === v); setForm({ ...form, employee_id: v, employee_name: emp?.full_name || '' }); }}><SelectTrigger className="rounded-xl"><SelectValue placeholder={t.selectEmployee} /></SelectTrigger><SelectContent>{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.full_name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label>{t.date}</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="rounded-xl" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-1.5"><Label>{t.warn_type}</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(warningTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.label || v}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label>{t.warn_severity}</Label><Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(severityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.label || v}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-1.5"><Label>{t.reason} *</Label><Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required rows={6} className="rounded-2xl" placeholder="اكتب الواقعة أو سبب الإنذار بالتفصيل..." /></div><div className="flex gap-3 pt-2"><Button type="submit" disabled={saving} className="flex-1 gradient-primary text-white rounded-2xl h-12 font-bold">{saving ? 'جاري الحفظ...' : t.save}</Button><Button type="button" variant="outline" onClick={closeForm} className="rounded-2xl h-12 px-6">{t.cancel}</Button></div></form></motion.div></motion.div>}</AnimatePresence>
    <AnimatePresence>{preview && <PreviewModal warning={preview} t={t} warningTypeLabels={warningTypeLabels} severityLabels={severityLabels} formatDate={formatDate} onClose={() => setPreview(null)} onPrint={() => printWarning(preview)} />}</AnimatePresence>
  </div>;
}

function Stat({ icon: Icon, label, value, color }) { return <div className="glass rounded-2xl p-4 border border-border/50 flex items-center gap-3"><div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}><Icon className="w-5 h-5 text-white" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-extrabold mt-0.5">{value}</p></div></div>; }

function WarningCard({ warning: w, index, t, warningTypeLabels, severityLabels, formatDate, onEdit, onDelete, onPreview, onPrint }) { const style = severityStyles[w.severity] || severityStyles.medium; return <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ delay: index * .03 }} className={`glass rounded-3xl p-5 border ${style.border} hover:shadow-xl transition-all`}><div className="flex items-start gap-4"><div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.card} flex items-center justify-center shadow-lg shrink-0`}><AlertTriangle className="w-7 h-7 text-white" /></div><div className="flex-1 min-w-0"><div className="flex items-start justify-between gap-2"><h3 className="font-extrabold text-lg truncate">{w.employee_name}</h3><span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${style.badge}`}>{severityLabels[w.severity]?.label || w.severity}</span></div><div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground"><span className="px-2 py-1 rounded-lg bg-muted">{warningTypeLabels[w.type]?.label || w.type}</span><span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatDate(w.date)}</span></div></div></div><p className="text-sm text-muted-foreground mt-4 leading-7 line-clamp-2">{w.reason}</p><div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50"><Button size="sm" variant="outline" onClick={onPreview} className="rounded-xl"><FileText className="w-4 h-4 ml-1" />عرض</Button><Button size="sm" variant="outline" onClick={onPrint} className="rounded-xl"><Printer className="w-4 h-4 ml-1" />طباعة</Button><Button size="sm" variant="outline" onClick={onEdit} className="rounded-xl"><Pencil className="w-4 h-4 ml-1" />{t.edit}</Button><Button size="sm" variant="outline" onClick={onDelete} className="rounded-xl text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button></div></motion.div>; }

function PreviewModal({ warning, t, warningTypeLabels, severityLabels, formatDate, onClose, onPrint }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}><motion.div initial={{ scale: .95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-950 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"><div className="p-6 border-b border-border/50 flex items-center justify-between"><div><p className="text-xs text-emerald-600 font-bold">HR - Mostafa</p><h2 className="text-2xl font-extrabold mt-1">معاينة الإنذار الرسمي</h2></div><Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button></div><div className="p-6 md:p-8"><div className="text-center border-b-4 border-emerald-700 pb-5"><h3 className="text-2xl font-black">إنذار وظيفي رسمي</h3><p className="text-sm text-muted-foreground mt-2">إشعار إداري بشأن مخالفة أو تقصير وظيفي</p></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">{[['اسم الموظف',warning.employee_name],['تاريخ الإنذار',formatDate(warning.date)],['نوع الإنذار',warningTypeLabels[warning.type]?.label || warning.type],['درجة الإنذار',severityLabels[warning.severity]?.label || warning.severity]].map(([label,value]) => <div key={label} className="rounded-xl bg-muted/50 border border-border/50 p-3"><p className="text-xs text-muted-foreground mb-1">{label}</p><p className="font-bold">{value}</p></div>)}</div><div className="mt-6 rounded-2xl border border-border/50 p-5"><h4 className="font-bold text-emerald-700 mb-3">تفاصيل وسبب الإنذار</h4><p className="whitespace-pre-wrap leading-8 text-sm">{warning.reason}</p></div><div className="mt-5 rounded-2xl border-r-4 border-rose-600 bg-rose-50 p-4 text-sm leading-7">نأمل من الموظف مراجعة مضمون هذا الإنذار والالتزام بسياسات ولوائح العمل. يُحفظ هذا المستند ضمن الملف الوظيفي للموظف.</div><div className="grid grid-cols-2 gap-12 text-center mt-20"><div className="border-t pt-3 text-xs">توقيع الموظف</div><div className="border-t pt-3 text-xs">اعتماد المدير المسؤول</div></div></div><div className="p-5 border-t border-border/50 flex gap-3"><Button onClick={onPrint} className="flex-1 gradient-primary text-white rounded-2xl"><Printer className="w-4 h-4 ml-2" />طباعة الإنذار</Button><Button variant="outline" onClick={onClose} className="rounded-2xl">{t.cancel}</Button></div></motion.div></motion.div>; }
