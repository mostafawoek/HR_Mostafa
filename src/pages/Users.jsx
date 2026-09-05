import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { 
  UserPlus, 
  Shield, 
  Mail, 
  Crown, 
  Trash2, 
  Pencil, 
  Loader2, 
  Search, 
  X, 
  AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/i18n';

export default function Users() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // حالات التحكم بالنماذج والنوافذ
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null للإضافة، أو كائن المستخدم للتعديل
  const [deleteTarget, setDeleteTarget] = useState(null); // كائن المستخدم المراد حذفه

  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'user' });

  // جلب قائمة المستخدمين
  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.User.list();
      setUsers(data);
    } catch (e) {
      console.error(e);
      toast({ title: t.user_error || "خطأ", description: "فشل في تحميل البيانات", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  // فتح نافذة الإضافة
  const handleOpenCreate = () => {
    setEditingUser(null);
    setForm({ full_name: '', email: '', password: '', role: 'user' });
    setShowModal(true);
  };

  // فتح نافذة التعديل
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setForm({ 
      full_name: user.full_name || '', 
      email: user.email || '', 
      password: '', // نتركها فارغة، ويتم التحديث فقط إذا أدخل كلمة مرور جديدة
      role: user.role || 'user' 
    });
    setShowModal(true);
  };

  // حفظ التغييرات (إضافة أو تعديل)
  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        // تعديل مستخدم حالي
        const updatePayload = { full_name: form.full_name, email: form.email, role: form.role };
        if (form.password.trim()) {
          updatePayload.password = form.password;
        }
        await base44.entities.User.update(editingUser.id, updatePayload);
        toast({ title: "تم التعديل بنجاح", description: `تم تحديث بيانات ${form.full_name || form.email}` });
      } else {
        // إضافة مستخدم جديد مباشرة
        await base44.entities.User.create({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role
        });
        toast({ title: "تم إنشاء المستخدم", description: `تمت إضافة ${form.email} بنجاح` });
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      toast({ 
        title: t.user_error || "حدث خطأ", 
        description: err.message || "تعذر تنفيذ العملية", 
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // حذف مستخدم
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await base44.entities.User.delete(deleteTarget.id);
      toast({ title: "تم الحذف", description: `تم حذف المستخدم ${deleteTarget.full_name || deleteTarget.email}` });
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      toast({ title: t.user_error || "خطأ", description: err.message || "فشل في حذف المستخدم", variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabels = {
    admin: { label: t.user_roleAdmin || 'مسؤول', icon: Crown, color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', gradient: 'from-amber-500 to-orange-600' },
    user: { label: t.roleUser || 'مستخدم', icon: Shield, color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', gradient: 'from-blue-500 to-indigo-600' },
  };

  const filteredUsers = users.filter(u => 
    (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* الهيدر العلوي */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient">{t.user_title || "إدارة المستخدمين"}</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} {t.user_count || "مستخدم مسجل"}</p>
        </div>
        <Button onClick={handleOpenCreate} className="gradient-primary text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all">
          <UserPlus className="w-5 h-5 ml-2" /> إضافة مستخدم جديد
        </Button>
      </div>

      {/* شريط البحث */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="البحث بالاسم أو البريد الإلكتروني..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-11 h-12 rounded-2xl bg-background/50 border-border/60"
        />
      </div>

      {/* قائمة البطاقات */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredUsers.map((u, i) => {
              const uiRole = u.role === 'admin' ? 'admin' : 'user';
              const RoleIcon = roleLabels[uiRole]?.icon || Shield;
              return (
                <motion.div 
                  key={u.id} 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-3xl p-5 border border-border/50 hover:shadow-xl transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${roleLabels[uiRole]?.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                      <RoleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate text-base">{u.full_name || 'بدون اسم'}</h3>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                        <Mail className="w-3.5 h-3.5" /> {u.email}
                      </p>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${roleLabels[uiRole]?.color}`}>
                        {roleLabels[uiRole]?.label}
                      </span>
                    </div>
                  </div>

                  {/* أدوات التحكم (تعديل - حذف) */}
                  <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenEdit(u)}
                      className="rounded-xl h-9 px-3 gap-1.5 text-xs border-border/60 hover:bg-muted"
                    >
                      <Pencil className="w-3.5 h-3.5 text-blue-500" /> تعديل
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setDeleteTarget(u)}
                      className="rounded-xl h-9 px-3 gap-1.5 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* نافذة الإضافة / التعديل */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}
              className="glass rounded-3xl w-full max-w-md border border-border/50 shadow-2xl p-6 relative">
              
              <button onClick={() => setShowModal(false)} className="absolute left-4 top-4 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-extrabold text-gradient mb-1">
                {editingUser ? "تعديل بيانات المستخدم" : "إضافة مستخدم جديد"}
              </h2>
              <p className="text-xs text-muted-foreground mb-5">
                {editingUser ? "قم بتعديل البيانات المطلوبة ثم اضغط حفظ" : "أدخل تفاصيل الحساب الجديد لإنشائه فوراً"}
              </p>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>الاسم الكامل</Label>
                  <Input 
                    value={form.full_name} 
                    onChange={e => setForm({ ...form, full_name: e.target.value })} 
                    required 
                    className="rounded-xl" 
                    placeholder="مثال: مصطفى حجاج" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>البريد الإلكتروني</Label>
                  <Input 
                    type="email" 
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                    required 
                    className="rounded-xl" 
                    placeholder="user@example.com" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{editingUser ? "كلمة المرور الجديدة (اختياري)" : "كلمة المرور"}</Label>
                  <Input 
                    type="password" 
                    minLength={editingUser ? 0 : 6} 
                    value={form.password} 
                    onChange={e => setForm({ ...form, password: e.target.value })} 
                    required={!editingUser} 
                    className="rounded-xl" 
                    placeholder={editingUser ? "اتركها فارغة للإبقاء على الحالية" : "••••••••"} 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>الصلاحية</Label>
                  <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مسؤول نظام (Admin)</SelectItem>
                      <SelectItem value="user">مستخدم عادي (User)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={submitting} className="flex-1 gradient-primary text-white rounded-2xl h-11 font-bold">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingUser ? 'حفظ التعديلات' : 'إنشاء الحساب')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="rounded-2xl h-11 px-5">إلغاء</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة التأكيد قبل الحذف */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
              className="glass rounded-3xl w-full max-w-sm border border-border/50 shadow-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">تأكيد حذف المستخدم</h3>
              <p className="text-sm text-muted-foreground mb-6">
                هل أنت تأكد من رغبتك في حذف <strong className="text-foreground">{deleteTarget.full_name || deleteTarget.email}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleDelete} disabled={submitting} variant="destructive" className="flex-1 rounded-2xl h-11 font-bold">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'نعم، احذف'}
                </Button>
                <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-2xl h-11 px-5">إلغاء</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
