import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);
        try {
            await register({
                username: formData.username,
                fullName: formData.fullName,
                password: formData.password
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <Card>
            <div className="mb-4">
                <h2 className="text-xl font-bold mb-1">Create Account</h2>
                <p className="text-muted text-sm">Start your crypto simulation journey</p>
            </div>

            <form onSubmit={handleSubmit}>
                <Input
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Your full name"
                    required
                />
                <Input
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    required
                />
                <Input
                    label="Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create password"
                    required
                />
                <Input
                    label="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    required
                />

                {error && <div className="text-danger text-sm mb-3">{error}</div>}

                <Button
                    type="submit"
                    className="w-full mb-3"
                    isLoading={loading}
                    style={{ width: '100%' }}
                >
                    Create Account
                </Button>
            </form>

            <div className="text-center mt-4 text-sm text-muted">
                Already have an account? <Link to="/login" className="text-primary hover:underline">Sign In</Link>
            </div>
        </Card>
    );
};

export default Signup;
