import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { db } from '../../services/db';
import { Check, X, Eye } from 'lucide-react';

const AdminDeposits = () => {
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(null);

    const loadDeposits = async () => {
        const txs = await db.getTransactions();
        // Filter all pending deposits
        setDeposits(txs.filter(t => t.type === 'deposit' && t.status === 'pending'));
    };

    useEffect(() => {
        loadDeposits();
    }, []);

    const handleAction = async (id, status) => {
        setLoading(id);
        try {
            await db.updateTransactionStatus(id, status);
            await loadDeposits();
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-warning">Pending Deposits</h1>

            {deposits.length === 0 ? (
                <Card className="p-8 text-center text-muted">
                    No pending deposits.
                </Card>
            ) : (
                <div className="grid gap-4">
                    {deposits.map(tx => (
                        <Card key={tx.id} className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="flex items-center gap-4">
                                {tx.proofImage && (
                                    <img
                                        src={tx.proofImage}
                                        alt="Proof"
                                        className="w-16 h-16 object-cover rounded bg-white/5 cursor-pointer hover:scale-150 transition-transform"
                                        onClick={() => window.open(tx.proofImage, '_blank')}
                                    />
                                )}
                                <div>
                                    <div className="font-bold text-lg">
                                        {tx.amount} {tx.asset.toUpperCase()}
                                    </div>
                                    <div className="text-xs text-muted">
                                        User: {tx.userId}<br />
                                        Date: {new Date(tx.date).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    className="btn-success btn-sm"
                                    onClick={() => handleAction(tx.id, 'approved')}
                                    isLoading={loading === tx.id}
                                >
                                    <Check size={16} className="mr-1" /> Approve
                                </Button>
                                <Button
                                    className="btn-danger btn-sm"
                                    onClick={() => handleAction(tx.id, 'rejected')}
                                    isLoading={loading === tx.id}
                                >
                                    <X size={16} className="mr-1" /> Reject
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

export default AdminDeposits;
