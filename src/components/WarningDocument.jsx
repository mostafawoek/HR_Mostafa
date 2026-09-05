import { useRef, useState } from 'react';
import { FileDown, Loader2, Printer, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';

const violationLabels = {
  late: 'التأخر عن الدوام',
  absent: 'الغياب بدون عذر',
  instructions: 'عدم الالتزام بتعليمات العمل',
  neglect: 'إهمال في أداء العمل',
  misconduct: 'سوء التعامل مع الزملاء أو العملاء',
  rules: 'مخالفة أنظمة وقواعد الشركة',
  phone: 'استخدام الهاتف أثناء الدوام',
  permission: 'خروج من العمل بدون إذن',
  other: 'أخرى',
};

const violationMarkPositions = {
  late: { left: '91.3%', top: '44.2%' },
  absent: { left: '91.3%', top: '47.0%' },
  instructions: { left: '91.3%', top: '49.8%' },
  neglect: { left: '64.4%', top: '44.2%' },
  misconduct: { left: '64.4%', top: '47.0%' },
  rules: { left: '64.4%', top: '49.8%' },
  phone: { left: '31.8%', top: '44.2%' },
  permission: { left: '31.8%', top: '47.0%' },
  other: { left: '31.8%', top: '49.8%' },
};

const valueOrDash = value => value || '—';

const getEmployeeNumber = employee => (
  employee?.employee_number
  || employee?.employee_code
  || employee?.code
  || (employee?.id ? employee.id.slice(0, 8).toUpperCase() : '')
);

const getWarningNumber = warning => {
  if (warning?.warning_number) return warning.warning_number;
  if (warning?.id) return `WR-${String(warning.id).slice(0, 8).toUpperCase()}`;
  return 'WR-DRAFT';
};

export default function WarningDocument({ warning, employee, formatDate, onClose }) {
  const documentRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const violation = warning?.violation_type || warning?.violation || 'other';
  const violationLabel = violationLabels[violation] || warning?.violation_text || violationLabels.other;
  const details = warning?.reason || warning?.details || '';
  const displayDate = formatDate ? formatDate(warning?.date) : valueOrDash(warning?.date);
  const hireDate = formatDate ? formatDate(employee?.hire_date) : valueOrDash(employee?.hire_date);

  const printDocument = () => window.print();

  const downloadPdf = async () => {
    if (!documentRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.save(`${getWarningNumber(warning)}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="warning-document-overlay" role="dialog" aria-modal="true" aria-label="ورقة إنذار الموظف">
      <div className="warning-document-toolbar">
        <div className="flex items-center gap-2">
          <Button type="button" onClick={downloadPdf} disabled={exporting} className="gap-2 gradient-primary text-white">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            تنزيل PDF
          </Button>
          <Button type="button" variant="outline" onClick={printDocument} className="gap-2 bg-white">
            <Printer className="w-4 h-4" /> طباعة
          </Button>
        </div>
        <Button type="button" variant="ghost" onClick={onClose} className="text-white hover:bg-white/15" aria-label="إغلاق">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div ref={documentRef} className="warning-document-sheet" dir="rtl">
        <div className="warning-document-value warning-number">{getWarningNumber(warning)}</div>
        <div className="warning-document-value warning-date">{displayDate}</div>
        <div className="warning-document-value warning-employee-number">{valueOrDash(getEmployeeNumber(employee))}</div>

        <div className="warning-document-value employee-name">{valueOrDash(employee?.full_name || warning?.employee_name)}</div>
        <div className="warning-document-value hire-date">{hireDate}</div>
        <div className="warning-document-value employee-position">{valueOrDash(employee?.position)}</div>
        <div className="warning-document-value employee-phone">{valueOrDash(employee?.phone)}</div>
        <div className="warning-document-value employee-department">{valueOrDash(employee?.department)}</div>
        <div className="warning-document-value employee-email">{valueOrDash(employee?.email)}</div>

        <div className="warning-document-check" style={violationMarkPositions[violation] || violationMarkPositions.other}>✓</div>
        {violation === 'other' && warning?.violation_text && (
          <div className="warning-document-value other-violation">{warning.violation_text}</div>
        )}
        <div className="warning-document-details">{details}</div>
      </div>
    </div>
  );
}
