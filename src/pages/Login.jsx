import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  User, 
  Lock, 
  Loader2, 
  LogIn, 
  Fingerprint, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Settings,
  HelpCircle,
  Code
} from "lucide-react";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "اسم المستخدم أو كلمة المرور غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F4F7F6] font-sans dir-rtl select-none overflow-hidden">
      
      {/* القسم الأيسر / العلوي: الهوية البصرية، اللوجو، والمميزات */}
      <div className="lg:w-7/12 w-full relative flex flex-col justify-between p-8 lg:p-16 bg-gradient-to-br from-[#ffffff] via-[#f0f5f3] to-[#e1ece8] overflow-hidden">
        
        {/* خلفية جمالية ممتدة في الأسفل باللون الأخضر والذهبي */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-[#063B2B] rounded-t-[100%] border-t-4 border-[#D4AF37] shadow-2xl opacity-95 transform translate-y-12 scale-110 pointer-events-none" />

        {/* الهيدر العلوي: اسم الشركة */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#063B2B] flex items-center justify-center text-[#D4AF37] shadow-md border border-[#D4AF37]/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#063B2B] tracking-wide">شركة الحلول المتقدمة</h2>
            <p className="text-[10px] text-emerald-700 font-medium">ADVANCED SOLUTIONS CO.</p>
          </div>
        </div>

        {/* الشعار الرئيسي والعنوان في المنتصف */}
        <div className="relative z-10 my-auto text-center py-12 flex flex-col items-center">
          {/* شعار الشركة (Logo Icon) */}
          <div className="w-28 h-28 mb-6 rounded-full border-4 border-[#D4AF37] bg-white p-2 shadow-xl flex items-center justify-center relative group transition-transform duration-500 hover:scale-105">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#063B2B] to-[#0D5C45] flex items-center justify-center text-white shadow-inner">
              <Users className="w-12 h-12 text-[#D4AF37]" />
            </div>
            <div className="absolute -bottom-2 w-8 h-2 bg-[#D4AF37] rounded-full shadow-sm" />
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#063B2B] tracking-tight mb-2">
            نظام إدارة الموارد البشرية
          </h1>
          <p className="text-xs font-bold text-[#D4AF37] tracking-[0.2em] uppercase mb-4">
            — HR SYSTEM —
          </p>

          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-4" />

          <p className="text-slate-600 text-sm max-w-sm leading-relaxed font-medium">
            نظام متكامل لإدارة رأس المال البشري بكفاءة واحترافية عالية
          </p>

          {/* الأيقونات الأربعة السفلية */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 w-full max-w-lg">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#063B2B] shadow-md group-hover:bg-[#063B2B] group-hover:text-[#D4AF37] transition-all duration-300">
                <Settings className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#063B2B]">إدارة متكاملة</span>
            </div>

            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#063B2B] shadow-md group-hover:bg-[#063B2B] group-hover:text-[#D4AF37] transition-all duration-300">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#063B2B]">تقارير ذكية</span>
            </div>

            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#063B2B] shadow-md group-hover:bg-[#063B2B] group-hover:text-[#D4AF37] transition-all duration-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#063B2B]">أمان وخصوصية</span>
            </div>

            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#063B2B] shadow-md group-hover:bg-[#063B2B] group-hover:text-[#D4AF37] transition-all duration-300">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#063B2B]">شركاء في النجاح</span>
            </div>
          </div>
        </div>

        {/* معلومات المطور السفلية */}
        <div className="relative z-10 flex items-center justify-between text-xs text-white/80 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-[#D4AF37]" />
            <span>تطوير المهندس: <strong className="text-white font-semibold">ENG. Mostafa Hagag</strong></span>
          </div>
          <span>v2.4.0</span>
        </div>
      </div>

      {/* القسم الأيمن: كارت تسجيل الدخول */}
      <div className="lg:w-5/12 w-full flex flex-col justify-between p-6 lg:p-12 bg-white relative shadow-2xl z-20">
        
        <div className="my-auto max-w-md w-full mx-auto">
          {/* أيقونة الدخول العلوية */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#063B2B] flex items-center justify-center text-white shadow-lg mb-4 border-2 border-[#D4AF37]">
              <ShieldCheck className="w-9 h-9 text-[#D4AF37]" />
            </div>
            <h2 className="text-2xl font-bold text-[#063B2B]">تسجيل الدخول</h2>
            <p className="text-xs text-slate-500 mt-1">يرجى إدخال بياناتك للوصول إلى النظام</p>
          </div>

          {/* تنبيه الخطأ */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* حقل اسم المستخدم / البريد */}
            <div className="space-y-1.5">
              <div className="relative">
                <Input
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="اسم المستخدم أو البريد"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pr-11 pl-4 bg-slate-50 border-slate-200 text-slate-800 rounded-xl focus:bg-white focus:border-[#063B2B] focus:ring-1 focus:ring-[#063B2B] transition-all text-sm"
                  required
                />
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* حقل كلمة المرور */}
            <div className="space-y-1.5">
              <div className="relative">
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pr-11 pl-4 bg-slate-50 border-slate-200 text-slate-800 rounded-xl focus:bg-white focus:border-[#063B2B] focus:ring-1 focus:ring-[#063B2B] transition-all text-sm"
                  required
                />
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* خيار تذكرني */}
            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#063B2B] focus:ring-[#063B2B]"
                />
                <span>تذكرني</span>
              </label>
            </div>

            {/* زر تسجيل الدخول الرئيسي */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#063B2B] hover:bg-[#042B1F] text-white font-bold rounded-xl shadow-lg shadow-[#063B2B]/20 active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </Button>

            {/* فاصل أو */}
            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs text-slate-400 absolute">أو</span>
            </div>

            {/* زر الدخول بالبصمة */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2 text-sm"
            >
              <Fingerprint className="w-5 h-5 text-[#063B2B]" />
              <span>دخول سريع بالبصمة</span>
            </Button>

            {/* نسيت كلمة المرور */}
            <div className="text-center pt-2">
              <Link
                to="/forgot-password"
                className="text-xs text-slate-500 hover:text-[#063B2B] inline-flex items-center gap-1 transition-colors font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>نسيت كلمة المرور؟</span>
              </Link>
            </div>
          </form>
        </div>

        {/* الحقوق السفلية */}
        <div className="text-center text-xs text-slate-400 pt-6">
          جميع الحقوق محفوظة © {new Date().getFullYear()}
        </div>
      </div>

    </div>
  );
}
