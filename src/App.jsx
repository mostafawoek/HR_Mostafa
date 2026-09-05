import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider, useLanguage } from '@/lib/i18n';
import { canAccess } from '@/lib/permissions';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Employees from '@/pages/Employees';
import Departments from '@/pages/Departments';
import Leaves from '@/pages/Leaves';
import Warnings from '@/pages/Warnings';
import Documents from '@/pages/Documents';
import Users from '@/pages/Users';
import Attendance from '@/pages/Attendance';
import Performance from '@/pages/Performance';
import Salaries from '@/pages/Salaries';
import Reports from '@/pages/Reports';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { Toaster } from '@/components/ui/toaster';

const PermissionDenied = () => {
  const { lang } = useLanguage();
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass rounded-3xl p-8 max-w-lg text-center border border-border/50">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center text-rose-600 text-2xl font-black">!</div>
        <h1 className="text-xl font-extrabold mt-4">{lang === 'ar' ? 'لا توجد صلاحية للوصول' : 'Access not permitted'}</h1>
        <p className="text-sm text-muted-foreground mt-2">{lang === 'ar' ? 'اطلب من مدير النظام تفعيل صلاحية هذه الوحدة لحسابك.' : 'Ask the system administrator to enable this module for your account.'}</p>
      </div>
    </div>
  );
};

const PermissionRoute = ({ permission, children }) => {
  const { user } = useAuth();
  return canAccess(user, permission) ? children : <PermissionDenied />;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>;
  }

  if (!isAuthenticated) {
    return <Routes><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/" replace />} />
      <Route path="/reset-password" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route path="/" element={<PermissionRoute permission="dashboard"><Dashboard /></PermissionRoute>} />
        <Route path="/employees" element={<PermissionRoute permission="employees"><Employees /></PermissionRoute>} />
        <Route path="/departments" element={<PermissionRoute permission="departments"><Departments /></PermissionRoute>} />
        <Route path="/leaves" element={<PermissionRoute permission="leaves"><Leaves /></PermissionRoute>} />
        <Route path="/warnings" element={<PermissionRoute permission="warnings"><Warnings /></PermissionRoute>} />
        <Route path="/documents" element={<PermissionRoute permission="documents"><Documents /></PermissionRoute>} />
        <Route path="/attendance" element={<PermissionRoute permission="attendance"><Attendance /></PermissionRoute>} />
        <Route path="/performance" element={<PermissionRoute permission="performance"><Performance /></PermissionRoute>} />
        <Route path="/salaries" element={<PermissionRoute permission="salaries"><Salaries /></PermissionRoute>} />
        <Route path="/reports" element={<PermissionRoute permission="reports"><Reports /></PermissionRoute>} />
        <Route path="/users" element={<PermissionRoute permission="users"><Users /></PermissionRoute>} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <LanguageProvider>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </LanguageProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
