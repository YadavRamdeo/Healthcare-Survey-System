import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Users,
    Clock,
    CheckCircle,
    Download,
    Filter,
    Calendar,
    RefreshCw
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { surveysAPI } from '../../services/api';
import { useAuth } from '../../App';
import toast from 'react-hot-toast';
import './Analytics.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement);

const Analytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [surveys, setSurveys] = useState([]);
    const [selectedSurvey, setSelectedSurvey] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    useEffect(() => {
        fetchSurveys();
        const surveyParam = searchParams.get('survey');
        if (surveyParam) {
            setSelectedSurvey(surveyParam);
        }
    }, [searchParams]);

    useEffect(() => {
        if (selectedSurvey) {
            fetchAnalytics(selectedSurvey);
        }
    }, [selectedSurvey]);

    const fetchSurveys = async () => {
        try {
            const response = await surveysAPI.list();
            const surveyList = response.data.results || response.data;
            setSurveys(surveyList);

            // Auto-select first survey if none selected
            if (!selectedSurvey && surveyList.length > 0) {
                setSelectedSurvey(surveyList[0].id.toString());
            }
        } catch (error) {
            toast.error('Failed to fetch surveys');
        }
    };

    const fetchAnalytics = async (surveyId) => {
        try {
            setLoading(true);
            const response = await surveysAPI.analytics(surveyId);
            setAnalytics(response.data);
        } catch (error) {
            toast.error('Failed to fetch analytics data');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (!selectedSurvey) return;

        setRefreshing(true);
        try {
            await fetchAnalytics(selectedSurvey);
            toast.success('Analytics refreshed');
        } catch (error) {
            toast.error('Failed to refresh analytics');
        } finally {
            setRefreshing(false);
        }
    };

    const handleExport = () => {
        // In a real app, this would generate and download a report
        toast.success('Export functionality would be implemented here');
    };

    const getResponsesOverTimeData = () => {
        if (!analytics?.responses_by_date) return null;

        return {
            labels: analytics.responses_by_date.map(item =>
                new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            ),
            datasets: [{
                label: 'Daily Responses',
                data: analytics.responses_by_date.map(item => item.count),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };
    };

    const getCompletionRateData = () => {
        if (!analytics) return null;

        const completed = analytics.completed_responses;
        const total = analytics.total_responses;
        const incomplete = total - completed;

        return {
            labels: ['Completed', 'Incomplete'],
            datasets: [{
                data: [completed, incomplete],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(156, 163, 175, 0.8)'
                ],
                borderWidth: 0
            }]
        };
    };

    const getQuestionAnalyticsData = (question) => {
        if (question.question_type === 'radio' || question.question_type === 'dropdown') {
            return {
                labels: Object.keys(question.choice_distribution || {}),
                datasets: [{
                    data: Object.values(question.choice_distribution || {}),
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(168, 85, 247, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderWidth: 0
                }]
            };
        }

        if (question.question_type === 'rating') {
            return {
                labels: Object.keys(question.rating_distribution || {}),
                datasets: [{
                    label: 'Rating Distribution',
                    data: Object.values(question.rating_distribution || {}),
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            };
        }

        return null;
    };

    const getDemographicData = () => {
        if (!analytics?.demographic_breakdown?.by_role) return null;

        return {
            labels: Object.keys(analytics.demographic_breakdown.by_role).map(role =>
                role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
            ),
            datasets: [{
                data: Object.values(analytics.demographic_breakdown.by_role),
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(168, 85, 247, 0.8)'
                ],
                borderWidth: 0
            }]
        };
    };

    if (loading && !analytics) {
        return (
            <div className="page-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Survey Analytics</h1>
                    <p className="page-subtitle">
                        Comprehensive insights and data visualization for your surveys
                    </p>
                </div>
                <div className="page-actions">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="btn btn-outline"
                    >
                        <RefreshCw size={20} className={refreshing ? 'spinning' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={handleExport}
                        className="btn btn-primary"
                    >
                        <Download size={20} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Survey Selector */}
            <div className="analytics-filters">
                <div className="filter-group">
                    <label className="filter-label">
                        <Filter size={16} />
                        Select Survey
                    </label>
                    <select
                        value={selectedSurvey}
                        onChange={(e) => setSelectedSurvey(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Choose a survey...</option>
                        {surveys.map(survey => (
                            <option key={survey.id} value={survey.id}>
                                {survey.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedSurvey ? (
                <div className="empty-state">
                    <BarChart3 size={48} className="empty-icon" />
                    <h3>Select a Survey</h3>
                    <p>Choose a survey from the dropdown above to view detailed analytics.</p>
                </div>
            ) : !analytics ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading analytics data...</p>
                </div>
            ) : (
                <div className="analytics-content">
                    {/* Key Metrics */}
                    <div className="metrics-grid">
                        <div className="metric-card">
                            <div className="metric-content">
                                <div className="metric-info">
                                    <h3 className="metric-title">Total Responses</h3>
                                    <p className="metric-value">{analytics.total_responses}</p>
                                </div>
                                <div className="metric-icon metric-icon-blue">
                                    <Users size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-content">
                                <div className="metric-info">
                                    <h3 className="metric-title">Completion Rate</h3>
                                    <p className="metric-value">{analytics.completion_rate}%</p>
                                </div>
                                <div className="metric-icon metric-icon-green">
                                    <CheckCircle size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-content">
                                <div className="metric-info">
                                    <h3 className="metric-title">Avg. Completion Time</h3>
                                    <p className="metric-value">{analytics.average_completion_time} min</p>
                                </div>
                                <div className="metric-icon metric-icon-purple">
                                    <Clock size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-content">
                                <div className="metric-info">
                                    <h3 className="metric-title">Response Trend</h3>
                                    <p className="metric-value">
                                        <TrendingUp size={16} className="trend-icon" />
                                        +12%
                                    </p>
                                </div>
                                <div className="metric-icon metric-icon-emerald">
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="charts-grid">
                        {/* Responses Over Time */}
                        {getResponsesOverTimeData() && (
                            <div className="chart-card full-width">
                                <div className="chart-header">
                                    <h3 className="chart-title">Responses Over Time</h3>
                                    <p className="chart-subtitle">Daily response collection trends (Last 30 days)</p>
                                </div>
                                <div className="chart-container">
                                    <Line
                                        data={getResponsesOverTimeData()}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    grid: {
                                                        color: 'rgba(0, 0, 0, 0.1)'
                                                    }
                                                },
                                                x: {
                                                    grid: {
                                                        display: false
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Completion Rate */}
                        {getCompletionRateData() && (
                            <div className="chart-card">
                                <div className="chart-header">
                                    <h3 className="chart-title">Completion Rate</h3>
                                    <p className="chart-subtitle">Completed vs Incomplete responses</p>
                                </div>
                                <div className="chart-container">
                                    <Doughnut
                                        data={getCompletionRateData()}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                    labels: {
                                                        padding: 20,
                                                        usePointStyle: true
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Demographics */}
                        {getDemographicData() && (
                            <div className="chart-card">
                                <div className="chart-header">
                                    <h3 className="chart-title">Respondent Demographics</h3>
                                    <p className="chart-subtitle">Responses by user role</p>
                                </div>
                                <div className="chart-container">
                                    <Doughnut
                                        data={getDemographicData()}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                    labels: {
                                                        padding: 20,
                                                        usePointStyle: true
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Question Analytics */}
                    {analytics.question_analytics && analytics.question_analytics.length > 0 && (
                        <div className="question-analytics-section">
                            <h2 className="section-title">Question-by-Question Analysis</h2>
                            <div className="question-analytics-grid">
                                {analytics.question_analytics.map((question, index) => (
                                    <div key={index} className="question-analysis-card">
                                        <div className="question-header">
                                            <h4 className="question-title">
                                                Q{index + 1}: {question.question_text}
                                            </h4>
                                            <div className="question-stats">
                                                <span className="response-count">
                                                    {question.total_responses} responses
                                                </span>
                                                <span className="response-rate">
                                                    {question.response_rate.toFixed(1)}% response rate
                                                </span>
                                            </div>
                                        </div>

                                        <div className="question-content">
                                            {/* Choice-based questions */}
                                            {(question.question_type === 'radio' || question.question_type === 'dropdown') &&
                                                question.choice_distribution && (
                                                    <div className="chart-container small">
                                                        <Doughnut
                                                            data={getQuestionAnalyticsData(question)}
                                                            options={{
                                                                responsive: true,
                                                                maintainAspectRatio: false,
                                                                plugins: {
                                                                    legend: {
                                                                        position: 'right',
                                                                        labels: {
                                                                            boxWidth: 12,
                                                                            fontSize: 12,
                                                                            padding: 10
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                            {/* Rating questions */}
                                            {question.question_type === 'rating' && question.rating_distribution && (
                                                <div>
                                                    <div className="rating-summary">
                                                        <div className="avg-rating">
                                                            <span className="rating-value">{question.average_rating?.toFixed(1) || 'N/A'}</span>
                                                            <span className="rating-label">Average Rating</span>
                                                        </div>
                                                    </div>
                                                    <div className="chart-container small">
                                                        <Bar
                                                            data={getQuestionAnalyticsData(question)}
                                                            options={{
                                                                responsive: true,
                                                                maintainAspectRatio: false,
                                                                plugins: {
                                                                    legend: {
                                                                        display: false
                                                                    }
                                                                },
                                                                scales: {
                                                                    y: {
                                                                        beginAtZero: true,
                                                                        ticks: {
                                                                            stepSize: 1
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Text questions */}
                                            {(question.question_type === 'text' || question.question_type === 'textarea') && (
                                                <div className="text-analysis">
                                                    <div className="text-stats">
                                                        <div className="stat-item">
                                                            <span className="stat-value">{question.total_responses}</span>
                                                            <span className="stat-label">Text Responses</span>
                                                        </div>
                                                        <div className="stat-item">
                                                            <span className="stat-value">{question.response_rate.toFixed(1)}%</span>
                                                            <span className="stat-label">Response Rate</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-note">
                                                        Text responses require manual analysis. Export data for detailed review.
                                                    </p>
                                                </div>
                                            )}

                                            {/* Other question types */}
                                            {!['radio', 'dropdown', 'rating', 'text', 'textarea'].includes(question.question_type) && (
                                                <div className="general-stats">
                                                    <div className="stat-item">
                                                        <span className="stat-value">{question.total_responses}</span>
                                                        <span className="stat-label">Responses</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-value">{question.response_rate.toFixed(1)}%</span>
                                                        <span className="stat-label">Response Rate</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Export Section */}
                    <div className="export-section">
                        <div className="export-card">
                            <div className="export-content">
                                <div className="export-info">
                                    <h3>Export Analytics Data</h3>
                                    <p>Download comprehensive reports and raw data for further analysis</p>
                                </div>
                                <div className="export-actions">
                                    <button onClick={handleExport} className="btn btn-outline">
                                        <Download size={16} />
                                        Export CSV
                                    </button>
                                    <button onClick={handleExport} className="btn btn-outline">
                                        <Download size={16} />
                                        Export PDF Report
                                    </button>
                                    <button onClick={handleExport} className="btn btn-primary">
                                        <Download size={16} />
                                        Export All Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;