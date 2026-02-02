import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/db';
import { TrendingUp, ShieldCheck } from 'lucide-react';

const Invest = () => {
    const { user, refreshUser } = useAuth();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(null);
    const [investments, setInvestments] = useState([]);

    useEffect(() => {
        db.getPackages().then(setPackages);
        if (user) {
            db.getMyInvestments(user.id).then(setInvestments);
        }
    }, [user]);

    const handlePurchase = async (pkg) => {
        if (!confirm(`Purchase ${pkg.name} package for $${pkg.price}?`)) return;

        setLoading(pkg.id);
        try {
            await db.purchasePackage(user.id, pkg.id);
            await refreshUser();
            const inv = await db.getMyInvestments(user.id);
            setInvestments(inv);
            alert("Package Purchased Successfully!");
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="invest-page">
            <h1 className="text-2xl font-bold mb-2">Investment Packages</h1>
            <p className="text-muted mb-6">Choose a plan to grow your simulation portfolio.</p>

            <div className="grid-packages mb-8">
                {packages.map(pkg => (
                    <Card key={pkg.id} className={`package-card border-${pkg.color}`}>
                        <div className="pkg-header">
                            <h3 className="text-xl font-bold">{pkg.name}</h3>
                            <div className="roi-badge">{pkg.roi}% ROI</div>
                        </div>
                        <div className="pkg-price">
                            ${pkg.price.toLocaleString()}
                        </div>
                        <ul className="pkg-features">
                            <li><TrendingUp size={16} /> Duration: {pkg.duration} Days</li>
                            <li><ShieldCheck size={16} /> Principal Returned</li>
                            <li>Instant Withdrawal</li>
                        </ul>
                        <Button
                            className="w-full mt-4"
                            variant={pkg.price > 5000 ? 'primary' : 'outline'}
                            onClick={() => handlePurchase(pkg)}
                            isLoading={loading === pkg.id}
                        >
                            Buy Plan
                        </Button>
                    </Card>
                ))}
            </div>

            <h3 className="text-lg font-bold mb-4">Your Active Investments</h3>
            <div className="investments-list">
                {investments.length === 0 && <p className="text-muted">No active investments.</p>}
                {investments.map(inv => (
                    <Card key={inv.id} className="mb-3 flex justify-between items-center">
                        <div>
                            <h4 className="font-bold">{inv.packageName} Plan</h4>
                            <p className="text-xs text-muted">Amount: ${inv.amount} • Ends: {new Date(new Date(inv.startDate).setDate(new Date(inv.startDate).getDate() + 30)).toLocaleDateString()}</p>
                        </div>
                        <div className="text-success font-bold">
                            Active
                        </div>
                    </Card>
                ))}
            </div>

            <style>{`
                .grid-packages {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                }
                .package-card {
                    position: relative;
                    transition: transform 0.2s;
                }
                .package-card:hover {
                    transform: translateY(-5px);
                }
                .pkg-price {
                    font-size: 2rem;
                    font-weight: 800;
                    margin: 1rem 0;
                    color: var(--color-primary);
                }
                .roi-badge {
                    background: rgba(0,227,150,0.1);
                    color: var(--color-primary);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 0.8rem;
                }
                .pkg-features {
                    list-style: none;
                    opacity: 0.8;
                    font-size: 0.9rem;
                }
                .pkg-features li {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .border-bronze { border-top: 4px solid #cd7f32; }
                .border-silver { border-top: 4px solid #c0c0c0; }
                .border-gold { border-top: 4px solid #ffd700; }
                .border-platinum { border-top: 4px solid #e5e4e2; }
            `}</style>
        </div>
    );
};

export default Invest;
