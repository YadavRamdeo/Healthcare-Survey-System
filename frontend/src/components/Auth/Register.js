import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Activity, Mail, Lock, User, Phone, Calendar } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../App';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm();

    const password = watch('password', '');

    const roleOptions = [
        {
            value: 'patient',
            label: 'Patient',
            description: 'Access and complete surveys',
            icon: '👤'
        },
        {
            value: 'healthcare_provider',
            label: 'Healthcare Provider',
            description: 'Create and manage surveys',
            icon: '👩‍⚕️'
        },
        {
            value: 'researcher',
            label: 'Researcher',
            description: 'Conduct research studies',
            icon: '🔬'
        }
    ];

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const { confirmPassword, ...registerData } = data;
            const response = await authAPI.register(registerData);
            const { user, token } = response.data;

            login(user, token);
            toast.success(`Welcome to HealthSurvey, ${user.first_name || user.username}!`);
            navigate('/dashboard');
        } catch (error) {
            const errorMessage = error.response?.data?.username?.[0] ||
                error.response?.data?.email?.[0] ||
                error.response?.data?.detail ||
                'Registration failed. Please try again.';
            toast.error(errorMessage);
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
                        <h1 className="auth-title">Create Account</h1>
                        <p className="auth-subtitle">
                            Join our healthcare survey platform
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    <User size={16} />
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    className={`form-input ${errors.first_name ? 'error' : ''}`}
                                    placeholder="First name"
                                    {...register('first_name', {
                                        required: 'First name is required'
                                    })}
                                />
                                {errors.first_name && (
                                    <span className="form-error">{errors.first_name.message}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <User size={16} />
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    className={`form-input ${errors.last_name ? 'error' : ''}`}
                                    placeholder="Last name"
                                    {...register('last_name', {
                                        required: 'Last name is required'
                                    })}
                                />
                                {errors.last_name && (
                                    <span className="form-error">{errors.last_name.message}</span>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <User size={16} />
                                Username
                            </label>
                            <input
                                type="text"
                                className={`form-input ${errors.username ? 'error' : ''}`}
                                placeholder="Choose a username"
                                {...register('username', {
                                    required: 'Username is required',
                                    minLength: {
                                        value: 3,
                                        message: 'Username must be at least 3 characters'
                                    }
                                })}
                            />
                            {errors.username && (
                                <span className="form-error">{errors.username.message}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Mail size={16} />
                                Email Address
                            </label>
                            <input
                                type="email"
                                className={`form-input ${errors.email ? 'error' : ''}`}
                                placeholder="your.email@example.com"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address'
                                    }
                                })}
                            />
                            {errors.email && (
                                <span className="form-error">{errors.email.message}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Phone size={16} />
                                Phone Number (Optional)
                            </label>
                            <input
                                type="tel"
                                className={`form-input ${errors.phone ? 'error' : ''}`}
                                placeholder="+1 (555) 123-4567"
                                {...register('phone')}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Calendar size={16} />
                                Date of Birth (Optional)
                            </label>
                            <input
                                type="date"
                                className={`form-input ${errors.date_of_birth ? 'error' : ''}`}
                                {...register('date_of_birth')}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <div className="role-selection">
                                {roleOptions.map((role) => (
                                    <label key={role.value} className="role-option">
                                        <input
                                            type="radio"
                                            value={role.value}
                                            {...register('role', { required: 'Please select a role' })}
                                        />
                                        <div className="role-icon">{role.icon}</div>
                                        <div className="role-name">{role.label}</div>
                                        <div className="role-description">{role.description}</div>
                                    </label>
                                ))}
                            </div>
                            {errors.role && (
                                <span className="form-error">{errors.role.message}</span>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    <Lock size={16} />
                                    Password
                                </label>
                                <div className="password-input-container">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className={`form-input ${errors.password ? 'error' : ''}`}
                                        placeholder="Create password"
                                        {...register('password', {
                                            required: 'Password is required',
                                            minLength: {
                                                value: 8,
                                                message: 'Password must be at least 8 characters'
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

                            <div className="form-group">
                                <label className="form-label">
                                    <Lock size={16} />
                                    Confirm Password
                                </label>
                                <div className="password-input-container">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                                        placeholder="Confirm password"
                                        {...register('confirmPassword', {
                                            required: 'Please confirm your password',
                                            validate: value => value === password || 'Passwords do not match'
                                        })}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <span className="form-error">{errors.confirmPassword.message}</span>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="loading-spinner"></div>
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login" className="auth-link">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Features */}
                <div className="auth-features">
                    <h3>Why Choose HealthSurvey?</h3>
                    <div className="features-list">
                        <div className="feature-item">
                            <div className="feature-icon">🏥</div>
                            <div>
                                <h4>Healthcare Focused</h4>
                                <p>Designed specifically for healthcare environments</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">📱</div>
                            <div>
                                <h4>Mobile Friendly</h4>
                                <p>Complete surveys on any device, anywhere</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">📊</div>
                            <div>
                                <h4>Rich Analytics</h4>
                                <p>Comprehensive insights and data visualization</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;