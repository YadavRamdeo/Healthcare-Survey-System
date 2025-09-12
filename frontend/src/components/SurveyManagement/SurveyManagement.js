import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Copy,
    Trash2,
    Users,
    Clock,
    BarChart3,
    FileText,
    Calendar,
    MoreVertical
} from 'lucide-react';
import { surveysAPI } from '../../services/api';
import { useAuth } from '../../App';
import toast from 'react-hot-toast';
import './SurveyManagement.css';

const SurveyManagement = () => {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [surveyToDelete, setSurveyToDelete] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();

    useEffect(() => {
        fetchSurveys();
        // Set filters from URL params
        setStatusFilter(searchParams.get('status') || '');
        setCategoryFilter(searchParams.get('category') || '');
        setSearchTerm(searchParams.get('search') || '');
    }, [searchParams]);

    const fetchSurveys = async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchParams.get('status')) params.status = searchParams.get('status');
            if (searchParams.get('category')) params.category = searchParams.get('category');
            if (searchParams.get('search')) params.search = searchParams.get('search');

            const response = await surveysAPI.list(params);
            setSurveys(response.data.results || response.data);
        } catch (error) {
            toast.error('Failed to fetch surveys');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        updateURLParams({ search: value });
    };

    const handleStatusFilter = (value) => {
        setStatusFilter(value);
        updateURLParams({ status: value });
    };

    const handleCategoryFilter = (value) => {
        setCategoryFilter(value);
        updateURLParams({ category: value });
    };

    const updateURLParams = (newParams) => {
        const params = new URLSearchParams(searchParams);
        Object.entries(newParams).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });
        setSearchParams(params);
    };

    const handleDuplicate = async (surveyId) => {
        try {
            await surveysAPI.duplicate(surveyId);
            toast.success('Survey duplicated successfully');
            fetchSurveys();
        } catch (error) {
            toast.error('Failed to duplicate survey');
        }
    };

    const handleDelete = async () => {
        if (!surveyToDelete) return;

        try {
            await surveysAPI.delete(surveyToDelete.id);
            toast.success('Survey deleted successfully');
            setSurveys(surveys.filter(s => s.id !== surveyToDelete.id));
            setShowDeleteModal(false);
            setSurveyToDelete(null);
        } catch (error) {
            toast.error('Failed to delete survey');
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'draft': 'badge-gray',
            'active': 'badge-success',
            'inactive': 'badge-warning',
            'archived': 'badge-danger'
        };
        return `badge ${statusClasses[status] || 'badge-gray'}`;
    };

    const getCategoryIcon = (category) => {
        const icons = {
            'general': '🏥',
            'mental_health': '🧠',
            'chronic_care': '💊',
            'preventive': '🛡️',
            'post_treatment': '🔄',
            'satisfaction': '⭐',
            'research': '🔬'
        };
        return icons[category] || '📋';
    };

    const canEditSurvey = (survey) => {
        return user?.role === 'admin' || survey.created_by?.id === user?.id;
    };

    const filteredSurveys = surveys.filter(survey => {
        const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            survey.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || survey.status === statusFilter;
        const matchesCategory = !categoryFilter || survey.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading surveys...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Survey Management</h1>
                    <p className="page-subtitle">
                        Create, manage, and analyze your healthcare surveys
                    </p>
                </div>
                {(user?.role !== 'patient') && (
                    <div className="page-actions">
                        <Link to="/surveys/create" className="btn btn-primary">
                            <Plus size={20} />
                            Create Survey
                        </Link>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="search-bar">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search surveys..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filters">
                    <select
                        value={statusFilter}
                        onChange={(e) => handleStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="archived">Archived</option>
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) => handleCategoryFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Categories</option>
                        <option value="general">General Health</option>
                        <option value="mental_health">Mental Health</option>
                        <option value="chronic_care">Chronic Care</option>
                        <option value="preventive">Preventive Care</option>
                        <option value="post_treatment">Post Treatment</option>
                        <option value="satisfaction">Patient Satisfaction</option>
                        <option value="research">Research</option>
                    </select>
                </div>
            </div>

            {/* Survey Grid */}
            <div className="surveys-grid">
                {filteredSurveys.map((survey) => (
                    <div key={survey.id} className="survey-card">
                        <div className="survey-header">
                            <div className="survey-category">
                                <span className="category-icon">{getCategoryIcon(survey.category)}</span>
                                <span className="category-name">
                                    {survey.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                            </div>
                            <div className="survey-actions">
                                <div className="dropdown">
                                    <button className="dropdown-trigger">
                                        <MoreVertical size={16} />
                                    </button>
                                    <div className="dropdown-menu">
                                        <Link to={`/surveys/${survey.id}`} className="dropdown-item">
                                            <Eye size={16} />
                                            View Details
                                        </Link>
                                        {canEditSurvey(survey) && (
                                            <Link to={`/surveys/${survey.id}/edit`} className="dropdown-item">
                                                <Edit size={16} />
                                                Edit Survey
                                            </Link>
                                        )}
                                        {canEditSurvey(survey) && (
                                            <button
                                                onClick={() => handleDuplicate(survey.id)}
                                                className="dropdown-item"
                                            >
                                                <Copy size={16} />
                                                Duplicate
                                            </button>
                                        )}
                                        <Link to={`/analytics?survey=${survey.id}`} className="dropdown-item">
                                            <BarChart3 size={16} />
                                            View Analytics
                                        </Link>
                                        {canEditSurvey(survey) && (
                                            <button
                                                onClick={() => {
                                                    setSurveyToDelete(survey);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="dropdown-item danger"
                                            >
                                                <Trash2 size={16} />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="survey-content">
                            <h3 className="survey-title">{survey.title}</h3>
                            <p className="survey-description">{survey.description}</p>

                            <div className="survey-meta">
                                <div className="meta-item">
                                    <FileText size={16} />
                                    <span>{survey.total_questions} questions</span>
                                </div>
                                <div className="meta-item">
                                    <Users size={16} />
                                    <span>{survey.total_responses} responses</span>
                                </div>
                                <div className="meta-item">
                                    <Clock size={16} />
                                    <span>{survey.estimated_duration} min</span>
                                </div>
                            </div>
                        </div>

                        <div className="survey-footer">
                            <div className="survey-status">
                                <span className={getStatusBadge(survey.status)}>
                                    {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                                </span>
                            </div>
                            <div className="survey-date">
                                <Calendar size={14} />
                                <span>{new Date(survey.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredSurveys.length === 0 && (
                <div className="empty-state">
                    <FileText size={48} className="empty-icon" />
                    <h3>No surveys found</h3>
                    <p>
                        {searchTerm || statusFilter || categoryFilter
                            ? 'Try adjusting your filters to see more surveys.'
                            : 'Get started by creating your first survey.'
                        }
                    </p>
                    {(user?.role !== 'patient') && !searchTerm && !statusFilter && !categoryFilter && (
                        <Link to="/surveys/create" className="btn btn-primary">
                            <Plus size={20} />
                            Create Your First Survey
                        </Link>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Delete Survey</h3>
                        </div>
                        <div className="modal-body">
                            <p>
                                Are you sure you want to delete "{surveyToDelete?.title}"?
                                This action cannot be undone and will permanently delete all associated responses.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSurveyToDelete(null);
                                }}
                                className="btn btn-outline"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="btn btn-danger"
                            >
                                <Trash2 size={16} />
                                Delete Survey
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SurveyManagement;