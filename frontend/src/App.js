import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Components
import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import SurveyManagement from './components/SurveyManagement/SurveyManagement';
import SurveyBuilder from './components/SurveyBuilder/SurveyBuilder';
import PatientResponses from './components/PatientResponses/PatientResponses';
import Analytics from './components/Analytics/Analytics';
import UserManagement from './components/UserManagement/UserManagement';
import Settings from './components/Settings/Settings';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ConnectionTest from './components/ConnectionTest/ConnectionTest';

// Services
import { getStoredUser, setAuthToken, clearStorage } from './services/api';

// Authentication Context
const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on app start
        const token = localStorage.getItem('token');
        const storedUser = getStoredUser();

        if (token && storedUser) {
            setAuthToken(token);
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        setAuthToken(token);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        clearStorage();
        setUser(null);
    };

    const value = {
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

// Public Route Component (redirects to dashboard if logged in)
const PublicRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

// Main Layout Component
const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'without-sidebar'}`}>
                {children}
            </main>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <ConnectionTest />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                            },
                            success: {
                                duration: 3000,
                                theme: {
                                    primary: '#4aed88',
                                },
                            },
                        }}
                    />

                    <Routes>
                        {/* Public Routes */}
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <Login />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                <PublicRoute>
                                    <Register />
                                </PublicRoute>
                            }
                        />

                        {/* Protected Routes */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Dashboard />
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/surveys"
                            element={
                                <ProtectedRoute>
                                    <Layout>
                                        <SurveyManagement />
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/surveys/create"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'healthcare_provider', 'researcher']}>
                                    <Layout>
                                        <SurveyBuilder />
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/surveys/:id/edit"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'healthcare_provider', 'researcher']}>
                                    <Layout>
                                        <SurveyBuilder />
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/responses"
                            element={
                                <ProtectedRoute>
                                    <Layout>
                                        <PatientResponses />
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/analytics"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'healthcare_provider', 'researcher']}>
                                    <Layout>
                                        <Analytics />
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/users"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <Layout>
                                        <UserManagement />
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/settings"
                            element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Settings />
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        {/* Default redirect */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;