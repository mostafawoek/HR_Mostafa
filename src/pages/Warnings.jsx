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

const emptyForm = { employee_name: '', employee_id: '', date: '', type: 'written', reason: '', severity: 'medium', action: 'يُحفظ هذا الإنذار في الملف الوظيفي للموظف', response_deadline: '', employee_statement: '' };
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
  const openEdit = warning => { setEditing(warning); setError(''); setForm({ employee_name: warning.employee_name || '', employee_id: warning.employee_id || '', date: warning.date || '', type: warning.type || 'written', reason: warning.reason || '', severity: warning.severity || 'medium', action: warning.action || 'يُحفظ هذا الإنذار في الملف الوظيفي للموظف', response_deadline: warning.response_deadline || '', employee_statement: warning.employee_statement || '' }); setShowForm(true); };
  const closeForm = () => { if (!saving) { setShowForm(false); setEditing(null); setForm(emptyForm); } };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.employee_id || !form.reason.trim()) { setError('اختر الموظف واكتب سبب الإنذار قبل الحفظ'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, date: form.date || new Date().toISOString().slice(0, 10), warning_number: editing?.warning_number || `WRN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}` };
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
    const number = warning.warning_number || `WRN-${new Date().getFullYear()}-${String(warning.id || Date.now()).slice(-6)}`;
    const printWindow = window.open('', '_blank', 'width=1000,height=900');
    if (!printWindow) { setError('اسمح بفتح النوافذ المنبثقة حتى تتمكن من الطباعة'); return; }
    const value = key => escapeHtml(warning[key] || 'غير محدد');
    printWindow.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>${number} - إنذار وظيفي</title><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#172033;margin:0;background:#f1f5f9}.sheet{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:15mm 16mm 13mm;position:relative;border-top:9px solid #0f766e}.brandbar{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #cbd5e1;padding-bottom:15px}.brand{font-size:22px;font-weight:900;color:#0f766e}.brand small{display:block;color:#64748b;font-size:10px;font-weight:400;margin-top:5px}.docmeta{text-align:left;font-size:11px;color:#475569;line-height:1.9}.docmeta strong{display:block;color:#0f172a;font-size:13px}.title{text-align:center;padding:22px 0 18px}.title .eyebrow{font-size:11px;letter-spacing:2px;color:#0f766e;font-weight:800}.title h1{font-size:28px;margin:8px 0 5px;color:#111827}.title p{margin:0;color:#64748b;font-size:12px}.number{display:inline-block;margin-top:13px;padding:6px 17px;border-radius:5px;background:#ecfdf5;border:1px solid #99f6e4;color:#047857;font-size:12px;font-weight:800}.section{margin-top:18px}.section-title{display:flex;align-items:center;gap:8px;background:#0f766e;color:white;padding:9px 12px;font-size:13px;font-weight:800;border-radius:5px 5px 0 0}.section-title:before{content:'';width:5px;height:15px;background:#fbbf24;border-radius:2px}.grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #dbe4ea;border-top:0}.field{padding:11px 13px;border-left:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;min-height:48px}.field:nth-child(even){border-left:0}.field b{display:block;font-size:10px;color:#64748b;margin-bottom:5px;font-weight:500}.field span{font-size:13px;font-weight:800;color:#1e293b}.severity{color:#b45309!important}.bodybox{border:1px solid #dbe4ea;border-top:0;padding:15px;min-height:92px;font-size:13px;line-height:2.1;white-space:pre-wrap}.action{background:#fffbeb;border:1px solid #fde68a;padding:13px;font-size:12px;line-height:1.9}.notice{border-right:4px solid #dc2626;background:#fff1f2;padding:13px 15px;margin-top:18px;font-size:11px;line-height:1.9}.signbox{border:1px solid #dbe4ea;padding:13px;min-height:70px;font-size:11px;color:#475569;line-height:1.9}.signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:13px;margin-top:28px;text-align:center}.signature{height:78px;border:1px dashed #94a3b8;border-radius:5px;padding-top:50px;font-size:11px;font-weight:800;color:#334155}.footer{position:absolute;bottom:10mm;left:16mm;right:16mm;border-top:1px solid #e2e8f0;padding-top:8px;display:flex;justify-content:space-between;color:#94a3b8;font-size:9px}.print-only{font-size:10px;color:#64748b}@media print{body{background:#fff}.sheet{margin:0;border-top:9px solid #0f766e;box-shadow:none}}</style></head><body><main class="sheet"><header class="brandbar"><div><div class="brand">HR - Mostafa<small>إدارة الموارد البشرية والشؤون الإدارية</small></div></div><div class="docmeta"><strong>إنذار وظيفي رسمي</strong>سري - للاستخدام الإداري فقط<br>رقم المستند: ${number}</div></header><section class="title"><div class="eyebrow">OFFICIAL HR NOTICE</div><h1>إنذار وظيفي رسمي</h1><p>إشعار إداري موثق بشأن مخالفة أو تقصير وظيفي</p><div class="number">رقم الإنذار: ${number}</div></section><section class="section"><div class="section-title">بيانات الموظف والإنذار</div><div class="grid"><div class="field"><b>اسم الموظف</b><span>${value('employee_name')}</span></div><div class="field"><b>تاريخ إصدار الإنذار</b><span>${escapeHtml(formatDate(warning.date))}</span></div><div class="field"><b>نوع الإنذار</b><span>${escapeHtml(typeLabel)}</span></div><div class="field"><b>درجة الإنذار</b><span class="severity">${escapeHtml(severityLabel)}</span></div><div class="field"><b>القسم / الإدارة</b><span>${value('department')}</span></div><div class="field"><b>المسمى الوظيفي</b><span>${value('job_title')}</span></div></div></section><section class="section"><div class="section-title">وصف الواقعة وسبب الإنذار</div><div class="bodybox">${value('reason')}</div></section><section class="section"><div class="section-title">الإجراء الإداري المطلوب</div><div class="action">${value('action')}</div></section><section class="section"><div class="section-title">إفادة الموظف</div><div class="signbox">${warning.employee_statement ? value('employee_statement') : 'يقر الموظف باستلام نسخة من هذا الإنذار، وله حق تقديم إفادته أو اعتراضه خطيًا إلى الإدارة خلال المدة المحددة.'}</div></section><div class="notice"><strong>تنبيه إداري:</strong> تم إصدار هذا الإنذار بناءً على البيانات والمعلومات المتاحة لدى الإدارة. يجب على الموظف الالتزام بلوائح العمل والتعليمات الداخلية، ويُحتفظ بالمستند ضمن ملفه الوظيفي. تكرار المخالفة قد يؤدي إلى اتخاذ إجراءات إدارية إضافية وفق سياسة المنشأة.</div><section class="signatures"><div class="signature">توقيع الموظف<br><span class="print-only">الاسم والتاريخ</span></div><div class="signature">اعتماد المدير المباشر<br><span class="print-only">الاسم والتوقيع</span></div><div class="signature">ختم الموارد البشرية<br><span class="print-only">التاريخ والختم</span></div></section><footer class="footer"><span>HR - Mostafa | مستند سري</span><span>صفحة 1 من 1 | ${escapeHtml(formatDate(new Date().toISOString()))}</span></footer></main><script>window.onload=()=>{window.focus();window.print();}</script></body></html>`);
    printWindow.document.close();
  };

  return <div className="space-y-5">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center shadow-lg shadow-rose-500/20"><ShieldAlert className="w-6 h-6 text-white" /></div><div><h1 className="text-2xl font-extrabold text-gradient">{t.warn_title}</h1><p className="text-muted-foreground text-sm mt-1">إدارة الإنذارات والملاحظات الوظيفية باحترافية</p></div></div></div><Button onClick={openCreate} className="gradient-primary text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-emerald-500/30"><Plus className="w-5 h-5 ml-2" />{t.warn_add}</Button></div>

    {error && !showForm && <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 p-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5" />{error}</div>}

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Stat icon={FileText} label="إجمالي الإنذارات" value={stats.total} color="from-violet-500 to-purple-600" /><Stat icon={ShieldAlert} label="إنذارات عالية" value={stats.high} color="from-rose-500 to-red-700" /><Stat icon={Clock3} label="إنذارات متوسطة" value={stats.medium} color="from-amber-500 to-orange-600" /><Stat icon={CheckCircle2} label="إنذارات منخفضة" value={stats.low} color="from-emerald-500 to-teal-600" /></div>

    <div className="glass rounded-3xl p-4 border border-border/50 flex flex-col lg:flex-row gap-3"><div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="البحث باسم الموظف أو سبب الإنذار..." className="pr-10 rounded-2xl h-12" /></div><div className="flex gap-2 flex-wrap">{[['all','الكل'],['high','عالي'],['medium','متوسط'],['low','منخفض']].map(([key,label]) => <button key={key} onClick={() => setSeverityFilter(key)} className={`px-4 h-11 rounded-xl text-sm font-bold transition-all ${severityFilter === key ? 'gradient-primary text-white shadow-lg' : 'bg-muted/60 hover:bg-muted'}`}>{label}</button>)}</div></div>

    {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div> : filteredWarnings.length === 0 ? <div className="glass rounded-3xl p-16 text-center border border-border/50"><AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" /><p className="text-muted-foreground">{warnings.length ? 'لا توجد نتائج مطابقة' : t.warn_empty}</p></div> : <div className="grid grid-cols-1 xl:grid-cols-2 gap-4"><AnimatePresence>{filteredWarnings.map((w, i) => <WarningCard key={w.id} warning={w} index={i} t={t} lang={lang} warningTypeLabels={warningTypeLabels} severityLabels={severityLabels} formatDate={formatDate} onEdit={() => openEdit(w)} onDelete={() => handleDelete(w.id)} onPreview={() => setPreview(w)} onPrint={() => printWarning(w)} />)}</AnimatePresence></div>}

    <AnimatePresence>{showForm && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeForm} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"><motion.div initial={{ scale: .95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()} className="glass rounded-3xl w-full max-w-2xl border border-border/50 shadow-2xl p-6 my-8"><div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-extrabold text-gradient">{editing ? 'تعديل الإنذار' : 'إصدار إنذار وظيفي'}</h2><p className="text-sm text-muted-foreground mt-1">سجّل التفاصيل بوضوح ليظهر المستند بشكل رسمي عند الطباعة.</p></div><Button type="button" variant="ghost" size="icon" onClick={closeForm}><X className="w-4 h-4" /></Button></div>{error && <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3 mb-4 text-sm">{error}</div>}<form onSubmit={handleSave} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-1.5"><Label>{t.employee} *</Label><Select value={String(form.employee_id || '')} onValueChange={v => { const emp = employees.find(e => String(e.id) === v); setForm({ ...form, employee_id: v, employee_name: emp?.full_name || '' }); }}><SelectTrigger className="rounded-xl"><SelectValue placeholder={t.selectEmployee} /></SelectTrigger><SelectContent>{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.full_name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label>{t.date}</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="rounded-xl" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-1.5"><Label>{t.warn_type}</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(warningTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.label || v}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label>{t.warn_severity}</Label><Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(severityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.label || v}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-1.5"><Label>{t.reason} *</Label><Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required rows={5} className="rounded-2xl" placeholder="اكتب الواقعة أو سبب الإنذار بالتفصيل..." /></div><div className="space-y-1.5"><Label>الإجراء الإداري المطلوب</Label><Textarea value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} rows={2} className="rounded-2xl" placeholder="مثال: يوجه للموظف لفت نظر ويحفظ في الملف الوظيفي" /></div><div className="space-y-1.5"><Label>إفادة الموظف - اختيارية</Label><Textarea value={form.employee_statement} onChange={e => setForm({ ...form, employee_statement: e.target.value })} rows={2} className="rounded-2xl" placeholder="تُترك فارغة إذا كانت الإفادة ستكتب يدويًا على الورقة" /></div><div className="flex gap-3 pt-2"><Button type="submit" disabled={saving} className="flex-1 gradient-primary text-white rounded-2xl h-12 font-bold">{saving ? 'جاري الحفظ...' : t.save}</Button><Button type="button" variant="outline" onClick={closeForm} className="rounded-2xl h-12 px-6">{t.cancel}</Button></div></form></motion.div></motion.div>}</AnimatePresence>
    <AnimatePresence>{preview && <PreviewModal warning={preview} t={t} warningTypeLabels={warningTypeLabels} severityLabels={severityLabels} formatDate={formatDate} onClose={() => setPreview(null)} onPrint={() => printWarning(preview)} />}</AnimatePresence>
  </div>;
}

function Stat({ icon: Icon, label, value, color }) { return <div className="glass rounded-2xl p-4 border border-border/50 flex items-center gap-3"><div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}><Icon className="w-5 h-5 text-white" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-extrabold mt-0.5">{value}</p></div></div>; }

function WarningCard({ warning: w, index, t, warningTypeLabels, severityLabels, formatDate, onEdit, onDelete, onPreview, onPrint }) { const style = severityStyles[w.severity] || severityStyles.medium; return <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ delay: index * .03 }} className={`glass rounded-3xl p-5 border ${style.border} hover:shadow-xl transition-all`}><div className="flex items-start gap-4"><div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.card} flex items-center justify-center shadow-lg shrink-0`}><AlertTriangle className="w-7 h-7 text-white" /></div><div className="flex-1 min-w-0"><div className="flex items-start justify-between gap-2"><h3 className="font-extrabold text-lg truncate">{w.employee_name}</h3><span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${style.badge}`}>{severityLabels[w.severity]?.label || w.severity}</span></div><div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground"><span className="px-2 py-1 rounded-lg bg-muted">{warningTypeLabels[w.type]?.label || w.type}</span><span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatDate(w.date)}</span></div></div></div><p className="text-sm text-muted-foreground mt-4 leading-7 line-clamp-2">{w.reason}</p><div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50"><Button size="sm" variant="outline" onClick={onPreview} className="rounded-xl"><FileText className="w-4 h-4 ml-1" />عرض</Button><Button size="sm" variant="outline" onClick={onPrint} className="rounded-xl"><Printer className="w-4 h-4 ml-1" />طباعة</Button><Button size="sm" variant="outline" onClick={onEdit} className="rounded-xl"><Pencil className="w-4 h-4 ml-1" />{t.edit}</Button><Button size="sm" variant="outline" onClick={onDelete} className="rounded-xl text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button></div></motion.div>; }

function PreviewModal({ warning, t, warningTypeLabels, severityLabels, formatDate, onClose, onPrint }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}><motion.div initial={{ scale: .95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-950 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"><div className="p-6 border-b border-border/50 flex items-center justify-between"><div><p className="text-xs text-emerald-600 font-bold">HR - Mostafa</p><h2 className="text-2xl font-extrabold mt-1">معاينة الإنذار الرسمي</h2></div><Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button></div><div className="p-6 md:p-8"><div className="text-center border-b-4 border-emerald-700 pb-5"><h3 className="text-2xl font-black">إنذار وظيفي رسمي</h3><p className="text-sm text-muted-foreground mt-2">إشعار إداري بشأن مخالفة أو تقصير وظيفي</p></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">{[['اسم الموظف',warning.employee_name],['تاريخ الإنذار',formatDate(warning.date)],['نوع الإنذار',warningTypeLabels[warning.type]?.label || warning.type],['درجة الإنذار',severityLabels[warning.severity]?.label || warning.severity]].map(([label,value]) => <div key={label} className="rounded-xl bg-muted/50 border border-border/50 p-3"><p className="text-xs text-muted-foreground mb-1">{label}</p><p className="font-bold">{value}</p></div>)}</div><div className="mt-6 rounded-2xl border border-border/50 p-5"><h4 className="font-bold text-emerald-700 mb-3">تفاصيل وسبب الإنذار</h4><p className="whitespace-pre-wrap leading-8 text-sm">{warning.reason}</p></div><div className="mt-5 rounded-2xl border-r-4 border-rose-600 bg-rose-50 p-4 text-sm leading-7">نأمل من الموظف مراجعة مضمون هذا الإنذار والالتزام بسياسات ولوائح العمل. يُحفظ هذا المستند ضمن الملف الوظيفي للموظف.</div><div className="grid grid-cols-2 gap-12 text-center mt-20"><div className="border-t pt-3 text-xs">توقيع الموظف</div><div className="border-t pt-3 text-xs">اعتماد المدير المسؤول</div></div></div><div className="p-5 border-t border-border/50 flex gap-3"><Button onClick={onPrint} className="flex-1 gradient-primary text-white rounded-2xl"><Printer className="w-4 h-4 ml-2" />طباعة الإنذار</Button><Button variant="outline" onClick={onClose} className="rounded-2xl">{t.cancel}</Button></div></motion.div></motion.div>; }
