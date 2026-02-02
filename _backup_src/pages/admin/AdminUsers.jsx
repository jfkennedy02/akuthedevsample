import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { db } from '../../services/db';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        db.getAllUsers().then(setUsers);
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-warning">User Management</h1>
            <div className="grid gap-4">
                {users.map(u => (
                    <Card key={u.id} className="flex justify-between items-center p-4">
                        <div>
                            <h3 className="font-bold">{u.fullName} <span className="text-xs font-normal text-muted">(@{u.username})</span></h3>
                            <div className="text-sm text-muted mt-1 flex gap-3">
                                <span>USDT: {u.balance.usdt.toFixed(2)}</span>
                                <span>BTC: {u.balance.btc.toFixed(4)}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={`text-xs px-2 py-1 rounded bg-white/5 font-bold mb-1 status-${u.kycStatus}`}>
                                KYC: {u.kycStatus.toUpperCase()}
                            </span>
                            <span className="text-xs text-muted">Role: {u.role}</span>
                        </div>
                    </Card>
                ))}
            </div>
            <style>{`
                .status-approved { color: var(--color-success); }
                .status-pending { color: var(--color-warning); }
                .status-rejected { color: var(--color-danger); }
            `}</style>
        </div>
    )
}

export default AdminUsers;
