import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    Users,
    BarChart3,
    MessageSquare,
    Settings,
    LogOut,
    Plus,
    Activity
} from 'lucide-react';
import { useAuth } from '../../App';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './Sidebar.css';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await authAPI.logout();
            logout();
            toast.success('Logged out successfully');
            navigate('/login');
        } catch (error) {
            logout();
            navigate('/login');
        }
    };

    const menuItems = [
        {
            name: 'Dashboard',
            icon: LayoutDashboard,
            path: '/dashboard',
            roles: ['admin', 'healthcare_provider', 'patient', 'researcher']
        },
        {
            name: 'Surveys',
            icon: FileText,
            path: '/surveys',
            roles: ['admin', 'healthcare_provider', 'patient', 'researcher']
        },
        {
            name: 'Create Survey',
            icon: Plus,
            path: '/surveys/create',
            roles: ['admin', 'healthcare_provider', 'researcher']
        },
        {
            name: 'Responses',
            icon: MessageSquare,
            path: '/responses',
            roles: ['admin', 'healthcare_provider', 'patient', 'researcher']
        },
        {
            name: 'Analytics',
            icon: BarChart3,
            path: '/analytics',
            roles: ['admin', 'healthcare_provider', 'researcher']
        },
        {
            name: 'User Management',
            icon: Users,
            path: '/users',
            roles: ['admin']
        },
        {
            name: 'Settings',
            icon: Settings,
            path: '/settings',
            roles: ['admin', 'healthcare_provider', 'patient', 'researcher']
        }
    ];

    const filteredMenuItems = menuItems.filter(item =>
        item.roles.includes(user?.role)
    );

    const getRoleDisplayName = (role) => {
        const roleNames = {
            'admin': 'Administrator',
            'healthcare_provider': 'Healthcare Provider',
            'patient': 'Patient',
            'researcher': 'Researcher'
        };
        return roleNames[role] || role;
    };

    const getRoleBadgeClass = (role) => {
        const roleClasses = {
            'admin': 'role-badge-admin',
            'healthcare_provider': 'role-badge-provider',
            'patient': 'role-badge-patient',
            'researcher': 'role-badge-researcher'
        };
        return roleClasses[role] || 'role-badge-default';
    };

    return (
        <aside className="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <Activity className="brand-icon" />
                    <span className="brand-text">HealthSurvey</span>
                </div>
            </div>

            {/* User Info */}
            <div className="sidebar-user">
                <div className="user-avatar">
                    {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                </div>
                <div className="user-info">
                    <div className="user-name">
                        {user?.first_name && user?.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user?.username
                        }
                    </div>
                    <div className={`role-badge ${getRoleBadgeClass(user?.role)}`}>
                        {getRoleDisplayName(user?.role)}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {filteredMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                        (item.path === '/surveys' && location.pathname.startsWith('/surveys'));

                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                        >
                            <Icon size={20} className="nav-icon" />
                            <span className="nav-text">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <button
                    className="logout-btn"
                    onClick={handleLogout}
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;