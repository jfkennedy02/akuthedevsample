import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Bitcoin } from 'lucide-react';
import { db } from '../services/db';

const AssetCard = ({ symbol, name, balance, price, change, color }) => {
    // Simulated value calculation
    const value = balance * price;

    return (
        <Card className="asset-card">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="asset-icon" style={{ background: color + '20', color: color }}>
                        {symbol.substring(0, 1)}
                    </div>
                    <div>
                        <h3 className="font-bold">{name}</h3>
                        <span className="text-xs text-muted">{symbol}</span>
                    </div>
                </div>
                <div className={`text-sm ${change >= 0 ? 'text-success' : 'text-danger'}`}>
                    {change > 0 ? '+' : ''}{change}%
                </div>
            </div>

            <div className="mt-2">
                <h4 className="text-xl font-bold">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                <p className="text-sm text-muted">{balance.toLocaleString()} {symbol}</p>
            </div>

            <style>{`
                .asset-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                }
            `}</style>
        </Card>
    )
}

const Dashboard = () => {
    const { user, refreshUser } = useAuth();
    const [stats, setStats] = useState({ totalValue: 0 });
    const [prices] = useState({
        BTC: 45000,
        ETH: 2800,
        USDT: 1
    });

    useEffect(() => {
        refreshUser();
        // Calculate total portfolio value roughly
        if (user) {
            const total =
                (user.balance.btc * prices.BTC) +
                (user.balance.eth * prices.ETH) +
                (user.balance.usdt * prices.USDT);
            setStats({ totalValue: total });
        }
    }, []);

    if (!user) return null;

    return (
        <div className="dashboard-page">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Portfolio Overview</h1>
                <Card className="bg-gradient-primary">
                    <div className="p-2">
                        <p className="text-sm opacity-80 mb-1">Total Balance (Estimated)</p>
                        <h2 className="text-4xl font-black">${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                        <div className="flex gap-4 mt-4">
                            <button className="btn btn-sm btn-light">Deposit</button>
                            <button className="btn btn-sm btn-outline-light">Withdraw</button>
                        </div>
                    </div>
                </Card>
            </div>

            <h3 className="text-lg font-bold mb-4">Your Assets</h3>
            <div className="grid-assets">
                <AssetCard
                    symbol="BTC"
                    name="Bitcoin"
                    balance={user.balance.btc}
                    price={prices.BTC}
                    change={2.5}
                    color="#f7931a"
                />
                <AssetCard
                    symbol="ETH"
                    name="Ethereum"
                    balance={user.balance.eth}
                    price={prices.ETH}
                    change={-1.2}
                    color="#627eea"
                />
                <AssetCard
                    symbol="USDT"
                    name="Tether"
                    balance={user.balance.usdt}
                    price={prices.USDT}
                    change={0.01}
                    color="#26a17b"
                />
            </div>

            <style>{`
                .bg-gradient-primary {
                    background: linear-gradient(135deg, rgba(0,227,150,0.2) 0%, rgba(0,0,0,0) 100%);
                    border: 1px solid var(--color-primary);
                }
                .btn-light {
                    background: #fff;
                    color: #000;
                }
                .btn-outline-light {
                    border: 1px solid #fff;
                    color: #fff;
                }
                .grid-assets {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
