import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { UserCog, UserPlus, Shield, Mail, Crown, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/i18n';

export default function Users() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const u = await base44.entities.User.list();
      setUsers(u);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await base44.users.inviteUser(form.email, form.role, form.name, form.password);
      toast({ title: t.user_inviteSuccess, description: `${form.email} → ${form.role === 'admin' ? t.user_roleAdmin : t.roleUser}` });
      setForm({ name: '', email: '', password: '', role: 'user' });
      setShowForm(false);
      load();
    } catch (err) {
      toast({ title: t.user_error, description: err.message || t.user_inviteFail, variant: 'destructive' });
    } finally {
      setInviting(false);
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      await base44.entities.User.update(userId, { role: newRole });
      toast({ title: t.user_roleUpdated });
      load();
    } catch (err) {
      toast({ title: t.user_error, description: err.message, variant: 'destructive' });
    }
  };

  const roleLabels = {
    admin: { label: t.user_roleAdmin, icon: Crown, color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', gradient: 'from-amber-500 to-orange-600' },
    user: { label: t.roleUser, icon: Shield, color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', gradient: 'from-blue-500 to-indigo-600' },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient">{t.user_title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} {t.user_count}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gradient-primary text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-emerald-500/30">
          <UserPlus className="w-5 h-5 ml-2" /> {t.user_add}
        </Button>
      </div>

      {/* Permissions info */}
      <div className="glass rounded-3xl p-6 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-violet-600" />
          <h3 className="font-bold">{t.user_permSystem}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-start gap-3">
            <Crown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">{t.user_adminTitle}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.user_adminDesc}</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">{t.user_userTitle}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.user_userDesc}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {users.map((u, i) => {
              const uiRole = u.role === 'admin' ? 'admin' : 'user';
              const RoleIcon = roleLabels[uiRole]?.icon || Shield;
              return (
                <motion.div key={u.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass rounded-3xl p-5 border border-border/50 hover:shadow-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${roleLabels[uiRole]?.gradient || roleLabels.user.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                      <RoleIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{u.full_name || u.email}</h3>
                      {u.full_name && <p className="text-sm text-muted-foreground truncate flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {u.email}</p>}
                      <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleLabels[uiRole]?.color || roleLabels.user.color}`}>
                        {roleLabels[uiRole]?.label || t.roleUser}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Label className="text-xs mb-1.5 block">{t.user_changeRole}</Label>
                    <Select value={uiRole} onValueChange={v => updateRole(u.id, v)}>
                      <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{t.user_roleAdmin}</SelectItem>
                        <SelectItem value="user">{t.roleUser}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
              className="glass rounded-3xl w-full max-w-md border border-border/50 shadow-2xl p-6">
              <h2 className="text-xl font-extrabold text-gradient mb-4">{t.user_newTitle}</h2>
              <p className="text-sm text-muted-foreground mb-4">Create login credentials for a new system user.</p>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-1.5"><Label>Full name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="rounded-xl" placeholder="Employee name" /></div>
                <div className="space-y-1.5"><Label>{t.user_email}</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="rounded-xl" placeholder="user@example.com" /></div>
                <div className="space-y-1.5"><Label>Initial password (8+ characters)</Label><Input type="password" minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required className="rounded-xl" placeholder="Temporary password" /></div>
                <div className="space-y-1.5">
                  <Label>{t.user_role}</Label>
                  <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t.user_adminFull}</SelectItem>
                      <SelectItem value="user">{t.user_userLimited}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={inviting} className="flex-1 gradient-primary text-white rounded-2xl h-12 font-bold">
                    {inviting ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> Creating...</> : 'Create user'}
                  </Button>
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