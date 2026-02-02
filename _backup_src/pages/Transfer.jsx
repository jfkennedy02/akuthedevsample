import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/db';
import { Send, Users } from 'lucide-react';

export const Transfer = () => {
    const { user, refreshUser } = useAuth();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [asset, setAsset] = useState('usdt');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleTransfer = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!recipient || !amount) return;

        setLoading(true);
        try {
            await db.transfer(user.id, recipient, amount, asset);
            await refreshUser();
            setMessage({ type: 'success', text: 'Transfer Successful!' });
            setAmount('');
            setRecipient('');
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="transfer-page max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Send size={28} className="text-primary" /> Transfer Funds
            </h1>

            <Card>
                <form onSubmit={handleTransfer}>
                    <div className="bg-white/5 p-4 rounded-lg mb-6 flex items-center justify-between">
                        <div>
                            <span className="text-sm text-muted">Available Balance</span>
                            <h3 className="text-xl font-bold">
                                {user?.balance?.[asset]?.toLocaleString() || 0} {asset.toUpperCase()}
                            </h3>
                        </div>
                        <div className="p-2 bg-primary/20 rounded-full text-primary">
                            <Users size={20} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Asset</label>
                        <select
                            className="form-input"
                            value={asset}
                            onChange={(e) => setAsset(e.target.value)}
                        >
                            <option value="usdt">USDT</option>
                            <option value="btc">BTC</option>
                            <option value="eth">ETH</option>
                        </select>
                    </div>

                    <Input
                        label="Recipient Username"
                        placeholder="e.g. admin"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        required
                    />

                    <Input
                        label="Amount"
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="0.0001"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />

                    {message.text && (
                        <div className={`p-3 rounded mb-4 text-sm font-bold ${message.type === 'error' ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>
                            {message.text}
                        </div>
                    )}

                    <Button type="submit" className="w-full" isLoading={loading}>
                        Send Funds
                    </Button>
                </form>
            </Card>

            <div className="mt-8">
                <h3 className="text-lg font-bold mb-2">Recent Transfers</h3>
                <p className="text-muted text-sm">Check your wallet history for details.</p>
            </div>
        </div>
    );
};

export default Transfer;
