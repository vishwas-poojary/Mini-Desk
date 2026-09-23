import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardOverview } from './pages/dashboard/index';
import { BooksPage } from './pages/books/index';
import { MembersPage } from './pages/members/index';
import { CheckoutsPage } from './pages/checkouts/index';
import { AuthGuard, RoleGuard } from './components/routes/RouteWrappers';
import { authApi } from './api/auth';
import type { User, LoginResponse } from '@minidesk/types';
import { Loader2 } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Silent session check via httpOnly refresh cookie on application mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await authApi.refresh();
        const me = await authApi.fetchMe();
        setUser(me.user);
      } catch {
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    initAuth();
  }, []);

  const handleLoginSuccess = (data: LoginResponse) => {
    setUser(data.user);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  if (checkingAuth) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: 'var(--text-secondary)',
        }}
      >
        <Loader2 size={32} className="animate-spin" color="var(--accent-blue)" />
        <p style={{ fontSize: '0.9rem' }}>Initializing MiniDesk Session...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
          }
        />

        {/* Protected Nested Layout Routes */}
        <Route
          element={
            <AuthGuard user={user}>
              <MainLayout user={user!} onLogout={handleLogout} />
            </AuthGuard>
          }
        >
          <Route index element={<DashboardOverview user={user!} />} />
          <Route path="books" element={<BooksPage />} />

          {/* Role-guarded admin & librarian routes */}
          <Route
            path="members"
            element={
              <RoleGuard user={user!} allowedRoles={['admin', 'librarian']}>
                <MembersPage />
              </RoleGuard>
            }
          />

          <Route
            path="checkouts"
            element={
              <RoleGuard user={user!} allowedRoles={['admin', 'librarian']}>
                <CheckoutsPage />
              </RoleGuard>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
