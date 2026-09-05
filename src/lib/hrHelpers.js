import { useLanguage } from '@/lib/i18n';

const palette = { green: 'bg-emerald-100 text-emerald-700', amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700', blue: 'bg-blue-100 text-blue-700', slate: 'bg-slate-100 text-slate-700' };
const labels = (t, items) => Object.fromEntries(items.map(([key, label, color = 'slate']) => [key, { label: label || key, color: palette[color] }]));

export const statusLabels = { active: { label: 'Active', color: palette.green }, inactive: { label: 'Inactive', color: palette.slate }, suspended: { label: 'Suspended', color: palette.red } };
export const leaveStatusLabels = { pending: { label: 'Pending', color: palette.amber }, approved: { label: 'Approved', color: palette.green }, rejected: { label: 'Rejected', color: palette.red } };

export function useHrLabels() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  return {
    statusLabels: ar ? { active: { label: 'نشط', color: palette.green }, inactive: { label: 'غير نشط', color: palette.slate }, suspended: { label: 'موقوف', color: palette.red } } : statusLabels,
    leaveStatusLabels: ar ? { pending: { label: 'قيد المراجعة', color: palette.amber }, approved: { label: 'مقبول', color: palette.green }, rejected: { label: 'مرفوض', color: palette.red } } : leaveStatusLabels,
    attendanceStatusLabels: labels(null, ar ? [['present','حاضر','green'],['absent','غائب','red'],['late','متأخر','amber']] : [['present','Present','green'],['absent','Absent','red'],['late','Late','amber']]),
    leaveTypeLabels: labels(null, ar ? [['annual','سنوية','blue'],['sick','مرضية','red'],['emergency','طارئة','amber'],['other','أخرى','slate']] : [['annual','Annual','blue'],['sick','Sick','red'],['emergency','Emergency','amber'],['other','Other','slate']]),
    performanceStatusLabels: labels(null, ar ? [['pending','قيد المراجعة','amber'],['approved','معتمد','green']] : [['pending','Pending','amber'],['approved','Approved','green']]),
    taskPriorityLabels: labels(null, ar ? [['high','عالية','red'],['medium','متوسطة','amber'],['low','منخفضة','green']] : [['high','High','red'],['medium','Medium','amber'],['low','Low','green']]),
    taskStatusLabels: labels(null, ar ? [['todo','جديدة','slate'],['in_progress','قيد التنفيذ','blue'],['completed','مكتملة','green']] : [['todo','To do','slate'],['in_progress','In progress','blue'],['completed','Completed','green']]),
    salaryStatusLabels: labels(null, ar ? [['pending','معلق','amber'],['paid','مدفوع','green']] : [['pending','Pending','amber'],['paid','Paid','green']]),
    warningTypeLabels: labels(null, ar ? [['verbal','شفهي','amber'],['written','كتابي','red'],['other','أخرى','slate']] : [['verbal','Verbal','amber'],['written','Written','red'],['other','Other','slate']]),
    severityLabels: labels(null, ar ? [['low','منخفض','green'],['medium','متوسط','amber'],['high','مرتفع','red']] : [['low','Low','green'],['medium','Medium','amber'],['high','High','red']]),
    docTypeLabels: labels(null, ar ? [['contract','عقد','blue'],['identity','هوية','amber'],['certificate','شهادة','green'],['other','أخرى','slate']] : [['contract','Contract','blue'],['identity','Identity','amber'],['certificate','Certificate','green'],['other','Other','slate']]),
    genderLabels: ar ? { male: { label: 'ذكر' }, female: { label: 'أنثى' } } : { male: { label: 'Male' }, female: { label: 'Female' } },
    formatDate: value => value ? new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-US').format(new Date(value)) : '—',
    formatTime: value => value || '—',
    formatCurrency: value => new Intl.NumberFormat(
  ar ? 'ar-AE' : 'en-AE',
  {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 2,
  }
).format(Number(value || 0)),

  };
}
