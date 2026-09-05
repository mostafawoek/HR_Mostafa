import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff, Sparkles, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <AuthLayout
      icon={LogIn}
      title="مرحباً بعودتك"
      subtitle="سجّل الدخول للوصول إلى لوحة التحكم الخاصة بك"
      footer={
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>يتم إدارة الصلاحيات بواسطة مسؤول النظام</span>
        </div>
      }
    >
      {/* خلفية جمالية خفيفة خلف النموذج */}
      <div className="relative">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* رسالة الخطأ مع حركة Shake */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2 animate-shake backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-destructive animate-ping" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* حقل البريد الإلكتروني */}
          <div className="space-y-2 group">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
              البريد الإلكتروني
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-background/50 border-muted-foreground/20 rounded-xl focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all duration-300 shadow-sm hover:border-primary/40"
                required
              />
            </div>
          </div>

          {/* حقل كلمة المرور */}
          <div className="space-y-2 group">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
                كلمة المرور
              </Label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary/80 hover:text-primary font-medium hover:underline transition-all"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 bg-background/50 border-muted-foreground/20 rounded-xl focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all duration-300 shadow-sm hover:border-primary/40"
                required
              />
              {/* زر إظهار/إخفاء كلمة المرور */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* زر تسجيل الدخول المطوّر */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 font-semibold text-white rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري التحقق...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>تسجيل الدخول</span>
                <Sparkles className="w-4 h-4 opacity-70" />
              </div>
            )}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
