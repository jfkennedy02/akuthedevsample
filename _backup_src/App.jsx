import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Deposit from './pages/Deposit';
import Invest from './pages/Invest';
import Transfer from './pages/Transfer';
import { Profile, Settings } from './pages/Placeholders';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDeposits from './pages/admin/AdminDeposits';
import AdminKYC from './pages/admin/AdminKYC';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPackages from './pages/admin/AdminPackages';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

// Placeholder Dashboard
const Dashboard = () => {
    const { user, logout } = useAuth();
    return (
        <div style={{ padding: '2rem' }}>
            <h1>Welcome, {user.fullName}</h1>
            <p>Your Balance: ${user.balance.usdt}</p>
            <button onClick={logout} className="btn btn-secondary">Logout</button>
        </div>
    )
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="sim-warning-banner">
                    ⚠️ SIMULATION ONLY - DEMO PORTFOLIO - NOT REAL MONEY ⚠️
                </div>
                <div className="app-container">
                    <Routes>
                        <Route element={<AuthLayout />}>
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                        </Route>

                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<Dashboard />} />
                            <Route path="deposit" element={<Deposit />} />
                            <Route path="invest" element={<Invest />} />
                            <Route path="transfer" element={<Transfer />} />
                            <Route path="profile" element={<Profile />} />
                            <Route path="settings" element={<Settings />} />

                            {/* Admin Routes */}
                            <Route path="admin/dashboard" element={<AdminDashboard />} />
                            <Route path="admin/deposits" element={<AdminDeposits />} />
                            <Route path="admin/kyc" element={<AdminKYC />} />
                            <Route path="admin/users" element={<AdminUsers />} />
                            <Route path="admin/packages" element={<AdminPackages />} />
                        </Route>

                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
