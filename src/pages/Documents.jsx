import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, FileText, Trash2, Download, Upload, Loader2, Search, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n';
import { useHrLabels } from '@/lib/hrHelpers';

const emptyForm = { employee_name: '', employee_id: '', title: '', type: 'other', file_url: '', upload_date: '' };
const typeColors = {
  contract: 'from-violet-500 to-purple-600',
  id_copy: 'from-blue-500 to-indigo-600',
  certificate: 'from-emerald-500 to-teal-600',
  other: 'from-slate-500 to-slate-600',
};

export default function Documents() {
  const { t } = useLanguage();
  const { docTypeLabels, formatDate } = useHrLabels();
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const docs = await base44.entities.Document.list('-created_date', 200);
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (e) {
      console.error('Failed to load documents:', e);
      setDocuments([]);
      setError(e.message || 'تعذر تحميل المستندات');
    }
    try {
      const emps = await base44.entities.Employee.list('-created_date', 500);
      setEmployees(Array.isArray(emps) ? emps : []);
    } catch (e) {
      console.warn('Employees unavailable while loading documents:', e);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const closeForm = () => {
    if (uploading || saving) return;
    setShowForm(false);
    setForm(emptyForm);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (!result?.file_url) throw new Error('لم يتم إرجاع رابط الملف');
      setForm(current => ({ ...current, file_url: result.file_url }));
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || t.doc_uploadFail);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.employee_id || !form.title) {
      setError('اختر الموظف واكتب عنوان المستند أولًا');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await base44.entities.Document.create({ ...form, upload_date: form.upload_date || new Date().toISOString().slice(0, 10) });
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      console.error('Document save failed:', err);
      setError(err.message || 'تعذر حفظ المستند');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t.doc_confirmDelete)) return;
    try {
      await base44.entities.Document.delete(id);
      await load();
    } catch (err) {
      console.error('Document delete failed:', err);
      setError(err.message || 'تعذر حذف المستند');
    }
  };

  const filteredDocuments = documents.filter(d => `${d.title || ''} ${d.employee_name || ''}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient">{t.doc_title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{filteredDocuments.length} {t.doc_count}</p>
        </div>
        <Button onClick={() => { setError(''); setShowForm(true); }} className="gradient-primary text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-emerald-500/30">
          <Plus className="w-5 h-5 ml-2" /> {t.doc_add}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="البحث بعنوان المستند أو اسم الموظف..." className="pr-10 rounded-2xl h-12" />
      </div>

      {error && !showForm && <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 p-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 shrink-0" />{error}</div>}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>
      ) : filteredDocuments.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center border border-border/50">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">{documents.length ? 'لا توجد نتائج مطابقة' : t.doc_empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredDocuments.map((d, i) => {
              const typeLabel = docTypeLabels[d.type]?.label || docTypeLabels[d.type] || d.type || 'مستند';
              return (
                <motion.div key={d.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.03 }} className="glass rounded-3xl p-5 border border-border/50 hover:shadow-xl transition-all group">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${typeColors[d.type] || typeColors.other} flex items-center justify-center shadow-lg shrink-0`}><FileText className="w-7 h-7 text-white" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{d.title || 'بدون عنوان'}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{d.employee_name || 'غير مرتبط بموظف'}</p>
                      <div className="flex items-center gap-2 mt-2"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{typeLabel}</span><span className="text-xs text-muted-foreground">{formatDate(d.upload_date)}</span></div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                    {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer" className="flex-1"><Button size="sm" variant="outline" className="rounded-xl w-full"><Download className="w-4 h-4 ml-1" /> {t.doc_download}</Button></a>}
                    <Button size="sm" variant="outline" onClick={() => handleDelete(d.id)} className="rounded-xl text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showForm && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeForm} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()} className="glass rounded-3xl w-full max-w-md border border-border/50 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-extrabold text-gradient">{t.doc_newTitle}</h2><Button type="button" variant="ghost" size="icon" onClick={closeForm}><X className="w-4 h-4" /></Button></div>
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3 mb-4 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5"><Label>{t.employee} *</Label><Select value={form.employee_id} onValueChange={v => { const emp = employees.find(e => e.id === v); setForm({ ...form, employee_id: v, employee_name: emp?.full_name || '' }); }}><SelectTrigger><SelectValue placeholder={t.selectEmployee} /></SelectTrigger><SelectContent>{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.full_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>{t.doc_titleLabel}</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>{t.doc_type}</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(docTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.label || v}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>{t.doc_file}</Label><input ref={fileRef} type="file" onChange={handleFile} className="hidden" /><Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="rounded-xl w-full h-12 border-dashed" disabled={uploading}>{uploading ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> {t.doc_uploading}</> : form.file_url ? <><CheckCircle2 className="w-4 h-4 ml-2 text-emerald-600" /> {t.doc_uploaded}</> : <><Upload className="w-4 h-4 ml-2" /> {t.doc_chooseFile}</>}</Button></div>
              <div className="flex gap-3 pt-2"><Button type="submit" disabled={uploading || saving} className="flex-1 gradient-primary text-white rounded-2xl h-12 font-bold">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.save}</Button><Button type="button" variant="outline" onClick={closeForm} className="rounded-2xl h-12 px-6">{t.cancel}</Button></div>
            </form>
          </motion.div>
        </motion.div>}
      </AnimatePresence>
    </div>
  );
}
