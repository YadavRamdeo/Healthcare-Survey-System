import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    Search,
    Filter,
    Eye,
    Download,
    Clock,
    CheckCircle,
    User,
    Calendar,
    FileText,
    MessageSquare,
    BarChart3,
    ExternalLink,
    Trash2
} from 'lucide-react';
import { responsesAPI, surveysAPI } from '../../services/api';
import { useAuth } from '../../App';
import toast from 'react-hot-toast';
import './PatientResponses.css';

const PatientResponses = () => {
    const [responses, setResponses] = useState([]);
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [surveyFilter, setSurveyFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();

    useEffect(() => {
        fetchData();
        // Set filters from URL params
        setSurveyFilter(searchParams.get('survey') || '');
        setStatusFilter(searchParams.get('status') || '');
        setSearchTerm(searchParams.get('search') || '');
    }, [searchParams]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch responses based on user role
            const params = {};
            if (searchParams.get('survey')) params.survey = searchParams.get('survey');
            if (searchParams.get('status')) params.status = searchParams.get('status');
            if (searchParams.get('search')) params.search = searchParams.get('search');
            if (searchParams.get('me') === 'true') params.respondent = user?.id;

            const [responsesRes, surveysRes] = await Promise.all([
                responsesAPI.list(null, params),
                surveysAPI.list()
            ]);

            setResponses(responsesRes.data.results || responsesRes.data);
            setSurveys(surveysRes.data.results || surveysRes.data);
        } catch (error) {
            toast.error('Failed to fetch responses');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        updateURLParams({ search: value });
    };

    const handleSurveyFilter = (value) => {
        setSurveyFilter(value);
        updateURLParams({ survey: value });
    };

    const handleStatusFilter = (value) => {
        setStatusFilter(value);
        updateURLParams({ status: value });
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

    const viewResponseDetails = async (responseId) => {
        try {
            const response = await responsesAPI.get(responseId);
            setSelectedResponse(response.data);
            setShowDetailModal(true);
        } catch (error) {
            toast.error('Failed to fetch response details');
        }
    };

    const exportResponses = () => {
        // In a real app, this would trigger a CSV/Excel export
        toast.success('Export functionality would be implemented here');
    };

    const deleteResponse = async (responseId) => {
        if (!window.confirm('Are you sure you want to delete this response?')) {
            return;
        }

        try {
            await responsesAPI.delete(responseId);
            setResponses(responses.filter(r => r.id !== responseId));
            toast.success('Response deleted successfully');
        } catch (error) {
            toast.error('Failed to delete response');
        }
    };

    const getStatusBadge = (response) => {
        if (response.is_complete) {
            return <span className="badge badge-success">Completed</span>;
        }
        return <span className="badge badge-warning">In Progress</span>;
    };

    const formatDuration = (minutes) => {
        if (!minutes) return 'N/A';
        if (minutes < 1) return '< 1 min';
        return `${Math.round(minutes)} min`;
    };

    const canViewResponse = (response) => {
        return user?.role === 'admin' ||
            response.respondent?.id === user?.id ||
            responses.some(r => r.survey?.created_by?.id === user?.id);
    };

    const canDeleteResponse = (response) => {
        return user?.role === 'admin' || response.respondent?.id === user?.id;
    };

    const filteredResponses = responses.filter(response => {
        const matchesSearch = response.survey_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            response.respondent?.username?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSurvey = !surveyFilter || response.survey?.toString() === surveyFilter;
        const matchesStatus = !statusFilter ||
            (statusFilter === 'completed' && response.is_complete) ||
            (statusFilter === 'in_progress' && !response.is_complete);

        return matchesSearch && matchesSurvey && matchesStatus;
    });

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading responses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Survey Responses</h1>
                    <p className="page-subtitle">
                        {user?.role === 'patient'
                            ? 'View and manage your survey responses'
                            : 'Monitor and analyze survey responses from participants'
                        }
                    </p>
                </div>
                <div className="page-actions">
                    <button
                        onClick={exportResponses}
                        className="btn btn-outline"
                    >
                        <Download size={20} />
                        Export Data
                    </button>
                    {user?.role !== 'patient' && (
                        <Link to="/analytics" className="btn btn-primary">
                            <BarChart3 size={20} />
                            View Analytics
                        </Link>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="search-bar">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search responses..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filters">
                    <select
                        value={surveyFilter}
                        onChange={(e) => handleSurveyFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Surveys</option>
                        {surveys.map(survey => (
                            <option key={survey.id} value={survey.id}>
                                {survey.title}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => handleStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="in_progress">In Progress</option>
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-info">
                            <h3 className="stat-title">Total Responses</h3>
                            <p className="stat-value">{responses.length}</p>
                        </div>
                        <div className="stat-icon stat-icon-blue">
                            <MessageSquare size={24} />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-info">
                            <h3 className="stat-title">Completed</h3>
                            <p className="stat-value">
                                {responses.filter(r => r.is_complete).length}
                            </p>
                        </div>
                        <div className="stat-icon stat-icon-green">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-info">
                            <h3 className="stat-title">In Progress</h3>
                            <p className="stat-value">
                                {responses.filter(r => !r.is_complete).length}
                            </p>
                        </div>
                        <div className="stat-icon stat-icon-warning">
                            <Clock size={24} />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-info">
                            <h3 className="stat-title">Avg. Completion Time</h3>
                            <p className="stat-value">
                                {formatDuration(
                                    responses
                                        .filter(r => r.completion_time)
                                        .reduce((acc, r) => acc + r.completion_time, 0) /
                                    responses.filter(r => r.completion_time).length
                                )}
                            </p>
                        </div>
                        <div className="stat-icon stat-icon-purple">
                            <BarChart3 size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Responses Table */}
            <div className="responses-section">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Survey</th>
                                <th>Respondent</th>
                                <th>Status</th>
                                <th>Started</th>
                                <th>Completed</th>
                                <th>Duration</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResponses.map((response) => (
                                <tr key={response.id}>
                                    <td>
                                        <div className="survey-info">
                                            <FileText size={16} className="survey-icon" />
                                            <span className="survey-title">{response.survey_title}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="respondent-info">
                                            {response.respondent ? (
                                                <>
                                                    <User size={16} />
                                                    <span>{response.respondent.full_name || response.respondent.username}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <User size={16} />
                                                    <span className="anonymous">Anonymous</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td>{getStatusBadge(response)}</td>
                                    <td>
                                        <div className="date-info">
                                            <Calendar size={14} />
                                            <span>{new Date(response.started_at).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="date-info">
                                            {response.completed_at ? (
                                                <>
                                                    <Calendar size={14} />
                                                    <span>{new Date(response.completed_at).toLocaleDateString()}</span>
                                                </>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="duration-info">
                                            <Clock size={14} />
                                            <span>{formatDuration(response.completion_time)}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="actions">
                                            {canViewResponse(response) && (
                                                <button
                                                    onClick={() => viewResponseDetails(response.id)}
                                                    className="btn-icon btn-outline"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}

                                            {user?.role !== 'patient' && (
                                                <Link
                                                    to={`/analytics?response=${response.id}`}
                                                    className="btn-icon btn-outline"
                                                    title="View Analytics"
                                                >
                                                    <BarChart3 size={16} />
                                                </Link>
                                            )}

                                            {canDeleteResponse(response) && (
                                                <button
                                                    onClick={() => deleteResponse(response.id)}
                                                    className="btn-icon btn-danger"
                                                    title="Delete Response"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredResponses.length === 0 && (
                        <div className="empty-state">
                            <MessageSquare size={48} className="empty-icon" />
                            <h3>No responses found</h3>
                            <p>
                                {searchTerm || surveyFilter || statusFilter
                                    ? 'Try adjusting your filters to see more responses.'
                                    : user?.role === 'patient'
                                        ? 'You haven\'t completed any surveys yet.'
                                        : 'No survey responses have been submitted yet.'
                                }
                            </p>
                            {user?.role === 'patient' && !searchTerm && !surveyFilter && !statusFilter && (
                                <Link to="/surveys" className="btn btn-primary">
                                    <ExternalLink size={20} />
                                    Browse Available Surveys
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Response Detail Modal */}
            {showDetailModal && selectedResponse && (
                <div className="modal-overlay">
                    <div className="modal-content response-modal">
                        <div className="modal-header">
                            <h3 className="modal-title">Response Details</h3>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedResponse(null);
                                }}
                                className="btn-icon"
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="response-summary">
                                <div className="summary-item">
                                    <strong>Survey:</strong> {selectedResponse.survey_title}
                                </div>
                                <div className="summary-item">
                                    <strong>Respondent:</strong>
                                    {selectedResponse.respondent
                                        ? selectedResponse.respondent.full_name || selectedResponse.respondent.username
                                        : 'Anonymous'
                                    }
                                </div>
                                <div className="summary-item">
                                    <strong>Status:</strong> {getStatusBadge(selectedResponse)}
                                </div>
                                <div className="summary-item">
                                    <strong>Started:</strong> {new Date(selectedResponse.started_at).toLocaleString()}
                                </div>
                                {selectedResponse.completed_at && (
                                    <div className="summary-item">
                                        <strong>Completed:</strong> {new Date(selectedResponse.completed_at).toLocaleString()}
                                    </div>
                                )}
                                {selectedResponse.completion_time && (
                                    <div className="summary-item">
                                        <strong>Duration:</strong> {formatDuration(selectedResponse.completion_time)}
                                    </div>
                                )}
                            </div>

                            <div className="response-answers">
                                <h4>Responses</h4>
                                {selectedResponse.answers && selectedResponse.answers.length > 0 ? (
                                    <div className="answers-list">
                                        {selectedResponse.answers.map((answer, index) => (
                                            <div key={answer.id || index} className="answer-item">
                                                <div className="question-text">
                                                    <span className="question-number">Q{index + 1}:</span>
                                                    {answer.question_text}
                                                </div>
                                                <div className="answer-content">
                                                    {answer.text_answer && (
                                                        <div className="answer-value">{answer.text_answer}</div>
                                                    )}
                                                    {answer.number_answer !== null && answer.number_answer !== undefined && (
                                                        <div className="answer-value">{answer.number_answer}</div>
                                                    )}
                                                    {answer.date_answer && (
                                                        <div className="answer-value">{new Date(answer.date_answer).toLocaleDateString()}</div>
                                                    )}
                                                    {answer.boolean_answer !== null && answer.boolean_answer !== undefined && (
                                                        <div className="answer-value">{answer.boolean_answer ? 'Yes' : 'No'}</div>
                                                    )}
                                                    {answer.json_answer && (
                                                        <div className="answer-value">
                                                            {Array.isArray(answer.json_answer)
                                                                ? answer.json_answer.join(', ')
                                                                : JSON.stringify(answer.json_answer)
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-answers">No responses recorded yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedResponse(null);
                                }}
                                className="btn btn-outline"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientResponses;