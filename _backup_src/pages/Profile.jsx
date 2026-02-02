import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/db';
import { ShieldCheck, User, Upload, ScanFace, CheckCircle, Clock, XCircle } from 'lucide-react';

const Profile = () => {
    const { user, refreshUser } = useAuth();
    const [step, setStep] = useState(1);
    const [kycData, setKycData] = useState({ front: null, back: null, selfie: null });
    const [previews, setPreviews] = useState({ front: null, back: null, selfie: null });
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);

    if (!user) return null;

    const handleFile = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            setKycData(prev => ({ ...prev, [field]: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [field]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleScan = async () => {
        setScanning(true);
        // Simulate AI Scan
        await new Promise(r => setTimeout(r, 2500));
        setScanning(false);
        setStep(2); // Move to review/submit
    };

    const handleSubmitKYC = async () => {
        if (!previews.front || !previews.back || !previews.selfie) return alert("Please upload all documents");
        setLoading(true);
        try {
            await db.submitKYC(user.id, {
                front: previews.front,
                back: previews.back,
                selfie: previews.selfie
            });
            await refreshUser();
            alert("KYC Submitted for Review!");
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStatus = () => {
        if (user.kycStatus === 'approved') return (
            <div className="flex items-center gap-2 text-success font-bold bg-success/10 p-4 rounded-lg">
                <ShieldCheck size={24} /> Verified Account
            </div>
        );
        if (user.kycStatus === 'pending') return (
            <div className="flex items-center gap-2 text-warning font-bold bg-warning/10 p-4 rounded-lg">
                <Clock size={24} /> Application Under Review
            </div>
        );
        if (user.kycStatus === 'rejected') return (
            <div className="flex items-center gap-2 text-danger font-bold bg-danger/10 p-4 rounded-lg">
                <XCircle size={24} /> Application Rejected. Please try again.
            </div>
        );
        return (
            <div className="flex items-center gap-2 text-muted font-bold bg-white/5 p-4 rounded-lg">
                <User size={24} /> Unverified Account
            </div>
        );
    };

    return (
        <div className="profile-page max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">User Profile</h1>

            <Card className="mb-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                        <User size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{user.fullName}</h2>
                        <p className="text-muted">@{user.username}</p>
                    </div>
                </div>
                {renderStatus()}
            </Card>

            {(user.kycStatus === 'none' || user.kycStatus === 'rejected') && (
                <div className="kyc-section">
                    <h2 className="text-xl font-bold mb-4">Complete Verification</h2>
                    <Card>
                        {step === 1 && (
                            <>
                                <div className="mb-6">
                                    <h3 className="font-bold mb-2">1. Upload ID Documents</h3>
                                    <p className="text-sm text-muted mb-4">Upload a clear photo of your ID Front, Back, and a Selfie.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {['front', 'back', 'selfie'].map(field => (
                                            <div key={field} className="upload-box">
                                                <input
                                                    type="file"
                                                    id={`kyc-${field}`}
                                                    className="hidden"
                                                    onChange={(e) => handleFile(e, field)}
                                                    accept="image/*"
                                                />
                                                <label htmlFor={`kyc-${field}`} className="cursor-pointer block text-center p-4 h-full">
                                                    {previews[field] ? (
                                                        <img src={previews[field]} className="w-full h-32 object-cover rounded" />
                                                    ) : (
                                                        <div className="h-32 flex flex-col items-center justify-center text-muted">
                                                            <Upload size={24} className="mb-2" />
                                                            <span className="capitalize">{field} Payload</span>
                                                        </div>
                                                    )}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={handleScan}
                                    disabled={!previews.front || !previews.back || !previews.selfie || scanning}
                                >
                                    {scanning ? (
                                        <>
                                            <ScanFace className="animate-pulse mr-2" /> Analyzing Biometrics...
                                        </>
                                    ) : (
                                        "Proceed to Verification"
                                    )}
                                </Button>
                            </>
                        )}

                        {step === 2 && (
                            <div className="text-center">
                                <div className="mb-6">
                                    <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center text-success mx-auto mb-4">
                                        <CheckCircle size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-success">Biometrics Matched (98%)</h3>
                                    <p className="text-muted">Analysis complete. Please confirm submission.</p>
                                </div>
                                <Button className="w-full" onClick={handleSubmitKYC} isLoading={loading}>
                                    Submit Final Application
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            <style>{`
                .upload-box {
                    border: 2px dashed var(--color-border);
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    transition: all 0.2s;
                    background: rgba(255,255,255,0.02);
                }
                .upload-box:hover {
                    border-color: var(--color-primary);
                    background: rgba(255,255,255,0.05);
                }
            `}</style>
        </div>
    );
};

export default Profile;
