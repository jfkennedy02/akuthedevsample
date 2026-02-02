import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(formData.username, formData.password);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const fillAdmin = () => {
        setFormData({ username: 'admin', password: 'admin123' });
    };

    return (
        <Card>
            <div className="mb-4">
                <h2 className="text-xl font-bold mb-1">Welcome Back</h2>
                <p className="text-muted text-sm">Sign in to your demo account</p>
            </div>

            <form onSubmit={handleSubmit}>
                <Input
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    required
                />
                <Input
                    label="Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                />

                {error && <div className="text-danger text-sm mb-3">{error}</div>}

                <Button
                    type="submit"
                    className="w-full mb-3"
                    isLoading={loading}
                    style={{ width: '100%' }}
                >
                    Sign In
                </Button>
            </form>

            <div className="text-center mt-4 text-sm text-muted">
                Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign Up</Link>
            </div>

            {/* Demo helper */}
            <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-muted mb-2 text-center">Development Helpers:</p>
                <div className="flex gap-2 justify-center">
                    <button
                        type="button"
                        onClick={fillAdmin}
                        className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-white"
                    >
                        Auto-fill Admin
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default Login;
