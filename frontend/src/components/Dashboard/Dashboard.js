import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FileText,
    Users,
    BarChart3,
    MessageSquare,
    Plus,
    TrendingUp,
    Clock,
    CheckCircle,
    Activity
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { surveysAPI } from '../../services/api';
import { useAuth } from '../../App';
import toast from 'react-hot-toast';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await surveysAPI.dashboardStats();
            setStats(response.data);
            generateChartData(response.data);
        } catch (error) {
            toast.error('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = (data) => {
        if (user?.role === 'admin') {
            setChartData({
                bar: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Surveys Created',
                        data: [12, 19, 8, 15, 22, 18],
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                    }]
                },
                doughnut: {
                    labels: ['Active', 'Draft', 'Completed', 'Archived'],
                    datasets: [{
                        data: [45, 20, 25, 10],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(251, 191, 36, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(156, 163, 175, 0.8)'
                        ],
                        borderWidth: 0
                    }]
                }
            });
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const getDashboardCards = () => {
        const baseCards = [
            {
                title: 'Available Surveys',
                value: stats.available_surveys || stats.my_surveys || stats.total_surveys || 0,
                icon: FileText,
                color: 'blue',
                link: '/surveys'
            },
            {
                title: 'My Responses',
                value: stats.my_responses || stats.total_responses || 0,
                icon: MessageSquare,
                color: 'green',
                link: '/responses'
            }
        ];

        if (user?.role === 'admin') {
            return [
                {
                    title: 'Total Surveys',
                    value: stats.total_surveys || 0,
                    icon: FileText,
                    color: 'blue',
                    link: '/surveys'
                },
                {
                    title: 'Active Surveys',
                    value: stats.active_surveys || 0,
                    icon: Activity,
                    color: 'green',
                    link: '/surveys?status=active'
                },
                {
                    title: 'Total Responses',
                    value: stats.total_responses || 0,
                    icon: MessageSquare,
                    color: 'purple',
                    link: '/responses'
                },
                {
                    title: 'Completed Responses',
                    value: stats.completed_responses || 0,
                    icon: CheckCircle,
                    color: 'emerald',
                    link: '/analytics'
                }
            ];
        }

        if (user?.role === 'healthcare_provider' || user?.role === 'researcher') {
            return [
                {
                    title: 'My Surveys',
                    value: stats.my_surveys || 0,
                    icon: FileText,
                    color: 'blue',
                    link: '/surveys'
                },
                {
                    title: 'Active Surveys',
                    value: stats.active_surveys || 0,
                    icon: Activity,
                    color: 'green',
                    link: '/surveys?status=active'
                },
                {
                    title: 'Total Responses',
                    value: stats.total_responses || 0,
                    icon: MessageSquare,
                    color: 'purple',
                    link: '/responses'
                },
                {
                    title: 'My Responses',
                    value: stats.my_responses || 0,
                    icon: CheckCircle,
                    color: 'emerald',
                    link: '/responses?me=true'
                }
            ];
        }

        return [
            ...baseCards,
            {
                title: 'Completed Surveys',
                value: stats.completed_surveys || 0,
                icon: CheckCircle,
                color: 'emerald',
                link: '/responses?completed=true'
            }
        ];
    };

    const getQuickActions = () => {
        if (user?.role === 'patient') {
            return [
                {
                    title: 'Take a Survey',
                    description: 'Browse and respond to available surveys',
                    icon: FileText,
                    link: '/surveys',
                    color: 'blue'
                },
                {
                    title: 'View My Responses',
                    description: 'See your survey response history',
                    icon: MessageSquare,
                    link: '/responses',
                    color: 'green'
                }
            ];
        }

        return [
            {
                title: 'Create Survey',
                description: 'Build a new healthcare survey',
                icon: Plus,
                link: '/surveys/create',
                color: 'blue'
            },
            {
                title: 'View Analytics',
                description: 'Analyze survey responses and trends',
                icon: BarChart3,
                link: '/analytics',
                color: 'purple'
            },
            {
                title: 'Manage Users',
                description: 'Add and manage system users',
                icon: Users,
                link: '/users',
                color: 'emerald',
                roles: ['admin']
            }
        ].filter(action => !action.roles || action.roles.includes(user?.role));
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="page-title">
                        {getGreeting()}, {user?.first_name || user?.username}!
                    </h1>
                    <p className="page-subtitle">
                        Here's what's happening with your healthcare surveys today.
                    </p>
                </div>
                <div className="dashboard-actions">
                    {(user?.role !== 'patient') && (
                        <Link to="/surveys/create" className="btn btn-primary">
                            <Plus size={20} />
                            Create Survey
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {getDashboardCards().map((card, index) => (
                    <Link key={index} to={card.link} className="stat-card">
                        <div className="stat-content">
                            <div className="stat-info">
                                <h3 className="stat-title">{card.title}</h3>
                                <p className="stat-value">{card.value}</p>
                            </div>
                            <div className={`stat-icon stat-icon-${card.color}`}>
                                <card.icon size={24} />
                            </div>
                        </div>
                        <div className="stat-trend">
                            <TrendingUp size={16} />
                            <span>View details</span>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="dashboard-content">
                {/* Quick Actions */}
                <div className="quick-actions-section">
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="quick-actions-grid">
                        {getQuickActions().map((action, index) => (
                            <Link key={index} to={action.link} className="quick-action-card">
                                <div className={`quick-action-icon quick-action-icon-${action.color}`}>
                                    <action.icon size={24} />
                                </div>
                                <div className="quick-action-content">
                                    <h3 className="quick-action-title">{action.title}</h3>
                                    <p className="quick-action-description">{action.description}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Charts Section */}
                {user?.role !== 'patient' && chartData && (
                    <div className="charts-section">
                        <h2 className="section-title">Analytics Overview</h2>
                        <div className="charts-grid">
                            <div className="chart-card">
                                <div className="chart-header">
                                    <h3 className="chart-title">Survey Activity</h3>
                                    <p className="chart-subtitle">Monthly survey creation trends</p>
                                </div>
                                <div className="chart-container">
                                    <Bar
                                        data={chartData.bar}
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

                            <div className="chart-card">
                                <div className="chart-header">
                                    <h3 className="chart-title">Survey Status</h3>
                                    <p className="chart-subtitle">Distribution by status</p>
                                </div>
                                <div className="chart-container">
                                    <Doughnut
                                        data={chartData.doughnut}
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
                        </div>
                    </div>
                )}

                {/* Recent Activity */}
                <div className="recent-activity-section">
                    <h2 className="section-title">Recent Activity</h2>
                    <div className="activity-card">
                        <div className="activity-list">
                            <div className="activity-item">
                                <div className="activity-icon activity-icon-blue">
                                    <FileText size={16} />
                                </div>
                                <div className="activity-content">
                                    <p className="activity-title">Patient Satisfaction Survey created</p>
                                    <p className="activity-time">2 hours ago</p>
                                </div>
                            </div>

                            <div className="activity-item">
                                <div className="activity-icon activity-icon-green">
                                    <MessageSquare size={16} />
                                </div>
                                <div className="activity-content">
                                    <p className="activity-title">15 new responses received</p>
                                    <p className="activity-time">4 hours ago</p>
                                </div>
                            </div>

                            <div className="activity-item">
                                <div className="activity-icon activity-icon-purple">
                                    <BarChart3 size={16} />
                                </div>
                                <div className="activity-content">
                                    <p className="activity-title">Weekly analytics report generated</p>
                                    <p className="activity-time">1 day ago</p>
                                </div>
                            </div>

                            <div className="activity-item">
                                <div className="activity-icon activity-icon-emerald">
                                    <CheckCircle size={16} />
                                </div>
                                <div className="activity-content">
                                    <p className="activity-title">Mental Health Survey completed</p>
                                    <p className="activity-time">2 days ago</p>
                                </div>
                            </div>
                        </div>

                        <div className="activity-footer">
                            <Link to="/responses" className="btn btn-outline">
                                View All Activity
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Tips Section */}
                <div className="tips-section">
                    <h2 className="section-title">Tips & Insights</h2>
                    <div className="tips-grid">
                        <div className="tip-card tip-card-blue">
                            <div className="tip-icon">💡</div>
                            <div className="tip-content">
                                <h3>Survey Design</h3>
                                <p>Keep surveys short and focused. Most patients prefer surveys under 10 questions.</p>
                            </div>
                        </div>

                        <div className="tip-card tip-card-green">
                            <div className="tip-icon">📊</div>
                            <div className="tip-content">
                                <h3>Response Rates</h3>
                                <p>Surveys with clear purpose statements have 40% higher completion rates.</p>
                            </div>
                        </div>

                        <div className="tip-card tip-card-purple">
                            <div className="tip-icon">🎯</div>
                            <div className="tip-content">
                                <h3>Targeting</h3>
                                <p>Segment your audience by demographics for more relevant insights.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;