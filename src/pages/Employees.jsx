import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { 
  Plus, Search, Pencil, Trash2, Users, Mail, Phone, Briefcase, 
  Printer, Eye, LayoutGrid, List, Table as TableIcon, Filter, 
  X, CheckCircle2, AlertCircle, ShieldOff, DollarSign, Building2, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import { useLanguage } from '@/lib/i18n';
import { useHrLabels } from '@/lib/hrHelpers';
import EmployeeForm from '@/components/EmployeeForm';

export default function Employees() {
  const { t, lang } = useLanguage();
  const { statusLabels, formatCurrency } = useHrLabels();
  
  // States
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table' | 'list'
  
  // Modals & States
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [loading, setLoading] = useState(true);

  const printRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const [emps, depts] = await Promise.all([
        base44.entities.Employee.list('-created_date', 200),
        base44.entities.Department.list(),
      ]);
      setEmployees(emps || []);
      setDepartments(depts || []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  // Filter Logic
  const filtered = employees.filter(e => {
    const term = search.toLowerCase();
    const matchSearch = (
      (e.full_name || '') + 
      (e.email || '') + 
      (e.position || '') + 
      (e.department || '')
    ).toLowerCase().includes(term);
    
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchDept = filterDept === 'all' || e.department === filterDept;
    
    return matchSearch && matchStatus && matchDept;
  });

  // Action Handlers
  const handleSave = async (data) => {
    if (editing) {
      await base44.entities.Employee.update(editing.id, data);
    } else {
      await base44.entities.Employee.create(data);
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Employee.delete(id);
    setDeleteConfirmId(null);
    if (viewingEmployee?.id === id) setViewingEmployee(null);
    load();
  };

  const openEdit = (emp) => { 
    setEditing(emp); 
    setShowForm(true); 
  };

  const openAdd = () => { 
    setEditing(null); 
    setShowForm(true); 
  };

  // Print Action
  const handlePrint = (emp) => {
    const printWindow = window.open('', '_blank');
    const content = `
      <html dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
        <head>
          <title>${emp.full_name} - ${t.emp_title || 'Employee Profile'}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            .card { border: 2px solid #e2e8f0; border-radius: 16px; padding: 30px; max-width: 600px; margin: 0 auto; }
            .header { display: flex; align-items: center; gap: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px; }
            .avatar { width: 90px; height: 90px; border-radius: 50%; background: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .info-item { background: #f8fafc; padding: 12px 16px; border-radius: 10px; }
            .label { font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600; }
            .value { font-size: 15px; font-weight: 600; color: #0f172a; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; }
            @media print { body { padding: 0; } .card { border: none; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="avatar">${emp.full_name?.charAt(0) || 'U'}</div>
              <div>
                <h1 style="margin:0; font-size: 24px;">${emp.full_name}</h1>
                <p style="margin:4px 0 0; color: #6366f1; font-weight: 600;">${emp.position || '-'}</p>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-item"><div class="label">${t.emp_dept || 'Department'}</div><div class="value">${emp.department || '-'}</div></div>
              <div class="info-item"><div class="label">${t.status || 'Status'}</div><div class="value">${statusLabels[emp.status]?.label || emp.status}</div></div>
              <div class="info-item"><div class="label">${t.email || 'Email'}</div><div class="value">${emp.email || '-'}</div></div>
              <div class="info-item"><div class="label">${t.phone || 'Phone'}</div><div class="value">${emp.phone || '-'}</div></div>
              <div class="info-item"><div class="label">${t.emp_salary || 'Salary'}</div><div class="value">${emp.salary != null ? formatCurrency(emp.salary) : '-'}</div></div>
              <div class="info-item"><div class="label">ID</div><div class="value">${emp.id}</div></div>
            </div>
            <div class="footer">Printed on ${new Date().toLocaleDateString()}</div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  // Stats Calculations
  const totalSalary = filtered.reduce((acc, curr) => acc + Number(curr.salary || 0), 0);
  const activeCount = filtered.filter(e => e.status === 'active').length;

  return (
    <div className="space-y-6 pb-12">
      {/* 🚀 Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-background/50 backdrop-blur-md p-6 rounded-3xl border border-border/50 shadow-sm">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t.emp_title || 'إدارة الموظفين'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            إدارة الموظفين والوصول إلى بياناتهم وبيانات رواتبهم بسهولة.
          </p>
        </div>
        <Button 
          onClick={openAdd} 
          className="gradient-primary text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5 ml-2" /> {t.emp_add || 'إضافة موظف جديد'}
        </Button>
      </div>

      {/* 📊 Quick Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-2xl border border-border/50 flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 text-violet-600 rounded-xl"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">إجمالي الموظفين</p>
            <h4 className="text-xl font-bold">{employees.length}</h4>
          </div>
        </div>
        <div className="glass p-4 rounded-2xl border border-border/50 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl"><UserCheck className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">نشط الان</p>
            <h4 className="text-xl font-bold">{activeCount}</h4>
          </div>
        </div>
        <div className="glass p-4 rounded-2xl border border-border/50 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl"><Building2 className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">الأقسام</p>
            <h4 className="text-xl font-bold">{departments.length}</h4>
          </div>
        </div>
        <div className="glass p-4 rounded-2xl border border-border/50 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl"><DollarSign className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">مجموع الرواتب</p>
            <h4 className="text-xl font-bold">{formatCurrency(totalSalary)}</h4>
          </div>
        </div>
      </div>

      {/* 🔍 Filters & Display Modes */}
      <div className="glass rounded-2xl p-4 border border-border/50 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 justify-between">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder={t.emp_search || 'بحث بالإسم، البريد، أو المسمى الوظيفي...'} 
              className="pr-10 rounded-xl h-11 bg-background/50 border-border/60" 
            />
          </div>

          {/* Filters & View Switchers */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 h-11 rounded-xl text-sm font-medium bg-background/50 border border-border/60 focus:outline-none"
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
              <option value="suspended">موقوف</option>
            </select>

            {/* Department Filter */}
            {departments.length > 0 && (
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 h-11 rounded-xl text-sm font-medium bg-background/50 border border-border/60 focus:outline-none"
              >
                <option value="all">كل الأقسام</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-muted/60 rounded-xl border border-border/40">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                title="عرض شبكي"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                title="عرض جدول"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                title="عرض قائمة"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 📦 Main Content Area */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center border border-border/50 my-8">
          <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4 animate-bounce" />
          <h3 className="text-lg font-bold">لا يوجد موظفين</h3>
          <p className="text-muted-foreground text-sm mt-1">لم نجد أي نتائج تطابق خيارات البحث الخاصة بك.</p>
        </div>
      ) : (
        <>
          {/* 1️⃣ GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {filtered.map((emp, i) => (
                  <motion.div
                    key={emp.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.02 }}
                    className="glass rounded-3xl p-5 border border-border/50 hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-black shrink-0 shadow-md shadow-violet-500/20 overflow-hidden">
                            {emp.avatar ? <Image src={emp.avatar} className="w-full h-full object-cover" fittingType="fill" /> : emp.full_name?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-base truncate group-hover:text-violet-600 transition-colors">{emp.full_name}</h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Briefcase className="w-3 h-3" /> {emp.position}</p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusLabels[emp.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                          {statusLabels[emp.status]?.label || emp.status}
                        </span>
                      </div>

                      <div className="mt-5 space-y-2 text-xs">
                        {emp.email && <p className="flex items-center gap-2 text-muted-foreground truncate"><Mail className="w-3.5 h-3.5 text-violet-500 shrink-0" /> {emp.email}</p>}
                        {emp.phone && <p className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5 text-violet-500 shrink-0" /> {emp.phone}</p>}
                        {emp.department && <p className="text-muted-foreground flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-violet-500 shrink-0" /> <span className="font-medium text-foreground">{emp.department}</span></p>}
                        {emp.salary != null && <p className="text-muted-foreground flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> <span className="font-bold text-emerald-600">{formatCurrency(emp.salary)}</span></p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-5 pt-4 border-t border-border/40">
                      <Button size="sm" variant="ghost" onClick={() => setViewingEmployee(emp)} className="rounded-xl flex-1 text-xs">
                        <Eye className="w-3.5 h-3.5 ml-1 text-violet-600" /> عرض
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handlePrint(emp)} className="rounded-xl p-2">
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(emp)} className="rounded-xl p-2">
                        <Pencil className="w-3.5 h-3.5 text-blue-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(emp.id)} className="rounded-xl p-2 hover:bg-rose-50 text-rose-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* 2️⃣ TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="glass rounded-3xl border border-border/50 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-muted/50 border-b border-border/50 text-xs font-bold text-muted-foreground">
                    <tr>
                      <th className="p-4">الموظف</th>
                      <th className="p-4">القسم</th>
                      <th className="p-4">المسمى الوظيفي</th>
                      <th className="p-4">التواصل</th>
                      <th className="p-4">الراتب</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filtered.map((emp) => (
                      <tr key={emp.id} className="hover:bg-violet-500/5 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white font-bold shrink-0">
                            {emp.avatar ? <Image src={emp.avatar} className="w-full h-full rounded-xl object-cover" fittingType="fill" /> : emp.full_name?.charAt(0)}
                          </div>
                          <span className="font-semibold text-foreground">{emp.full_name}</span>
                        </td>
                        <td className="p-4 text-muted-foreground">{emp.department || '-'}</td>
                        <td className="p-4 font-medium">{emp.position || '-'}</td>
                        <td className="p-4 text-xs text-muted-foreground">
                          <div>{emp.email}</div>
                          <div>{emp.phone}</div>
                        </td>
                        <td className="p-4 font-bold text-emerald-600">{emp.salary != null ? formatCurrency(emp.salary) : '-'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusLabels[emp.status]?.color}`}>
                            {statusLabels[emp.status]?.label || emp.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setViewingEmployee(emp)} className="h-8 w-8 p-0 rounded-lg"><Eye className="w-4 h-4 text-violet-600" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => handlePrint(emp)} className="h-8 w-8 p-0 rounded-lg"><Printer className="w-4 h-4 text-slate-600" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(emp)} className="h-8 w-8 p-0 rounded-lg"><Pencil className="w-4 h-4 text-blue-600" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(emp.id)} className="h-8 w-8 p-0 rounded-lg text-rose-600"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3️⃣ COMPACT LIST VIEW */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              {filtered.map((emp) => (
                <div key={emp.id} className="glass rounded-2xl p-4 border border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-violet-500/40 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold shrink-0">
                      {emp.avatar ? <Image src={emp.avatar} className="w-full h-full rounded-xl object-cover" fittingType="fill" /> : emp.full_name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-base">{emp.full_name}</h4>
                      <p className="text-xs text-muted-foreground">{emp.position} • <span className="text-violet-600 font-medium">{emp.department}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm justify-between md:justify-end">
                    <div className="text-left hidden lg:block">
                      <p className="font-bold text-emerald-600">{emp.salary != null ? formatCurrency(emp.salary) : ''}</p>
                      <p className="text-xs text-muted-foreground">{emp.phone}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusLabels[emp.status]?.color}`}>
                      {statusLabels[emp.status]?.label || emp.status}
                    </span>
                    <div className="flex items-center gap-1 border-r pr-2 border-border/40">
                      <Button size="sm" variant="ghost" onClick={() => setViewingEmployee(emp)}><Eye className="w-4 h-4 text-violet-600" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handlePrint(emp)}><Printer className="w-4 h-4 text-slate-600" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(emp)}><Pencil className="w-4 h-4 text-blue-600" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(emp.id)} className="text-rose-600"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 👁️ VIEW EMPLOYEE MODAL */}
      <AnimatePresence>
        {viewingEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background border border-border rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-6"
            >
              <button onClick={() => setViewingEmployee(null)} className="absolute top-5 left-5 p-2 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white text-3xl font-black shrink-0 shadow-lg shadow-violet-500/30 overflow-hidden">
                  {viewingEmployee.avatar ? <Image src={viewingEmployee.avatar} className="w-full h-full object-cover" fittingType="fill" /> : viewingEmployee.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{viewingEmployee.full_name}</h3>
                  <p className="text-sm text-violet-600 font-medium">{viewingEmployee.position}</p>
                  <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold ${statusLabels[viewingEmployee.status]?.color}`}>
                    {statusLabels[viewingEmployee.status]?.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/40 p-3 rounded-2xl border border-border/40">
                  <p className="text-xs text-muted-foreground">القسم</p>
                  <p className="font-semibold">{viewingEmployee.department || '-'}</p>
                </div>
                <div className="bg-muted/40 p-3 rounded-2xl border border-border/40">
                  <p className="text-xs text-muted-foreground">الراتب الشهري</p>
                  <p className="font-bold text-emerald-600">{viewingEmployee.salary ? formatCurrency(viewingEmployee.salary) : '-'}</p>
                </div>
                <div className="bg-muted/40 p-3 rounded-2xl border border-border/40 col-span-2">
                  <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                  <p className="font-semibold">{viewingEmployee.email || '-'}</p>
                </div>
                <div className="bg-muted/40 p-3 rounded-2xl border border-border/40 col-span-2">
                  <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                  <p className="font-semibold">{viewingEmployee.phone || '-'}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={() => handlePrint(viewingEmployee)} variant="outline" className="flex-1 rounded-xl h-11 font-bold">
                  <Printer className="w-4 h-4 ml-2" /> طباعة البطاقة
                </Button>
                <Button onClick={() => { const emp = viewingEmployee; setViewingEmployee(null); openEdit(emp); }} className="flex-1 rounded-xl h-11 font-bold gradient-primary text-white">
                  <Pencil className="w-4 h-4 ml-2" /> تعديل البيانات
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ⚠️ DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-background border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4"
            >
              <div className="w-16 h-16 bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">هل أنت تأكد من الحذف؟</h3>
              <p className="text-sm text-muted-foreground">سيؤدي هذا إلى حذف الموظف نهائياً من النظام. لا يمكنك التراجع عن هذا الإجراء.</p>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="flex-1 rounded-xl h-11">إلغاء</Button>
                <Button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 rounded-xl h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold">نعم، احذف</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📝 FORM MODAL */}
      <AnimatePresence>
        {showForm && (
          <EmployeeForm 
            employee={editing} 
            departments={departments} 
            onSave={handleSave} 
            onClose={() => setShowForm(false)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}
