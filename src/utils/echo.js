import Echo from 'laravel-echo';
import axiosMerchant from '../axios';
import Pusher from 'pusher-js';

// Expose Pusher merchant globally for Laravel Echo (used by Reverb)
window.Pusher = Pusher;

// Echo configuration for Laravel Reverb
window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'ra7al_express_key',
    wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
    wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],

    // Custom authorizer for Sanctum authentication
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                axiosMerchant.post('/broadcasting/auth', {
                    socket_id: socketId,
                    channel_name: channel.name
                })
                    .then(response => {
                        console.log('✅ Broadcasting auth successful for channel:', channel.name);
                        callback(false, response.data);
                    })
                    .catch(error => {
                        console.error('❌ Broadcasting auth error for channel:', channel.name, error);
                        callback(true, error.response);
                    });
            }
        };
    },

    // Reverb-specific configuration
    disableStats: true,
    enableLogging: import.meta.env.DEV || false,
    activityTimeout: 30000,
    pongTimeout: 10000,
    disconnectedRetryDelay: 3000,
});

// Handle connection states with detailed logging
window.Echo.connector.pusher.connection.bind('connected', () => {
    console.log('🔗 Frontend WebSocket connected to Reverb server');
});

window.Echo.connector.pusher.connection.bind('disconnected', () => {
    console.log('❌ Frontend WebSocket disconnected from Reverb server');
});

window.Echo.connector.pusher.connection.bind('error', (error) => {
    console.error('⚠️ Frontend WebSocket error:', error);
});

// Handle authentication errors
window.Echo.connector.pusher.connection.bind('auth_error', (error) => {
    console.error('🔐 Frontend WebSocket authentication error:', error);
});

// Handle connection state changes
window.Echo.connector.pusher.connection.bind('state_change', (states) => {
    console.log('🔄 WebSocket state changed:', states.previous, '->', states.current);
});

export default window.Echo; 