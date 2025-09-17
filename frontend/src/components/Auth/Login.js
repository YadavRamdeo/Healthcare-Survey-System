import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Activity, Mail, Lock } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../App';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            // Send the data as-is, backend will handle email vs username
            const loginData = {
                username: data.usernameOrEmail, // Backend expects 'username' field
                password: data.password,
            };

            const response = await authAPI.login(loginData);
            const { user, token } = response.data;

            login(user, token);
            toast.success(`Welcome back, ${user.first_name || user.username}!`);
            navigate('/dashboard');
        } catch (error) {
            toast.error(
                error.response?.data?.error ||
                error.response?.data?.detail ||
                error.response?.data?.message ||
                'Login failed. Please check your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="auth-background-overlay"></div>
            </div>

            <div className="auth-content">
                <div className="auth-card">
                    {/* Header */}
                    <div className="auth-header">
                        <div className="auth-logo">
                            <Activity className="logo-icon" />
                            <span className="logo-text">HealthSurvey</span>
                        </div>
                        <h1 className="auth-title">Welcome Back</h1>
                        <p className="auth-subtitle">
                            Sign in to your account to access healthcare surveys
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">
                                <Mail size={16} />
                                Username or Email
                            </label>
                            <input
                                type="text"
                                className={`form-input ${errors.usernameOrEmail ? 'error' : ''}`}
                                placeholder="Enter your username or email"
                                {...register('usernameOrEmail', {
                                    required: 'Username or email is required',
                                    minLength: {
                                        value: 3,
                                        message: 'Must be at least 3 characters'
                                    }
                                })}
                            />
                            {errors.usernameOrEmail && (
                                <span className="form-error">{errors.usernameOrEmail.message}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Lock size={16} />
                                Password
                            </label>
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className={`form-input ${errors.password ? 'error' : ''}`}
                                    placeholder="Enter your password"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 6,
                                            message: 'Password must be at least 6 characters'
                                        }
                                    })}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && (
                                <span className="form-error">{errors.password.message}</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="loading-spinner"></div>
                                    Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer">
                        <p>
                            Don't have an account?{' '}
                            <Link to="/register" className="auth-link">
                                Sign up here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Features */}
                <div className="auth-features">
                    <h3>Healthcare Survey Platform</h3>
                    <div className="features-list">
                        <div className="feature-item">
                            <div className="feature-icon">📊</div>
                            <div>
                                <h4>Advanced Analytics</h4>
                                <p>Comprehensive insights and reporting tools</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🔒</div>
                            <div>
                                <h4>Secure & Compliant</h4>
                                <p>HIPAA compliant data protection</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">⚡</div>
                            <div>
                                <h4>Real-time Results</h4>
                                <p>Instant data collection and analysis</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;