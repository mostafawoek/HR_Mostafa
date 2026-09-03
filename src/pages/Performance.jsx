import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star, Plus, X, Target, Award, TrendingUp, CheckSquare,
  Clock, Flag, Download, Calendar
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useHrLabels } from '@/lib/hrHelpers';
import { exportToCSV } from '@/lib/excelUtils';

export default function Performance() {
  const { t } = useLanguage();
  return (
    <Tabs defaultValue="reviews" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gradient">{t.perf_title}</h1>
          <p className="text-muted-foreground mt-1">{t.perf_sub}</p>
        </div>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="reviews" className="gap-2"><Star className="w-4 h-4" /> {t.perf_tabReviews}</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2"><CheckSquare className="w-4 h-4" /> {t.perf_tabTasks}</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="reviews"><ReviewsTab /></TabsContent>
      <TabsContent value="tasks"><TasksTab /></TabsContent>
    </Tabs>
  );
}

function ReviewsTab() {
  const { t, lang } = useLanguage();
  const { performanceStatusLabels, formatDate } = useHrLabels();
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: '', employee_name: '', period: '', review_date: '', rating: 3, goals: '', achievements: '', strengths: '', improvements: '', reviewer: '', status: 'draft' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [revs, emps] = await Promise.all([
        base44.entities.Performance.list('-review_date', 200),
        base44.entities.Employee.list()
      ]);
      setReviews(revs);
      setEmployees(emps);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!form.employee_name || !form.period) return;
    setSaving(true);
    try {
      await base44.entities.Performance.create(form);
      setShowForm(false);
      setForm({ employee_id: '', employee_name: '', period: '', review_date: '', rating: 3, goals: '', achievements: '', strengths: '', improvements: '', reviewer: '', status: 'draft' });
      loadData();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Performance.delete(id);
    loadData();
  };

  const selectEmployee = (id) => {
    const emp = employees.find(e => e.id === id);
    setForm(f => ({ ...f, employee_id: id, employee_name: emp?.full_name || '' }));
  };

  const handleExport = () => {
    exportToCSV(lang === 'ar' ? 'تقييمات_الأداء' : 'performance_reviews', [
      { key: 'employee_name', label: t.employee },
      { key: 'period', label: t.perf_period },
      { key: 'review_date', label: t.perf_reviewDate },
      { key: 'rating', label: t.perf_rating },
      { key: 'reviewer', label: t.perf_reviewer },
      { key: 'status', label: t.status },
      { key: 'goals', label: t.perf_goals },
      { key: 'achievements', label: t.perf_achievements },
    ], reviews);
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 border border-border/50">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-3 shadow-lg">
            <Star className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-extrabold">{avgRating}</p>
          <p className="text-sm text-muted-foreground">{t.perf_avgRating}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl p-5 border border-border/50">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3 shadow-lg">
            <Award className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-extrabold">{reviews.filter(r => r.rating >= 4).length}</p>
          <p className="text-sm text-muted-foreground">{t.perf_excellent}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5 border border-border/50">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-3 shadow-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-extrabold">{reviews.length}</p>
          <p className="text-sm text-muted-foreground">{t.perf_total}</p>
        </motion.div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleExport} className="gap-2"><Download className="w-4 h-4" /> {t.perf_export}</Button>
        <Button onClick={() => setShowForm(true)} className="gap-2 gradient-primary text-white"><Plus className="w-4 h-4" /> {t.perf_newReview}</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : reviews.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-border/50">
          <Star className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t.perf_empty}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {reviews.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-5 border border-border/50 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{r.employee_name}</h3>
                  <p className="text-sm text-muted-foreground">{r.period} • {formatDate(r.review_date)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className={`w-4 h-4 ${n <= (r.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {r.goals && <p><span className="font-semibold text-muted-foreground">{t.perf_goals}: </span>{r.goals}</p>}
                {r.achievements && <p><span className="font-semibold text-muted-foreground">{t.perf_achievements}: </span>{r.achievements}</p>}
                {r.reviewer && <p><span className="font-semibold text-muted-foreground">{t.perf_reviewer}: </span>{r.reviewer}</p>}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${performanceStatusLabels[r.status]?.color}`}>
                  {performanceStatusLabels[r.status]?.label}
                </span>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="text-rose-500 hover:bg-rose-500/10"><X className="w-4 h-4" /></Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold">{t.perf_formTitle}</h3>
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
                    <Label className="mb-1.5">{t.perf_period}</Label>
                    <Input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} placeholder={t.perf_periodPh} />
                  </div>
                  <div>
                    <Label className="mb-1.5">{t.perf_reviewDate}</Label>
                    <Input type="date" value={form.review_date} onChange={e => setForm({ ...form, review_date: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5">{t.perf_rating} ({form.rating} / 5)</Label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${n <= form.rating ? 'bg-amber-400 text-white' : 'bg-muted text-muted-foreground'}`}>
                        <Star className={`w-5 h-5 ${n <= form.rating ? 'fill-white' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5">{t.perf_goals}</Label>
                  <Textarea value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} rows={2} />
                </div>
                <div>
                  <Label className="mb-1.5">{t.perf_achievements}</Label>
                  <Textarea value={form.achievements} onChange={e => setForm({ ...form, achievements: e.target.value })} rows={2} />
                </div>
                <div>
                  <Label className="mb-1.5">{t.perf_strengths}</Label>
                  <Textarea value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} rows={2} />
                </div>
                <div>
                  <Label className="mb-1.5">{t.perf_improvements}</Label>
                  <Textarea value={form.improvements} onChange={e => setForm({ ...form, improvements: e.target.value })} rows={2} />
                </div>
                <div>
                  <Label className="mb-1.5">{t.perf_reviewer}</Label>
                  <Input value={form.reviewer} onChange={e => setForm({ ...form, reviewer: e.target.value })} />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-white">
                  {saving ? t.saving : t.perf_saveReview}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TasksTab() {
  const { t } = useLanguage();
  const { taskPriorityLabels, taskStatusLabels, formatDate } = useHrLabels();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: '', employee_name: '', title: '', description: '', priority: 'medium', status: 'todo', due_date: '', progress: 0 });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tsks, emps] = await Promise.all([
        base44.entities.Task.list('-due_date', 200),
        base44.entities.Employee.list()
      ]);
      setTasks(tsks);
      setEmployees(emps);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!form.employee_name || !form.title) return;
    setSaving(true);
    try {
      await base44.entities.Task.create(form);
      setShowForm(false);
      setForm({ employee_id: '', employee_name: '', title: '', description: '', priority: 'medium', status: 'todo', due_date: '', progress: 0 });
      loadData();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const updateStatus = async (id, status) => {
    await base44.entities.Task.update(id, { status });
    loadData();
  };

  const handleDelete = async (id) => {
    await base44.entities.Task.delete(id);
    loadData();
  };

  const selectEmployee = (id) => {
    const emp = employees.find(e => e.id === id);
    setForm(f => ({ ...f, employee_id: id, employee_name: emp?.full_name || '' }));
  };

  const columns = [
    { key: 'todo', label: t.task_col_todo, color: 'from-slate-500 to-slate-600' },
    { key: 'in_progress', label: t.task_col_progress, color: 'from-blue-500 to-indigo-600' },
    { key: 'review', label: t.task_col_review, color: 'from-amber-500 to-orange-600' },
    { key: 'done', label: t.task_col_done, color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} className="gap-2 gradient-primary text-white"><Plus className="w-4 h-4" /> {t.task_new}</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {columns.map(col => {
            const colTasks = tasks.filter(t2 => t2.status === col.key);
            return (
              <div key={col.key} className="glass rounded-2xl p-4 border border-border/50 min-h-[300px]">
                <div className={`flex items-center gap-2 mb-4 pb-3 border-b border-border/50`}>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${col.color} flex items-center justify-center`}>
                    <Flag className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold">{col.label}</h3>
                  <span className="mr-auto px-2 py-0.5 rounded-full bg-muted text-xs font-medium">{colTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {colTasks.map(tk => (
                    <motion.div
                      key={tk.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-card rounded-xl p-3 border border-border/50 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm leading-tight">{tk.title}</h4>
                        <button onClick={() => handleDelete(tk.id)} className="text-muted-foreground hover:text-rose-500 shrink-0"><X className="w-3.5 h-3.5" /></button>
                      </div>
                      {tk.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{tk.description}</p>}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${taskPriorityLabels[tk.priority]?.color}`}>
                          {taskPriorityLabels[tk.priority]?.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{tk.employee_name}</span>
                      </div>
                      {tk.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <Calendar className="w-3 h-3" /> {formatDate(tk.due_date)}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full gradient-primary" style={{ width: `${tk.progress || 0}%` }} />
                        </div>
                        <span className="text-xs font-medium">{tk.progress || 0}%</span>
                      </div>
                      <Select value={tk.status} onValueChange={v => updateStatus(tk.id, v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(taskStatusLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  ))}
                  {colTasks.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-8">{t.task_empty}</p>
                  )}
                </div>
              </div>
            );
          })}
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
                <h3 className="text-xl font-bold">{t.task_formTitle}</h3>
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
                <div>
                  <Label className="mb-1.5">{t.task_titleLabel}</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-1.5">{t.task_description}</Label>
                  <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5">{t.task_priority}</Label>
                    <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(taskPriorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5">{t.task_dueDate}</Label>
                    <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-white">
                  {saving ? t.saving : t.task_create}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}