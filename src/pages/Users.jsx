import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { UserPlus, Shield, Mail, Crown, Loader2, Check, Trash2, Pencil, Search, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/i18n';
import { ALL_PERMISSIONS, DEFAULT_USER_PERMISSIONS, PERMISSION_MODULES, normalizePermissions } from '@/lib/permissions';

const copy = {
  ar: {
    permissionsTitle: 'صلاحيات وحدات البرنامج',
    permissionsHint: 'حدد الصفحات التي يستطيع هذا المستخدم فتحها وإدارتها.',
    chooseAll: 'تحديد الكل',
    clearAll: 'إلغاء الكل',
    adminAll: 'المدير يمتلك جميع الصلاحيات تلقائيًا',
    userPermissions: 'الصلاحيات المخصصة',
    save: 'حفظ الصلاحيات',
    saved: 'تم حفظ الصلاحيات',
    create: 'إنشاء الحساب',
    creating: 'جارٍ الإنشاء...',
    fullName: 'الاسم الكامل',
    password: 'كلمة المرور الأولية (8 أحرف على الأقل)',
    description: 'أنشئ بيانات دخول وصلاحيات المستخدم الجديد.',
    employeeRole: 'مستخدم موظف',
    adminRole: 'مدير النظام',
  },
  en: {
    permissionsTitle: 'Program permissions',
    permissionsHint: 'Choose the pages this user can open and manage.',
    chooseAll: 'Select all',
    clearAll: 'Clear all',
    adminAll: 'Admins automatically have every permission',
    userPermissions: 'Custom permissions',
    save: 'Save permissions',
    saved: 'Permissions saved',
    create: 'Create user',
    creating: 'Creating...',
    fullName: 'Full name',
    password: 'Initial password (8+ characters)',
    description: 'Create login credentials and permissions for the new user.',
    employeeRole: 'Employee user',
    adminRole: 'System administrator',
  },
};

const PermissionGrid = ({ permissions, role, lang, onChange, compact = false }) => {
  const ui = copy[lang] || copy.en;
  const isAdmin = role === 'admin';
  const current = normalizePermissions(permissions, role);
  const setAll = checked => PERMISSION_MODULES.forEach(({ key }) => onChange(key, checked));
  return (
    <div className={`rounded-2xl border border-border/60 bg-background/40 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <p className="font-bold text-sm">{ui.permissionsTitle}</p>
          <p className="text-xs text-muted-foreground mt-1">{ui.permissionsHint}</p>
        </div>
        {!isAdmin && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setAll(true)}>{ui.chooseAll}</Button>
            <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setAll(false)}>{ui.clearAll}</Button>
          </div>
        )}
      </div>
      {isAdmin ? (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 p-3 text-xs font-medium">
          <Crown className="w-4 h-4 shrink-0" /> {ui.adminAll}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PERMISSION_MODULES.map(module => (
            <label key={module.key} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-muted/60 cursor-pointer transition-colors">
              <Checkbox checked={current[module.key] === true} onCheckedChange={checked => onChange(module.key, checked === true)} />
              <span className="text-sm">{lang === 'ar' ? module.labelAr : module.labelEn}</span>
              {current[module.key] === true && <Check className="w-3.5 h-3.5 text-emerald-600 mr-auto" />}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Users() {
  const { t, lang } = useLanguage();
  const ui = copy[lang] || copy.en;
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', permissions: { ...DEFAULT_USER_PERMISSIONS } });
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try { setUsers(await base44.entities.User.list()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({ name: '', email: '', password: '', role: 'user', permissions: { ...DEFAULT_USER_PERMISSIONS } });
  const openCreate = () => { setEditingUser(null); resetForm(); setShowForm(true); };
  const openEdit = user => { setEditingUser(user); setForm({ name: user.name || user.full_name || '', email: user.email || '', password: '', role: user.role === 'admin' ? 'admin' : 'user', permissions: normalizePermissions(user.permissions, user.role) }); setShowForm(true); };

  const handleInvite = async e => {
    e.preventDefault();
    setInviting(true);
    try {
      const permissions = form.role === 'admin' ? ALL_PERMISSIONS : form.permissions;
      if (editingUser) {
        await base44.entities.User.update(editingUser.id, { name: form.name, role: form.role, permissions });
        toast({ title: ui.saved });
      } else {
        await base44.users.inviteUser(form.email, form.role, form.name, form.password, permissions);
        toast({ title: t.user_inviteSuccess, description: `${form.email} → ${form.role === 'admin' ? t.user_roleAdmin : t.roleUser}` });
      }
      setEditingUser(null); resetForm(); setShowForm(false); load();
    } catch (err) { toast({ title: t.user_error, description: err.message || t.user_inviteFail, variant: 'destructive' }); }
    finally { setInviting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setInviting(true);
    try {
      await base44.entities.User.delete(deleteTarget.id);
      toast({ title: lang === 'ar' ? 'تم الحذف' : 'Deleted', description: deleteTarget.email });
      setDeleteTarget(null); load();
    } catch (err) { toast({ title: t.user_error, description: err.message, variant: 'destructive' }); }
    finally { setInviting(false); }
  };

  const updateRole = async (userId, newRole) => {
    const permissions = newRole === 'admin' ? ALL_PERMISSIONS : DEFAULT_USER_PERMISSIONS;
    setSavingId(userId);
    try {
      await base44.entities.User.update(userId, { role: newRole, permissions });
      toast({ title: t.user_roleUpdated });
      load();
    } catch (err) { toast({ title: t.user_error, description: err.message, variant: 'destructive' }); }
    finally { setSavingId(null); }
  };

  const updatePermission = async (user, key, checked) => {
    if (user.role === 'admin') return;
    const permissions = { ...normalizePermissions(user.permissions, user.role), [key]: checked };
    setUsers(current => current.map(item => item.id === user.id ? { ...item, permissions } : item));
    setSavingId(user.id);
    try {
      await base44.entities.User.update(user.id, { permissions });
      toast({ title: ui.saved });
    } catch (err) {
      toast({ title: t.user_error, description: err.message, variant: 'destructive' });
      load();
    } finally { setSavingId(null); }
  };

  const roleLabels = {
    admin: { label: t.user_roleAdmin, icon: Crown, color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', gradient: 'from-amber-500 to-orange-600' },
    user: { label: t.roleUser, icon: Shield, color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', gradient: 'from-blue-500 to-indigo-600' },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold text-gradient">{t.user_title}</h1><p className="text-muted-foreground text-sm mt-1">{users.length} {t.user_count}</p></div>
        <Button onClick={openCreate} className="gradient-primary text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-emerald-500/30"><UserPlus className="w-5 h-5 ml-2" /> {t.user_add}</Button>
      </div>

      <div className="glass rounded-3xl p-6 border border-border/50">
        <div className="flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-violet-600" /><h3 className="font-bold">{ui.permissionsTitle}</h3></div>
        <p className="text-sm text-muted-foreground">{ui.permissionsHint} {lang === 'ar' ? 'يتم تطبيقها من الخادم أيضًا لحماية البيانات.' : 'They are also enforced by the server to protect data.'}</p>
      </div>

      <div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={lang === 'ar' ? 'البحث بالاسم أو البريد الإلكتروني...' : 'Search by name or email...'} className="pr-11 h-12 rounded-2xl bg-background/50" /></div>

      {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {users.filter(u => `${u.name || u.full_name || ''} ${u.email || ''}`.toLowerCase().includes(searchQuery.toLowerCase())).map((u, i) => {
              const uiRole = u.role === 'admin' ? 'admin' : 'user';
              const RoleIcon = roleLabels[uiRole]?.icon || Shield;
              return (
                <motion.div key={u.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-3xl p-5 border border-border/50 hover:shadow-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${roleLabels[uiRole]?.gradient || roleLabels.user.gradient} flex items-center justify-center shadow-lg shrink-0`}><RoleIcon className="w-7 h-7 text-white" /></div>
                    <div className="flex-1 min-w-0"><h3 className="font-bold truncate">{u.name || u.email}</h3>{u.name && <p className="text-sm text-muted-foreground truncate flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {u.email}</p>}<span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleLabels[uiRole]?.color || roleLabels.user.color}`}>{roleLabels[uiRole]?.label || t.roleUser}</span></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                    <div><Label className="text-xs mb-1.5 block">{t.user_changeRole}</Label><Select value={uiRole} onValueChange={v => updateRole(u.id, v)} disabled={savingId === u.id}><SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">{t.user_roleAdmin}</SelectItem><SelectItem value="user">{t.roleUser}</SelectItem></SelectContent></Select></div>
                    <PermissionGrid permissions={u.permissions} role={u.role} lang={lang} onChange={(key, checked) => updatePermission(u, key, checked)} compact />
                    <div className="flex justify-end gap-2"><Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => openEdit(u)}><Pencil className="w-3.5 h-3.5 text-blue-500" /> {lang === 'ar' ? 'تعديل' : 'Edit'}</Button><Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5 text-red-600 border-red-200" onClick={() => setDeleteTarget(u)}><Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'حذف' : 'Delete'}</Button></div>
                    {savingId === u.id && <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {lang === 'ar' ? 'جارٍ حفظ التغيير...' : 'Saving change...'}</p>}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>{deleteTarget && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass rounded-3xl w-full max-w-md border border-border/50 shadow-2xl p-6"><div className="flex items-center gap-3 text-red-600"><AlertTriangle className="w-6 h-6" /><h2 className="text-lg font-extrabold">{lang === 'ar' ? 'تأكيد حذف المستخدم' : 'Confirm user deletion'}</h2></div><p className="text-sm text-muted-foreground mt-4">{lang === 'ar' ? `هل أنت متأكد من حذف ${deleteTarget.email}؟ لا يمكن التراجع عن هذا الإجراء.` : `Are you sure you want to delete ${deleteTarget.email}? This cannot be undone.`}</p><div className="flex gap-3 mt-6"><Button type="button" disabled={inviting} onClick={handleDelete} className="flex-1 rounded-2xl bg-red-600 text-white hover:bg-red-700">{inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : (lang === 'ar' ? 'نعم، احذف' : 'Yes, delete')}</Button><Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-2xl">{t.cancel}</Button></div></motion.div></motion.div>}</AnimatePresence>
      <AnimatePresence>{showForm && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"><motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()} className="glass rounded-3xl w-full max-w-2xl border border-border/50 shadow-2xl p-6 my-8"><div className="flex items-center justify-between gap-3 mb-2"><h2 className="text-xl font-extrabold text-gradient">{editingUser ? (lang === 'ar' ? 'تعديل المستخدم' : 'Edit user') : t.user_newTitle}</h2><Button type="button" variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button></div><p className="text-sm text-muted-foreground mb-4">{editingUser ? (lang === 'ar' ? 'تعديل الدور والصلاحيات لهذا المستخدم.' : 'Update this user role and permissions.') : ui.description}</p><form onSubmit={handleInvite} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-1.5"><Label>{ui.fullName}</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="rounded-xl" placeholder={lang === 'ar' ? 'اسم الموظف' : 'Employee name'} /></div><div className="space-y-1.5"><Label>{t.user_email}</Label><Input type="email" value={form.email} disabled={!!editingUser} onChange={e => setForm({ ...form, email: e.target.value })} required className="rounded-xl" placeholder="user@example.com" /></div></div>{!editingUser && <div className="space-y-1.5"><Label>{ui.password}</Label><Input type="password" minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required className="rounded-xl" placeholder="Temporary password" /></div>}<div className="space-y-1.5"><Label>{t.user_role}</Label><Select value={form.role} onValueChange={v => setForm({ ...form, role: v, permissions: v === 'admin' ? { ...ALL_PERMISSIONS } : { ...DEFAULT_USER_PERMISSIONS } })}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">{ui.adminRole}</SelectItem><SelectItem value="user">{ui.employeeRole}</SelectItem></SelectContent></Select></div><PermissionGrid permissions={form.permissions} role={form.role === 'admin' ? 'admin' : 'employee'} lang={lang} onChange={(key, checked) => setForm(current => ({ ...current, permissions: { ...current.permissions, [key]: checked } }))} /><div className="flex gap-3 pt-2"><Button type="submit" disabled={inviting} className="flex-1 gradient-primary text-white rounded-2xl h-12 font-bold">{inviting ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> {ui.creating}</> : (editingUser ? (lang === 'ar' ? 'حفظ التعديل' : 'Save changes') : ui.create)}</Button><Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingUser(null); }} className="rounded-2xl h-12 px-6">{t.cancel}</Button></div></form></motion.div></motion.div>}</AnimatePresence>
    </div>
  );
}
