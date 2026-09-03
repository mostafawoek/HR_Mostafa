import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, FileText, Trash2, Download, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n';
import { useHrLabels } from '@/lib/hrHelpers';

export default function Documents() {
  const { t } = useLanguage();
  const { docTypeLabels, formatDate } = useHrLabels();
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_name: '', employee_id: '', title: '', type: 'other', file_url: '', upload_date: '' });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [docs, emps] = await Promise.all([
        base44.entities.Document.list('-created_date', 200),
        base44.entities.Employee.list(),
      ]);
      setDocuments(docs);
      setEmployees(emps);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, file_url }));
    } catch (err) { console.error(err); alert(t.doc_uploadFail); }
    finally { setUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await base44.entities.Document.create({ ...form, upload_date: form.upload_date || new Date().toISOString().slice(0, 10) });
    setForm({ employee_name: '', employee_id: '', title: '', type: 'other', file_url: '', upload_date: '' });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm(t.doc_confirmDelete)) return;
    await base44.entities.Document.delete(id);
    load();
  };

  const typeColors = {
    contract: 'from-violet-500 to-purple-600',
    id_copy: 'from-blue-500 to-indigo-600',
    certificate: 'from-emerald-500 to-teal-600',
    other: 'from-slate-500 to-slate-600',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient">{t.doc_title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{documents.length} {t.doc_count}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gradient-primary text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-emerald-500/30">
          <Plus className="w-5 h-5 ml-2" /> {t.doc_add}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>
      ) : documents.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center border border-border/50">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">{t.doc_empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {documents.map((d, i) => (
              <motion.div key={d.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.03 }}
                className="glass rounded-3xl p-5 border border-border/50 hover:shadow-xl transition-all group">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${typeColors[d.type] || typeColors.other} flex items-center justify-center shadow-lg shrink-0`}>
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{d.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{d.employee_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{docTypeLabels[d.type]}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(d.upload_date)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                  {d.file_url && (
                    <a href={d.file_url} target="_blank" rel="noreferrer" className="flex-1">
                      <Button size="sm" variant="outline" className="rounded-xl w-full"><Download className="w-4 h-4 ml-1" /> {t.doc_download}</Button>
                    </a>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDelete(d.id)} className="rounded-xl text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
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
              <h2 className="text-xl font-extrabold text-gradient mb-4">{t.doc_newTitle}</h2>
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
                <div className="space-y-1.5"><Label>{t.doc_titleLabel}</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="rounded-xl" /></div>
                <div className="space-y-1.5">
                  <Label>{t.doc_type}</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(docTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t.doc_file}</Label>
                  <input ref={fileRef} type="file" onChange={handleFile} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="rounded-xl w-full h-12 border-dashed">
                    {uploading ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> {t.doc_uploading}</> : <><Upload className="w-4 h-4 ml-2" /> {form.file_url ? t.doc_uploaded : t.doc_chooseFile}</>}
                  </Button>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={uploading} className="flex-1 gradient-primary text-white rounded-2xl h-12 font-bold">{t.save}</Button>
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