import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    User,
    Mail,
    Phone,
    Lock,
    Bell,
    Shield,
    Palette,
    Globe,
    Save,
    Eye,
    EyeOff,
    Check,
    AlertCircle,
    Camera,
    Calendar
} from 'lucide-react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../App';
import toast from 'react-hot-toast';
import './Settings.css';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const { user, login } = useAuth();

    const profileForm = useForm({
        defaultValues: {
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            date_of_birth: user?.date_of_birth || '',
            address: user?.address || '',
            department: user?.department || '',
            specialization: user?.specialization || ''
        }
    });

    const passwordForm = useForm();
    const notificationForm = useForm({
        defaultValues: {
            email_notifications: true,
            push_notifications: true,
            survey_reminders: true,
            weekly_digest: false,
            marketing_emails: false
        }
    });

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'preferences', label: 'Preferences', icon: Palette }
    ];

    const handleProfileUpdate = async (data) => {
        try {
            setSaving(true);
            const response = await authAPI.updateProfile(data);
            login({ ...user, ...response.data }, localStorage.getItem('token'));
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (data) => {
        try {
            setSaving(true);
            await authAPI.changePassword(data);
            toast.success('Password changed successfully');
            passwordForm.reset();
        } catch (error) {
            const errorMessage = error.response?.data?.current_password?.[0] ||
                error.response?.data?.new_password?.[0] ||
                'Failed to change password';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleNotificationUpdate = (data) => {
        // In a real app, this would save to backend
        toast.success('Notification preferences updated');
    };

    const handlePreferencesUpdate = (data) => {
        // In a real app, this would save to backend
        toast.success('Preferences updated');
    };

    const getRoleDisplayName = (role) => {
        const roleNames = {
            'admin': 'Administrator',
            'healthcare_provider': 'Healthcare Provider',
            'patient': 'Patient',
            'researcher': 'Researcher'
        };
        return roleNames[role] || role;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">
                        Manage your account settings and preferences
                    </p>
                </div>
            </div>

            <div className="settings-layout">
                {/* Settings Navigation */}
                <div className="settings-sidebar">
                    <nav className="settings-nav">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                                >
                                    <Icon size={20} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Settings Content */}
                <div className="settings-content">
                    {/* Profile Settings */}
                    {activeTab === 'profile' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h2 className="section-title">Profile Information</h2>
                                <p className="section-subtitle">
                                    Update your personal information and profile details
                                </p>
                            </div>

                            <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="settings-form">
                                {/* Profile Picture */}
                                <div className="profile-picture-section">
                                    <div className="profile-picture">
                                        <div className="profile-avatar">
                                            {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                                        </div>
                                        <button type="button" className="change-picture-btn">
                                            <Camera size={16} />
                                            Change Picture
                                        </button>
                                    </div>
                                    <div className="profile-info">
                                        <h3>{user?.first_name && user?.last_name
                                            ? `${user.first_name} ${user.last_name}`
                                            : user?.username
                                        }</h3>
                                        <p className="role-badge">{getRoleDisplayName(user?.role)}</p>
                                        <p className="join-date">
                                            <Calendar size={14} />
                                            Joined {new Date(user?.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">
                                            <User size={16} />
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            {...profileForm.register('first_name', { required: 'First name is required' })}
                                        />
                                        {profileForm.formState.errors.first_name && (
                                            <span className="form-error">{profileForm.formState.errors.first_name.message}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            <User size={16} />
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            {...profileForm.register('last_name', { required: 'Last name is required' })}
                                        />
                                        {profileForm.formState.errors.last_name && (
                                            <span className="form-error">{profileForm.formState.errors.last_name.message}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            <Mail size={16} />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            {...profileForm.register('email', {
                                                required: 'Email is required',
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: 'Invalid email address'
                                                }
                                            })}
                                        />
                                        {profileForm.formState.errors.email && (
                                            <span className="form-error">{profileForm.formState.errors.email.message}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            <Phone size={16} />
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            placeholder="+1 (555) 123-4567"
                                            {...profileForm.register('phone')}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            <Calendar size={16} />
                                            Date of Birth
                                        </label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            {...profileForm.register('date_of_birth')}
                                        />
                                    </div>

                                    {user?.role === 'healthcare_provider' && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label">Department</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="e.g., Cardiology"
                                                    {...profileForm.register('department')}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Specialization</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="e.g., Interventional Cardiology"
                                                    {...profileForm.register('specialization')}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="form-group full-width">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        rows={3}
                                        placeholder="Your address"
                                        {...profileForm.register('address')}
                                    />
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="btn btn-primary"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="loading-spinner"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Security Settings */}
                    {activeTab === 'security' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h2 className="section-title">Security Settings</h2>
                                <p className="section-subtitle">
                                    Manage your password and security preferences
                                </p>
                            </div>

                            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="settings-form">
                                <div className="security-info">
                                    <div className="security-item">
                                        <div className="security-icon">
                                            <Shield size={24} className="text-green-500" />
                                        </div>
                                        <div className="security-details">
                                            <h4>Account Security</h4>
                                            <p>Your account is secured with strong authentication</p>
                                        </div>
                                        <div className="security-status">
                                            <Check size={16} className="text-green-500" />
                                            <span className="text-green-500">Secure</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="password-section">
                                    <h3>Change Password</h3>

                                    <div className="form-group">
                                        <label className="form-label">
                                            <Lock size={16} />
                                            Current Password
                                        </label>
                                        <div className="password-input-container">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                className="form-input"
                                                {...passwordForm.register('current_password', { required: 'Current password is required' })}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            >
                                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {passwordForm.formState.errors.current_password && (
                                            <span className="form-error">{passwordForm.formState.errors.current_password.message}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            <Lock size={16} />
                                            New Password
                                        </label>
                                        <div className="password-input-container">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                className="form-input"
                                                {...passwordForm.register('new_password', {
                                                    required: 'New password is required',
                                                    minLength: {
                                                        value: 8,
                                                        message: 'Password must be at least 8 characters'
                                                    }
                                                })}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {passwordForm.formState.errors.new_password && (
                                            <span className="form-error">{passwordForm.formState.errors.new_password.message}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            <Lock size={16} />
                                            Confirm New Password
                                        </label>
                                        <div className="password-input-container">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                className="form-input"
                                                {...passwordForm.register('confirm_password', {
                                                    required: 'Please confirm your password',
                                                    validate: value =>
                                                        value === passwordForm.watch('new_password') || 'Passwords do not match'
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
                                        {passwordForm.formState.errors.confirm_password && (
                                            <span className="form-error">{passwordForm.formState.errors.confirm_password.message}</span>
                                        )}
                                    </div>

                                    <div className="password-requirements">
                                        <h4>Password Requirements:</h4>
                                        <ul>
                                            <li>At least 8 characters long</li>
                                            <li>Contains uppercase and lowercase letters</li>
                                            <li>Contains at least one number</li>
                                            <li>Contains at least one special character</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="btn btn-primary"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="loading-spinner"></div>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Lock size={16} />
                                                Update Password
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Notification Settings */}
                    {activeTab === 'notifications' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h2 className="section-title">Notification Preferences</h2>
                                <p className="section-subtitle">
                                    Choose how you want to be notified about surveys and updates
                                </p>
                            </div>

                            <form onSubmit={notificationForm.handleSubmit(handleNotificationUpdate)} className="settings-form">
                                <div className="notification-groups">
                                    <div className="notification-group">
                                        <h3>Email Notifications</h3>
                                        <div className="notification-options">
                                            <label className="notification-item">
                                                <input
                                                    type="checkbox"
                                                    {...notificationForm.register('email_notifications')}
                                                />
                                                <div className="notification-info">
                                                    <span className="notification-title">Email Notifications</span>
                                                    <span className="notification-description">
                                                        Receive email notifications for important updates
                                                    </span>
                                                </div>
                                            </label>

                                            <label className="notification-item">
                                                <input
                                                    type="checkbox"
                                                    {...notificationForm.register('survey_reminders')}
                                                />
                                                <div className="notification-info">
                                                    <span className="notification-title">Survey Reminders</span>
                                                    <span className="notification-description">
                                                        Get reminded about pending surveys
                                                    </span>
                                                </div>
                                            </label>

                                            <label className="notification-item">
                                                <input
                                                    type="checkbox"
                                                    {...notificationForm.register('weekly_digest')}
                                                />
                                                <div className="notification-info">
                                                    <span className="notification-title">Weekly Digest</span>
                                                    <span className="notification-description">
                                                        Receive a weekly summary of survey activities
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="notification-group">
                                        <h3>Push Notifications</h3>
                                        <div className="notification-options">
                                            <label className="notification-item">
                                                <input
                                                    type="checkbox"
                                                    {...notificationForm.register('push_notifications')}
                                                />
                                                <div className="notification-info">
                                                    <span className="notification-title">Push Notifications</span>
                                                    <span className="notification-description">
                                                        Receive push notifications on your device
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="notification-group">
                                        <h3>Marketing</h3>
                                        <div className="notification-options">
                                            <label className="notification-item">
                                                <input
                                                    type="checkbox"
                                                    {...notificationForm.register('marketing_emails')}
                                                />
                                                <div className="notification-info">
                                                    <span className="notification-title">Marketing Emails</span>
                                                    <span className="notification-description">
                                                        Receive emails about new features and updates
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn btn-primary">
                                        <Bell size={16} />
                                        Save Preferences
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Preferences Settings */}
                    {activeTab === 'preferences' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h2 className="section-title">Application Preferences</h2>
                                <p className="section-subtitle">
                                    Customize your application experience
                                </p>
                            </div>

                            <div className="settings-form">
                                <div className="preference-groups">
                                    <div className="preference-group">
                                        <h3>
                                            <Palette size={20} />
                                            Appearance
                                        </h3>
                                        <div className="preference-options">
                                            <div className="preference-item">
                                                <label className="preference-label">Theme</label>
                                                <select className="form-input form-select">
                                                    <option value="light">Light</option>
                                                    <option value="dark">Dark</option>
                                                    <option value="system">System</option>
                                                </select>
                                            </div>

                                            <div className="preference-item">
                                                <label className="preference-label">Color Scheme</label>
                                                <div className="color-options">
                                                    <button type="button" className="color-option active" data-color="blue">
                                                        <div className="color-preview" style={{ backgroundColor: '#3b82f6' }}></div>
                                                        <span>Blue</span>
                                                    </button>
                                                    <button type="button" className="color-option" data-color="green">
                                                        <div className="color-preview" style={{ backgroundColor: '#10b981' }}></div>
                                                        <span>Green</span>
                                                    </button>
                                                    <button type="button" className="color-option" data-color="purple">
                                                        <div className="color-preview" style={{ backgroundColor: '#8b5cf6' }}></div>
                                                        <span>Purple</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="preference-group">
                                        <h3>
                                            <Globe size={20} />
                                            Language & Region
                                        </h3>
                                        <div className="preference-options">
                                            <div className="preference-item">
                                                <label className="preference-label">Language</label>
                                                <select className="form-input form-select">
                                                    <option value="en">English</option>
                                                    <option value="es">Spanish</option>
                                                    <option value="fr">French</option>
                                                    <option value="de">German</option>
                                                </select>
                                            </div>

                                            <div className="preference-item">
                                                <label className="preference-label">Date Format</label>
                                                <select className="form-input form-select">
                                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                                </select>
                                            </div>

                                            <div className="preference-item">
                                                <label className="preference-label">Time Zone</label>
                                                <select className="form-input form-select">
                                                    <option value="UTC">UTC</option>
                                                    <option value="EST">Eastern Time</option>
                                                    <option value="PST">Pacific Time</option>
                                                    <option value="GMT">Greenwich Mean Time</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="preference-group">
                                        <h3>Data & Privacy</h3>
                                        <div className="preference-options">
                                            <label className="notification-item">
                                                <input type="checkbox" defaultChecked />
                                                <div className="notification-info">
                                                    <span className="notification-title">Analytics</span>
                                                    <span className="notification-description">
                                                        Help improve the app by sharing anonymous usage data
                                                    </span>
                                                </div>
                                            </label>

                                            <label className="notification-item">
                                                <input type="checkbox" />
                                                <div className="notification-info">
                                                    <span className="notification-title">Data Export</span>
                                                    <span className="notification-description">
                                                        Allow automatic data export for backup purposes
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        onClick={() => handlePreferencesUpdate({})}
                                        className="btn btn-primary"
                                    >
                                        <Save size={16} />
                                        Save Preferences
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;