import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/db';
import { UploadCloud, Clock, CheckCircle, XCircle } from 'lucide-react';

const Deposit = () => {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [asset, setAsset] = useState('usdt');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    const loadHistory = async () => {
        if (user) {
            const txs = await db.getTransactions(user.id);
            setHistory(txs.filter(t => t.type === 'deposit'));
        }
    }

    useEffect(() => {
        loadHistory();
    }, [user]);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(selected);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !preview) return alert("Please enter amount and upload proof");

        setLoading(true);
        try {
            await db.deposit(user.id, asset, amount, preview);
            // Reset form
            setAmount('');
            setFile(null);
            setPreview(null);
            alert("Deposit Request Submitted!");
            loadHistory();
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="deposit-page">
            <div className="grid-split">
                {/* Deposit Form */}
                <div>
                    <h2 className="text-xl font-bold mb-4">Deposit Funds</h2>
                    <Card>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Select Asset</label>
                                <select
                                    className="form-input"
                                    value={asset}
                                    onChange={(e) => setAsset(e.target.value)}
                                >
                                    <option value="usdt">USDT (Tether)</option>
                                    <option value="btc">Bitcoin</option>
                                    <option value="eth">Ethereum</option>
                                </select>
                            </div>

                            <Input
                                label="Amount"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0"
                                step="0.0001"
                                required
                            />

                            <div className="form-group">
                                <label className="form-label">Payment Proof (Screenshot)</label>
                                <div className="upload-area">
                                    <input
                                        type="file"
                                        id="proof"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    <label htmlFor="proof" className="upload-label">
                                        {preview ? (
                                            <img src={preview} alt="Proof" className="preview-img" />
                                        ) : (
                                            <div className="text-center p-6">
                                                <UploadCloud size={32} className="mx-auto mb-2 text-primary" />
                                                <span className="text-sm text-muted">Click to upload image</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" isLoading={loading}>
                                Submit Deposit
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* History */}
                <div>
                    <h2 className="text-xl font-bold mb-4">Recent Deposits</h2>
                    <div className="history-list">
                        {history.length === 0 && <p className="text-muted text-sm">No deposits yet.</p>}
                        {history.map(tx => (
                            <Card key={tx.id} className="mb-3 p-4 flex justify-between items-center">
                                <div>
                                    <div className="font-bold flex items-center gap-2">
                                        {tx.asset.toUpperCase()} {tx.amount}
                                    </div>
                                    <div className="text-xs text-muted">
                                        {new Date(tx.date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className={`status-badge status-${tx.status}`}>
                                    {tx.status === 'pending' && <Clock size={14} />}
                                    {tx.status === 'approved' && <CheckCircle size={14} />}
                                    {tx.status === 'rejected' && <XCircle size={14} />}
                                    <span className="capitalize ml-1">{tx.status}</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .grid-split {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }
                .upload-area {
                    border: 2px dashed var(--color-border);
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: rgba(255,255,255,0.02);
                }
                .upload-area:hover {
                    border-color: var(--color-primary);
                    background: rgba(255,255,255,0.05);
                }
                .upload-label { cursor: pointer; display: block; }
                .preview-img { width: 100%; max-height: 200px; object-fit: cover; }
                
                .status-badge {
                    display: flex;
                    align-items: center;
                    padding: 4px 8px;
                    border-radius: 99px;
                    font-size: 0.75rem;
                    font-weight: bold;
                }
                .status-pending { background: rgba(254, 176, 25, 0.2); color: var(--color-warning); }
                .status-approved { background: rgba(0, 227, 150, 0.2); color: var(--color-success); }
                .status-rejected { background: rgba(255, 69, 96, 0.2); color: var(--color-danger); }
                
                @media (max-width: 768px) {
                    .grid-split { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default Deposit;
