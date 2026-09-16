import React, { useRef, useState } from 'react';
import { FileDown, Loader2, Printer, X, ShieldAlert, CheckSquare, Square } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';

const violationOptions = [
  { id: 'late', label: 'التأخر عن الدوام' },
  { id: 'neglect', label: 'إهمال في أداء العمل' },
  { id: 'phone', label: 'استخدام الهاتف أثناء الدوام' },
  { id: 'absent', label: 'الغياب بدون عذر' },
  { id: 'misconduct', label: 'سوء التعامل مع الزملاء/العملاء' },
  { id: 'permission', label: 'خروج بدون إذن' },
  { id: 'instructions', label: 'عدم الالتزام بالتعليمات' },
  { id: 'rules', label: 'مخالفة أنظمة وقواعد الشركة' },
  { id: 'other', label: 'أخرى' },
];

const valueOrDash = (v) => (v ? String(v) : '—');

export default function WarningDocument({ warning, employee, formatDate, onClose }) {
  const documentRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const warningNo = warning?.warning_number || `WRN-${warning?.id || 'DRAFT'}`;
  const displayDate = formatDate ? formatDate(warning?.date) : valueOrDash(warning?.date);
  const hireDate = formatDate ? formatDate(employee?.hire_date || warning?.hire_date) : valueOrDash(employee?.hire_date || warning?.hire_date);
  const selectedViolation = warning?.violation_type || 'other';

  const printDocument = () => window.print();

  const downloadPdf = async () => {
    if (!documentRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(documentRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.save(`${warningNo}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    } fontFinally: {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 210mm; height: 297mm; margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900/90 border border-slate-700 p-2 rounded-2xl shadow-2xl backdrop-blur-md no-print">
        <Button onClick={downloadPdf} disabled={exporting} className="gradient-primary text-white gap-2 rounded-xl">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          تنزيل PDF
        </Button>
        <Button variant="outline" onClick={printDocument} className="gap-2 rounded-xl bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
          <Printer className="w-4 h-4" /> طباعة
        </Button>
        <div className="h-4 w-px bg-slate-700 mx-1" />
        <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white rounded-xl">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Paper Container A4 */}
      <div className="my-auto py-12">
        <div
          ref={documentRef}
          className="print-area w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[15mm] mx-auto shadow-2xl relative font-sans text-right dir-rtl flex flex-col justify-between"
          style={{ boxSizing: 'border-box' }}
        >
          <div>
            {/* Header / Brand */}
            <header className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة الموارد البشرية</h1>
                <p className="text-xs text-slate-500 font-semibold mt-1">HUMAN RESOURCES DEPARTMENT</p>
              </div>
              <div className="text-left text-xs text-slate-600 leading-relaxed font-mono">
                <p><span className="font-bold text-slate-800">رقم المستند:</span> {warningNo}</p>
                <p><span className="font-bold text-slate-800">تاريخ الإصدار:</span> {displayDate}</p>
                <p className="text-rose-600 font-bold mt-1">سري للغاية</p>
              </div>
            </header>

            {/* Document Title */}
            <div className="text-center my-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-sm font-bold mb-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                إشعار إنذار وظيفي رسمي
              </div>
              <p className="text-xs text-slate-500">Official Employee Warning Notice</p>
            </div>

            {/* Employee Information Grid */}
            <section className="mb-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-r-4 border-slate-900 pr-2">بيانات الموظف الأساسية</h3>
              <div className="grid grid-cols-3 gap-2 border border-slate-300 rounded-lg p-3 text-xs bg-slate-50/50">
                <div><span className="text-slate-500 block">اسم الموظف:</span> <strong className="text-slate-900 text-sm">{valueOrDash(employee?.full_name || warning?.employee_name)}</strong></div>
                <div><span className="text-slate-500 block">القسم / الإدارة:</span> <strong className="text-slate-900">{valueOrDash(employee?.department || warning?.department)}</strong></div>
                <div><span className="text-slate-500 block">المسمى الوظيفي:</span> <strong className="text-slate-900">{valueOrDash(employee?.position || warning?.job_title)}</strong></div>
                <div className="mt-2"><span className="text-slate-500 block">رقم الهاتف:</span> <strong className="text-slate-900">{valueOrDash(employee?.phone || warning?.phone)}</strong></div>
                <div className="mt-2"><span className="text-slate-500 block">تاريخ التعيين:</span> <strong className="text-slate-900">{hireDate}</strong></div>
                <div className="mt-2"><span className="text-slate-500 block">درجة الإنذار:</span> <strong className="text-rose-700 font-bold">{valueOrDash(warning?.severity)}</strong></div>
              </div>
            </section>

            {/* Violation Matrix */}
            <section className="mb-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-r-4 border-slate-900 pr-2">تصنيف المخالفة</h3>
              <div className="grid grid-cols-3 gap-2 border border-slate-300 rounded-lg p-3 text-xs bg-slate-50/50">
                {violationOptions.map((opt) => {
                  const isChecked = selectedViolation === opt.id;
                  return (
                    <div key={opt.id} className="flex items-center gap-2">
                      {isChecked ? <CheckSquare className="w-4 h-4 text-slate-900 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
                      <span className={isChecked ? 'font-bold text-slate-900' : 'text-slate-600'}>{opt.label}</span>
                    </div>
                  );
                })}
              </div>
              {selectedViolation === 'other' && warning?.violation_text && (
                <div className="mt-2 text-xs border border-slate-200 p-2 rounded bg-amber-50/50">
                  <span className="font-bold text-slate-700">بيان المخالفة الأخرى: </span>
                  <span>{warning.violation_text}</span>
                </div>
              )}
            </section>

            {/* Details Section */}
            <section className="mb-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-r-4 border-slate-900 pr-2">تفاصيل الواقعة والأسباب</h3>
              <div className="border border-slate-300 rounded-lg p-4 text-xs leading-relaxed min-h-[90px] bg-white whitespace-pre-wrap">
                {valueOrDash(warning?.reason)}
              </div>
            </section>

            {/* Administrative Action */}
            <section className="mb-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-r-4 border-slate-900 pr-2">الإجراء الإداري المتخذ</h3>
              <div className="border border-slate-300 rounded-lg p-3 text-xs leading-relaxed bg-slate-50">
                {valueOrDash(warning?.action || 'يُحفظ هذا الإنذار في الملف الوظيفي للموظف مع اتخاذ الإجراءات اللازمة عند التكرار.')}
              </div>
            </section>

            {/* Employee Statement */}
            <section className="mb-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-r-4 border-slate-900 pr-2">إفادة الموظف</h3>
              <div className="border border-slate-300 rounded-lg p-3 text-xs leading-relaxed min-h-[60px] bg-white italic text-slate-700">
                {warning?.employee_statement || 'يقر الموظف باستلام هذا الإنذار والعلم بمضمونه، وله الحق في تقديم اعتراض خطي لإدارة الموارد البشرية خلال 3 أيام عمل.'}
              </div>
            </section>
          </div>

          {/* Signatures Footer */}
          <div>
            <section className="grid grid-cols-3 gap-4 border-t-2 border-slate-900 pt-6 text-center text-xs mt-4">
              <div className="space-y-8">
                <p className="font-bold text-slate-800">استلام وتوقيع الموظف</p>
                <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto" />
                <p className="text-[10px] text-slate-500">التاريخ: ____ / ____ / ________</p>
              </div>
              <div className="space-y-8">
                <p className="font-bold text-slate-800">اعتماد المدير المباشر</p>
                <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto" />
                <p className="text-[10px] text-slate-500">التاريخ: ____ / ____ / ________</p>
              </div>
              <div className="space-y-8">
                <p className="font-bold text-slate-800">اعتماد الموارد البشرية</p>
                <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto" />
                <p className="text-[10px] text-slate-500">التاريخ: ____ / ____ / ________</p>
              </div>
            </section>

            <footer className="mt-8 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 flex justify-between items-center">
              <span>HR System Official Generated Document</span>
              <span>صفحة 1 من 1</span>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
