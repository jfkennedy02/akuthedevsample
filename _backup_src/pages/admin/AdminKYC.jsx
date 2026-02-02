import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { db } from '../../services/db';
import { Check, X } from 'lucide-react';

const AdminKYC = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(null);

    const loadRequests = async () => {
        const users = await db.getAllUsers();
        setRequests(users.filter(u => u.kycStatus === 'pending'));
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleAction = async (userId, status) => {
        setLoading(userId);
        try {
            await db.adminReviewKYC(userId, status);
            await loadRequests();
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-warning">Pending KYC Requests</h1>

            {requests.length === 0 ? (
                <Card className="p-8 text-center text-muted">
                    No pending KYC applications.
                </Card>
            ) : (
                <div className="grid gap-6">
                    {requests.map(req => (
                        <Card key={req.id}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">{req.fullName}</h3>
                                    <p className="text-sm text-muted">@{req.username}</p>
                                </div>
                                <div className="text-xs text-muted">
                                    Submitted: {new Date(req.kycData.submittedAt).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                {['front', 'back', 'selfie'].map(key => (
                                    <div key={key}>
                                        <p className="text-xs text-muted mb-1 capitalize">{key}</p>
                                        <img
                                            src={req.kycData[key]}
                                            className="w-full h-24 object-cover rounded bg-white/5 cursor-pointer hover:scale-110 transition"
                                            onClick={() => window.open(req.kycData[key], '_blank')}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 justify-end border-t border-white/10 pt-4">
                                <Button
                                    className="btn-success btn-sm"
                                    onClick={() => handleAction(req.id, 'approved')}
                                    isLoading={loading === req.id}
                                >
                                    <Check size={16} className="mr-1" /> Approve KYC
                                </Button>
                                <Button
                                    className="btn-danger btn-sm"
                                    onClick={() => handleAction(req.id, 'rejected')}
                                    isLoading={loading === req.id}
                                >
                                    <X size={16} className="mr-1" /> Reject KYC
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            <style>{`
                .btn-success {
                    background-color: var(--color-success);
                    color: #fff;
                }
            `}</style>
        </div>
    );
};

export default AdminKYC;
