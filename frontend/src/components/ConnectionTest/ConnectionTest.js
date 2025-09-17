import React, { useState, useEffect } from 'react';

const ConnectionTest = () => {
    const [status, setStatus] = useState('testing');
    const [backendUrl] = useState(process.env.REACT_APP_API_URL || 'http://localhost:8000');

    useEffect(() => {
        checkConnection();
        // Check connection every 30 seconds
        const interval = setInterval(checkConnection, 30000);
        return () => clearInterval(interval);
    }, []);

    const checkConnection = async () => {
        setStatus('testing');

        try {
            // Test a simple endpoint that should always respond
            const response = await fetch(`${backendUrl}/api/users/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Any response (including 401/403) means the server is working
            if (response.status === 401 || response.status === 200 || response.status === 403) {
                setStatus('connected');
                return;
            }

            setStatus('failed');

        } catch (error) {
            setStatus('failed');
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'testing': return '#f59e0b';
            case 'connected': return '#10b981';
            case 'failed': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'testing': return 'Testing connection...';
            case 'connected': return 'Backend connected ✅';
            case 'failed': return 'Backend connection failed ❌';
            default: return 'Unknown status';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            border: `2px solid ${getStatusColor()}`,
            fontSize: '12px',
            fontWeight: '500',
            color: getStatusColor(),
            zIndex: 9999,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            minWidth: '200px'
        }}>
            <div>{getStatusText()}</div>
            <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                API: {backendUrl}/api
            </div>
            <button
                onClick={checkConnection}
                disabled={status === 'testing'}
                style={{
                    marginTop: '5px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    background: status === 'testing' ? '#f3f4f6' : 'white',
                    cursor: status === 'testing' ? 'not-allowed' : 'pointer',
                    opacity: status === 'testing' ? 0.6 : 1
                }}
            >
                {status === 'testing' ? 'Testing...' : 'Retry'}
            </button>
        </div>
    );
};

export default ConnectionTest;