// frontend/components/WebSocketTest.jsx
import { useEffect, useState } from 'react';
import Echo from '@/utils/echo';

const WebSocketTest = () => {
    const [connectionState, setConnectionState] = useState('disconnected');
    const [socketId, setSocketId] = useState(null);
    const [logs, setLogs] = useState([]);
    const [connectionDetails, setConnectionDetails] = useState({});

    const addLog = (message, type = 'info', details = null) => {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = { timestamp, message, type, details };
        setLogs(prev => [...prev, logEntry]);
        console.log(`[${timestamp}] ${message}`, details || '');
    };

    useEffect(() => {
        if (!Echo || !Echo.connector || !Echo.connector.pusher) {
            addLog('❌ Echo is not properly initialized', 'error');
            return;
        }

        const pusher = Echo.connector.pusher;
        const connection = pusher.connection;

        // تحديث تفاصيل الاتصال
        setConnectionDetails({
            wsHost: Echo.connector.options.wsHost,
            wsPort: Echo.connector.options.wsPort,
            key: Echo.connector.options.key,
            enabledTransports: Echo.connector.options.enabledTransports
        });

        // إضافة جميع مستمعي الأحداث للتصحيح
        const events = {
            'connecting': () => {
                const details = {
                    url: `${Echo.connector.options.wsHost}:${Echo.connector.options.wsPort}`,
                    transports: Echo.connector.options.enabledTransports
                };
                addLog('🔄 Connecting to WebSocket server...', 'info', details);
                setConnectionState('connecting');
            },
            'connected': () => {
                const details = {
                    socketId: connection.socket_id,
                    activityTimeout: Echo.connector.options.activityTimeout
                };
                addLog('✅ Connected to WebSocket server successfully', 'success', details);
                setConnectionState('connected');
                setSocketId(connection.socket_id);
            },
            'disconnected': (reason) => {
                addLog('❌ Disconnected from WebSocket server', 'error', { reason });
                setConnectionState('disconnected');
                setSocketId(null);
            },
            'error': (error) => {
                const errorDetails = {
                    type: error?.type,
                    code: error?.data?.code,
                    message: error?.message,
                    data: error?.data,
                    fullError: error
                };
                addLog('⚠️ WebSocket connection error', 'error', errorDetails);
                console.error('Full error object:', error);
            },
            'state_change': (states) => {
                addLog('🔄 Connection state changed', 'info', {
                    previous: states.previous,
                    current: states.current
                });
            },
            'message': (message) => {
                addLog('📨 WebSocket message received', 'info', message);
            },
            'ping': () => {
                addLog('📡 WebSocket ping sent', 'debug');
            },
            'pong': () => {
                addLog('📡 WebSocket pong received', 'debug');
            },
            'auth_error': (error) => {
                addLog('🔐 WebSocket authentication error', 'error', error);
            }
        };

        // ربط جميع الأحداث
        Object.entries(events).forEach(([event, handler]) => {
            connection.bind(event, handler);
        });

        // اختبار الاتصال الأساسي
        const testBasicConnection = () => {
            addLog('🧪 Testing basic WebSocket connection...', 'info');
            
            // محاولة الاتصال يدوياً للاختبار
            try {
                const testSocket = new WebSocket(`ws://${Echo.connector.options.wsHost}:${Echo.connector.options.wsPort}`);
                
                testSocket.onopen = () => {
                    addLog('✅ Basic WebSocket connection test passed', 'success');
                    testSocket.close();
                };
                
                testSocket.onerror = (error) => {
                    addLog('❌ Basic WebSocket connection test failed', 'error', {
                        error: error,
                        url: `ws://${Echo.connector.options.wsHost}:${Echo.connector.options.wsPort}`
                    });
                };
                
                testSocket.onclose = () => {
                    addLog('🔒 Basic WebSocket connection closed', 'info');
                };
                
            } catch (error) {
                addLog('❌ WebSocket connection test error', 'error', error);
            }
        };

        testBasicConnection();

        // اختبار الاشتراك في قناة
        const testChannelSubscription = () => {
            addLog('📡 Testing channel subscription...', 'info');

            const testChannel = Echo.channel('test-channel')
                .subscribed(() => {
                    addLog('✅ Test channel subscribed successfully', 'success');
                })
                .error((error) => {
                    addLog('❌ Test channel subscription failed', 'error', {
                        error: error,
                        channel: 'test-channel',
                        details: error?.message || error?.toString()
                    });
                })
                .listen('.test.event', (data) => {
                    addLog('📩 Test event received', 'info', data);
                });

            return testChannel;
        };

        const testChannel = testChannelSubscription();

        // تنظيف
        return () => {
            // إلغاء ربط جميع الأحداث
            Object.entries(events).forEach(([event, handler]) => {
                connection.unbind(event, handler);
            });

            // مغادرة القناة
            if (testChannel) {
                Echo.leave('test-channel');
                addLog('🧹 Left test channel', 'info');
            }
        };
    }, []);

    const testConnection = () => {
        addLog('🔄 Manual connection test started...', 'info');
        if (Echo && Echo.connector && Echo.connector.pusher) {
            Echo.connector.pusher.connect();
        }
    };

    const disconnect = () => {
        addLog('🛑 Manual disconnect initiated...', 'info');
        if (Echo && Echo.connector && Echo.connector.pusher) {
            Echo.connector.pusher.disconnect();
        }
    };

    const testAuthEndpoint = async () => {
        addLog('🔐 Testing authentication endpoint...', 'info');
        
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            if (!token) {
                addLog('❌ No authentication token found', 'error');
                return;
            }

            const response = await fetch('/broadcasting/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    socket_id: 'test_socket_123',
                    channel_name: 'test-channel'
                })
            });

            const data = await response.json();
            
            addLog('🔐 Auth endpoint response', response.ok ? 'success' : 'error', {
                status: response.status,
                statusText: response.statusText,
                data: data,
                headers: Object.fromEntries([...response.headers])
            });

        } catch (error) {
            addLog('❌ Auth endpoint test failed', 'error', {
                error: error.message,
                stack: error.stack
            });
        }
    };

    const clearLogs = () => {
        setLogs([]);
        addLog('🧹 Logs cleared', 'info');
    };

    const getStatusColor = () => {
        switch (connectionState) {
            case 'connected': return 'bg-green-100 text-green-800';
            case 'connecting': return 'bg-yellow-100 text-yellow-800';
            case 'error': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getLogTypeColor = (type) => {
        switch (type) {
            case 'error': return 'bg-red-50 border-l-4 border-red-500';
            case 'success': return 'bg-green-50 border-l-4 border-green-500';
            case 'warning': return 'bg-yellow-50 border-l-4 border-yellow-500';
            case 'debug': return 'bg-blue-50 border-l-4 border-blue-500';
            default: return 'bg-gray-50 border-l-4 border-gray-300';
        }
    };

    const getLogTextColor = (type) => {
        switch (type) {
            case 'error': return 'text-red-700';
            case 'success': return 'text-green-700';
            case 'warning': return 'text-yellow-700';
            case 'debug': return 'text-blue-700';
            default: return 'text-gray-700';
        }
    };

    return (
        <div className="p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-200 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <span className="mr-2">🔌</span> WebSocket Connection Debugger
                </h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                    {connectionState.toUpperCase()}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">
                        <span className="mr-2">📊</span> Connection Status
                    </h3>
                    <div className="space-y-2 text-sm">
                        <p className="flex justify-between">
                            <span className="text-gray-600 font-medium">Socket ID:</span>
                            <span className="font-mono text-gray-800">{socketId || 'N/A'}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-gray-600 font-medium">Host:</span>
                            <span className="font-mono text-gray-800">{connectionDetails.wsHost}:{connectionDetails.wsPort}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-gray-600 font-medium">Key:</span>
                            <span className="font-mono text-gray-800 truncate max-w-xs">{connectionDetails.key}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-gray-600 font-medium">Transports:</span>
                            <span className="font-mono text-gray-800">
                                {connectionDetails.enabledTransports?.join(', ') || 'N/A'}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">
                        <span className="mr-2">⚡</span> Actions
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={testConnection}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center"
                        >
                            <span className="mr-2">🔄</span> Test Connection
                        </button>
                        <button
                            onClick={disconnect}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center"
                        >
                            <span className="mr-2">⏹️</span> Disconnect
                        </button>
                        <button
                            onClick={testAuthEndpoint}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center"
                        >
                            <span className="mr-2">🔐</span> Test Auth
                        </button>
                        <button
                            onClick={clearLogs}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors flex items-center"
                        >
                            <span className="mr-2">🧹</span> Clear Logs
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-6">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                        <span className="mr-2">📋</span> Connection Logs
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
                    </span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {logs.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            No logs available. Try connecting to see WebSocket activity.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {logs.map((log, index) => (
                                <div 
                                    key={index}
                                    className={`p-4 hover:bg-gray-50 transition-colors ${getLogTypeColor(log.type)}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                <span className={`text-xs font-mono text-gray-500 mr-2`}>
                                                    [{log.timestamp}]
                                                </span>
                                                <span className={`font-medium ${getLogTextColor(log.type)}`}>
                                                    {log.message}
                                                </span>
                                            </div>
                                            {log.details && (
                                                <div className="mt-2 text-sm">
                                                    <div className="bg-gray-800 text-gray-100 p-3 rounded-md overflow-x-auto">
                                                        <pre className="text-xs">
                                                            {JSON.stringify(log.details, null, 2)}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                            {log.type}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <span className="text-amber-500 text-xl">🔍</span>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">Troubleshooting Tips</h3>
                        <div className="mt-2 text-sm text-amber-700 space-y-1">
                            <p>• تأكد أن Reverb server يعمل: <code className="bg-amber-100 px-2 py-0.5 rounded text-xs font-mono">php artisan reverb:start --host=0.0.0.0 --port=10000</code></p>
                            <p>• تحقق من تطابق البورت في frontend وbackend (يجب أن يكون 10000)</p>
                            <p>• جرب فتح <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">http://localhost:10000</code> في المتصفح</p>
                            <p>• تحقق من console الـ Laravel لأي أخطاء في Reverb</p>
                            <p>• جرب تغيير VITE_REVERB_HOST إلى 127.0.0.1</p>
                            <p>• تأكد من وجود الـ token في localStorage</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebSocketTest;