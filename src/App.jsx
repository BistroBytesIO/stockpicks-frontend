import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { AdminNavbar } from './components/AdminNavbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { SubscriptionPlans } from './pages/SubscriptionPlans';
import { SubscriptionSuccess } from './pages/SubscriptionSuccess';
import { Contact } from './pages/Contact';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminBlogManagement } from './pages/AdminBlogManagement';
import { ProtectedRoute } from './components/ProtectedRoute';

const queryClient = new QueryClient();

// Component to handle navbar rendering based on route
const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Conditionally render navbar */}
      {isAdminRoute && location.pathname !== '/admin/login' ? <AdminNavbar /> : !isAdminRoute ? <Navbar /> : null}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/plans" element={<SubscriptionPlans />} />
          <Route path="/subscription-plans" element={<SubscriptionPlans />} />
          <Route path="/subscription-success" element={<SubscriptionSuccess />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/blog" element={<AdminBlogManagement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;