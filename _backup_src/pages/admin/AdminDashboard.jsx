import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { db } from '../../services/db';
import { Link } from 'react-router-dom';
import { Users, DollarSign, FileText } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ users: 0, pendingDeposits: 0, balance: 0 });

    useEffect(() => {
        const loadStats = async () => {
            const users = await db.getAllUsers();
            const txs = await db.getTransactions();
            const pending = txs.filter(t => t.type === 'deposit' && t.status === 'pending').length;

            // Calculate total user balance (demo metric)
            const totalBalance = users.reduce((acc, u) => acc + u.balance.usdt, 0);

            setStats({
                users: users.length,
                pendingDeposits: pending,
                balance: totalBalance
            });
        };
        loadStats();
    }, []);

    return (
        <div className="admin-dashboard">
            <h1 className="text-2xl font-bold mb-6 text-warning">Admin Dashboard</h1>

            <div className="grid-stats mb-8">
                <Card className="flex items-center gap-4">
                    <div className="p-3 bg-primary/20 rounded-full text-primary">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">{stats.users}</h3>
                        <p className="text-sm text-muted">Total Users</p>
                    </div>
                </Card>

                <Card className="flex items-center gap-4">
                    <div className="p-3 bg-warning/20 rounded-full text-warning">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">{stats.pendingDeposits}</h3>
                        <p className="text-sm text-muted">Pending Deposits</p>
                    </div>
                </Card>

                <Card className="flex items-center gap-4">
                    <div className="p-3 bg-success/20 rounded-full text-success">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">${stats.balance.toLocaleString()}</h3>
                        <p className="text-sm text-muted">Total User Holdings (USDT)</p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/admin/deposits">
                    <Card className="hover:bg-white/5 cursor-pointer h-full">
                        <h3 className="font-bold mb-2">Manage Deposits</h3>
                        <p className="text-sm text-muted">Review and approve pending deposit requests.</p>
                    </Card>
                </Link>
                <Link to="/admin/kyc">
                    <Card className="hover:bg-white/5 cursor-pointer h-full">
                        <h3 className="font-bold mb-2">Manage KYC</h3>
                        <p className="text-sm text-muted">Review identity documents.</p>
                    </Card>
                </Link>
                <Link to="/admin/packages">
                    <Card className="hover:bg-white/5 cursor-pointer h-full">
                        <h3 className="font-bold mb-2">Manage Packages</h3>
                        <p className="text-sm text-muted">Create and edit investment plans.</p>
                    </Card>
                </Link>
            </div>

            <style>{`
                .grid-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
