import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    User,
    Mail,
    Phone,
    Calendar,
    Shield,
    UserPlus,
    Eye,
    EyeOff,
    MoreVertical,
    Download
} from 'lucide-react';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../App';
import toast from 'react-hot-toast';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [stats, setStats] = useState({});
    const { user: currentUser } = useAuth();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors }
    } = useForm();

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = {};
            if (roleFilter) params.role = roleFilter;
            if (searchTerm) params.search = searchTerm;

            const response = await usersAPI.list(params);
            setUsers(response.data.results || response.data);
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await usersAPI.stats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch user stats');
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        // Debounce the search
        setTimeout(() => {
            fetchUsers();
        }, 300);
    };

    const handleRoleFilter = (value) => {
        setRoleFilter(value);
        fetchUsers();
    };

    const handleCreateUser = async (data) => {
        try {
            await usersAPI.create(data);
            toast.success('User created successfully');
            setShowCreateModal(false);
            reset();
            fetchUsers();
            fetchStats();
        } catch (error) {
            const errorMessage = error.response?.data?.username?.[0] ||
                error.response?.data?.email?.[0] ||
                'Failed to create user';
            toast.error(errorMessage);
        }
    };

    const handleEditUser = async (data) => {
        try {
            await usersAPI.update(selectedUser.id, data);
            toast.success('User updated successfully');
            setShowEditModal(false);
            setSelectedUser(null);
            reset();
            fetchUsers();
        } catch (error) {
            toast.error('Failed to update user');
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            await usersAPI.delete(selectedUser.id);
            toast.success('User deleted successfully');
            setUsers(users.filter(u => u.id !== selectedUser.id));
            setShowDeleteModal(false);
            setSelectedUser(null);
            fetchStats();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        reset({
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            phone: user.phone,
            department: user.department,
            specialization: user.specialization,
            is_active: user.is_active
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const exportUsers = () => {
        // In a real app, this would generate and download a CSV/Excel file
        toast.success('Export functionality would be implemented here');
    };

    const getRoleBadge = (role) => {
        const roleClasses = {
            'admin': 'badge-danger',
            'healthcare_provider': 'badge-success',
            'patient': 'badge-info',
            'researcher': 'badge-warning'
        };
        const roleNames = {
            'admin': 'Administrator',
            'healthcare_provider': 'Healthcare Provider',
            'patient': 'Patient',
            'researcher': 'Researcher'
        };

        return (
            <span className={`badge ${roleClasses[role] || 'badge-gray'}`}>
                {roleNames[role] || role}
            </span>
        );
    };

    const getStatusBadge = (isActive) => {
        return (
            <span className={`badge ${isActive ? 'badge-success' : 'badge-gray'}`}>
                {isActive ? 'Active' : 'Inactive'}
            </span>
        );
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = !roleFilter || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">
                        Manage system users, roles, and permissions
                    </p>
                </div>
                <div className="page-actions">
                    <button
                        onClick={exportUsers}
                        className="btn btn-outline"
                    >
                        <Download size={20} />
                        Export Users
                    </button>
                    <button
                        onClick={() => {
                            reset();
                            setShowCreateModal(true);
                        }}
                        className="btn btn-primary"
                    >
                        <Plus size={20} />
                        Add User
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-info">
                            <h3 className="stat-title">Total Users</h3>
                            <p className="stat-value">{stats.total_users || 0}</p>
                        </div>
                        <div className="stat-icon stat-icon-blue">
                            <User size={24} />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-info">
                            <h3 className="stat-title">Active Users</h3>
                            <p className="stat-value">{stats.active_users || 0}</p>
                        </div>
                        <div className="stat-icon stat-icon-green">
                            <Shield size={24} />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-info">
                            <h3 className="stat-title">Healthcare Providers</h3>
                            <p className="stat-value">{stats.users_by_role?.healthcare_provider || 0}</p>
                        </div>
                        <div className="stat-icon stat-icon-emerald">
                            <UserPlus size={24} />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-info">
                            <h3 className="stat-title">Patients</h3>
                            <p className="stat-value">{stats.users_by_role?.patient || 0}</p>
                        </div>
                        <div className="stat-icon stat-icon-purple">
                            <User size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="search-bar">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filters">
                    <select
                        value={roleFilter}
                        onChange={(e) => handleRoleFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Administrator</option>
                        <option value="healthcare_provider">Healthcare Provider</option>
                        <option value="patient">Patient</option>
                        <option value="researcher">Researcher</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="users-section">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-info">
                                            <div className="user-avatar">
                                                {user.first_name?.[0] || user.username?.[0] || 'U'}
                                            </div>
                                            <div className="user-details">
                                                <div className="user-name">
                                                    {user.first_name && user.last_name
                                                        ? `${user.first_name} ${user.last_name}`
                                                        : user.username
                                                    }
                                                </div>
                                                <div className="user-username">@{user.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{getRoleBadge(user.role)}</td>
                                    <td>
                                        <span className="department">
                                            {user.department || '-'}
                                        </span>
                                        {user.specialization && (
                                            <div className="specialization">
                                                {user.specialization}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="contact-info">
                                            <div className="contact-item">
                                                <Mail size={14} />
                                                <span>{user.email}</span>
                                            </div>
                                            {user.phone && (
                                                <div className="contact-item">
                                                    <Phone size={14} />
                                                    <span>{user.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>{getStatusBadge(user.is_active)}</td>
                                    <td>
                                        <div className="date-info">
                                            <Calendar size={14} />
                                            <span>{new Date(user.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="actions">
                                            <div className="dropdown">
                                                <button className="dropdown-trigger">
                                                    <MoreVertical size={16} />
                                                </button>
                                                <div className="dropdown-menu">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="dropdown-item"
                                                    >
                                                        <Edit size={16} />
                                                        Edit User
                                                    </button>
                                                    {user.id !== currentUser?.id && (
                                                        <button
                                                            onClick={() => openDeleteModal(user)}
                                                            className="dropdown-item danger"
                                                        >
                                                            <Trash2 size={16} />
                                                            Delete User
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && (
                        <div className="empty-state">
                            <User size={48} className="empty-icon" />
                            <h3>No users found</h3>
                            <p>
                                {searchTerm || roleFilter
                                    ? 'Try adjusting your filters to see more users.'
                                    : 'Start by adding your first user to the system.'
                                }
                            </p>
                            {!searchTerm && !roleFilter && (
                                <button
                                    onClick={() => {
                                        reset();
                                        setShowCreateModal(true);
                                    }}
                                    className="btn btn-primary"
                                >
                                    <Plus size={20} />
                                    Add First User
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Create New User</h3>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    reset();
                                }}
                                className="btn-close"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(handleCreateUser)}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">First Name*</label>
                                        <input
                                            type="text"
                                            className={`form-input ${errors.first_name ? 'error' : ''}`}
                                            placeholder="First name"
                                            {...register('first_name', { required: 'First name is required' })}
                                        />
                                        {errors.first_name && (
                                            <span className="form-error">{errors.first_name.message}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Last Name*</label>
                                        <input
                                            type="text"
                                            className={`form-input ${errors.last_name ? 'error' : ''}`}
                                            placeholder="Last name"
                                            {...register('last_name', { required: 'Last name is required' })}
                                        />
                                        {errors.last_name && (
                                            <span className="form-error">{errors.last_name.message}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Username*</label>
                                    <input
                                        type="text"
                                        className={`form-input ${errors.username ? 'error' : ''}`}
                                        placeholder="Username"
                                        {...register('username', { required: 'Username is required' })}
                                    />
                                    {errors.username && (
                                        <span className="form-error">{errors.username.message}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email*</label>
                                    <input
                                        type="email"
                                        className={`form-input ${errors.email ? 'error' : ''}`}
                                        placeholder="Email address"
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
                                    <label className="form-label">Password*</label>
                                    <div className="password-input-container">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className={`form-input ${errors.password ? 'error' : ''}`}
                                            placeholder="Password"
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
                                    <label className="form-label">Role*</label>
                                    <select
                                        className={`form-input form-select ${errors.role ? 'error' : ''}`}
                                        {...register('role', { required: 'Role is required' })}
                                    >
                                        <option value="">Select a role</option>
                                        <option value="admin">Administrator</option>
                                        <option value="healthcare_provider">Healthcare Provider</option>
                                        <option value="patient">Patient</option>
                                        <option value="researcher">Researcher</option>
                                    </select>
                                    {errors.role && (
                                        <span className="form-error">{errors.role.message}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="Phone number"
                                        {...register('phone')}
                                    />
                                </div>

                                {watch('role') === 'healthcare_provider' && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Department</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Department"
                                                {...register('department')}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Specialization</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Specialization"
                                                {...register('specialization')}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="form-group">
                                    <label className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            defaultChecked
                                            {...register('is_active')}
                                        />
                                        <span>Active User</span>
                                    </label>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        reset();
                                    }}
                                    className="btn btn-outline"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Plus size={16} />
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit User</h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedUser(null);
                                    reset();
                                }}
                                className="btn-close"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(handleEditUser)}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">First Name*</label>
                                        <input
                                            type="text"
                                            className={`form-input ${errors.first_name ? 'error' : ''}`}
                                            placeholder="First name"
                                            {...register('first_name', { required: 'First name is required' })}
                                        />
                                        {errors.first_name && (
                                            <span className="form-error">{errors.first_name.message}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Last Name*</label>
                                        <input
                                            type="text"
                                            className={`form-input ${errors.last_name ? 'error' : ''}`}
                                            placeholder="Last name"
                                            {...register('last_name', { required: 'Last name is required' })}
                                        />
                                        {errors.last_name && (
                                            <span className="form-error">{errors.last_name.message}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email*</label>
                                    <input
                                        type="email"
                                        className={`form-input ${errors.email ? 'error' : ''}`}
                                        placeholder="Email address"
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
                                    <label className="form-label">Role*</label>
                                    <select
                                        className={`form-input form-select ${errors.role ? 'error' : ''}`}
                                        {...register('role', { required: 'Role is required' })}
                                    >
                                        <option value="admin">Administrator</option>
                                        <option value="healthcare_provider">Healthcare Provider</option>
                                        <option value="patient">Patient</option>
                                        <option value="researcher">Researcher</option>
                                    </select>
                                    {errors.role && (
                                        <span className="form-error">{errors.role.message}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="Phone number"
                                        {...register('phone')}
                                    />
                                </div>

                                {watch('role') === 'healthcare_provider' && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Department</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Department"
                                                {...register('department')}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Specialization</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Specialization"
                                                {...register('specialization')}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="form-group">
                                    <label className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            {...register('is_active')}
                                        />
                                        <span>Active User</span>
                                    </label>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedUser(null);
                                        reset();
                                    }}
                                    className="btn btn-outline"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Edit size={16} />
                                    Update User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Delete User</h3>
                        </div>
                        <div className="modal-body">
                            <p>
                                Are you sure you want to delete the user "{selectedUser.first_name} {selectedUser.last_name}"?
                                This action cannot be undone and will permanently remove all associated data.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedUser(null);
                                }}
                                className="btn btn-outline"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                className="btn btn-danger"
                            >
                                <Trash2 size={16} />
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;