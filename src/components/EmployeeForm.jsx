import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n';
import { useHrLabels } from '@/lib/hrHelpers';

export default function EmployeeForm({ employee, departments, onSave, onClose }) {
  const { t } = useLanguage();
  const { statusLabels, genderLabels } = useHrLabels();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', position: '', department: '',
    hire_date: '', salary: '', status: 'active', address: '', national_id: '',
    date_of_birth: '', gender: 'male', avatar: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (employee) setForm({ ...form, ...employee, salary: employee.salary || '' });
  }, [employee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        salary: form.salary ? Number(form.salary) : null,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="glass rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin border border-border/50 shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-border/50 sticky top-0 glass z-10">
          <h2 className="text-xl font-extrabold text-gradient">{employee ? t.empf_edit : t.empf_add}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t.empf_fullName}</Label>
              <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t.empf_email}</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.empf_phone}</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.empf_position}</Label>
              <Input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t.empf_department}</Label>
              <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                <SelectTrigger><SelectValue placeholder={t.empf_selectDept} /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.empf_salary}</Label>
              <Input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.empf_hireDate}</Label>
              <Input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.empf_birthDate}</Label>
              <Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.empf_gender}</Label>
              <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{genderLabels.male.label}</SelectItem>
                  <SelectItem value="female">{genderLabels.female.label}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.empf_status}</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{statusLabels.active.label}</SelectItem>
                  <SelectItem value="inactive">{statusLabels.inactive.label}</SelectItem>
                  <SelectItem value="suspended">{statusLabels.suspended.label}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.empf_nationalId}</Label>
              <Input value={form.national_id} onChange={e => setForm({ ...form, national_id: e.target.value })} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>{t.empf_address}</Label>
              <Textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1 gradient-primary text-white rounded-2xl h-12 text-base font-bold shadow-lg shadow-violet-500/30">
              <Save className="w-5 h-5 ml-2" />
              {saving ? t.saving : t.save}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl h-12 px-6">{t.cancel}</Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}