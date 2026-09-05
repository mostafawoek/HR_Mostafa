export const PERMISSION_MODULES = [
  { key: 'dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard' },
  { key: 'employees', labelAr: 'الموظفون', labelEn: 'Employees' },
  { key: 'departments', labelAr: 'الفروع والأقسام', labelEn: 'Branches & Departments' },
  { key: 'attendance', labelAr: 'الحضور والانصراف', labelEn: 'Attendance' },
  { key: 'leaves', labelAr: 'الإجازات', labelEn: 'Leave Requests' },
  { key: 'performance', labelAr: 'الأداء والمهام', labelEn: 'Performance & Tasks' },
  { key: 'salaries', labelAr: 'الرواتب', labelEn: 'Salaries' },
  { key: 'warnings', labelAr: 'الإنذارات', labelEn: 'Warnings' },
  { key: 'documents', labelAr: 'المستندات', labelEn: 'Documents' },
  { key: 'reports', labelAr: 'التقارير', labelEn: 'Reports' },
  { key: 'users', labelAr: 'المستخدمون والصلاحيات', labelEn: 'Users & Permissions' },
];

export const ALL_PERMISSIONS = Object.fromEntries(PERMISSION_MODULES.map(({ key }) => [key, true]));
export const DEFAULT_USER_PERMISSIONS = Object.fromEntries(
  PERMISSION_MODULES.map(({ key }) => [key, key !== 'users'])
);

export const normalizePermissions = (permissions, role = 'employee') => {
  if (role === 'admin') return { ...ALL_PERMISSIONS };
  return Object.fromEntries(PERMISSION_MODULES.map(({ key }) => [key, permissions?.[key] === true]));
};

export const canAccess = (user, key) => user?.role === 'admin' || user?.permissions?.[key] === true;

export const permissionForPath = {
  '/': 'dashboard',
  '/employees': 'employees',
  '/departments': 'departments',
  '/attendance': 'attendance',
  '/leaves': 'leaves',
  '/performance': 'performance',
  '/salaries': 'salaries',
  '/warnings': 'warnings',
  '/documents': 'documents',
  '/reports': 'reports',
  '/users': 'users',
};
