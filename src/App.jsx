import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/i18n';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/" replace />} />
      <Route path="/reset-password" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/leaves" element={<Leaves />} />
        <Route path="/warnings" element={<Warnings />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/salaries" element={<Salaries />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<Users />} />
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