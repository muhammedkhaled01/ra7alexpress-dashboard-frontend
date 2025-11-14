import Echo from '@/utils/echo';

class Emitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = new Set();
        }
        this.events[event].add(listener);
    }

    off(event, listener) {
        if (this.events[event]) {
            this.events[event].delete(listener);
        }
    }

    emit(event, payload) {
        if (this.events[event]) {
            this.events[event].forEach((listener) => listener(payload));
        }
    }
}

class ChatSocketManager {
    constructor() {
        this.emitter = new Emitter();
        this.sessionChannels = new Map();
        this._initAdminChannel();
    }

    // Public API
    on(event, cb) {
        this.emitter.on(event, cb);
    }

    off(event, cb) {
        this.emitter.off(event, cb);
    }

    subscribeToSession(sessionId) {
        const channelName = `chat-session.${sessionId}`;
        if (this.sessionChannels.has(channelName)) return; // already subscribed

        const channel = Echo.channel(channelName)
            .listen('.message.sent', (e) => {
                this.emitter.emit('session:message', e);
            })
            .listen('.session.status.changed', (e) => {
                this.emitter.emit('session:status', e);
            });

        this.sessionChannels.set(channelName, channel);
    }

    leaveSession(sessionId) {
        const channelName = `chat-session.${sessionId}`;
        if (this.sessionChannels.has(channelName)) {
            Echo.leaveChannel(channelName);
            this.sessionChannels.delete(channelName);
        }
    }

    // Internal helpers
    _initAdminChannel() {
        if (!Echo) return;

        Echo.channel('chat-admin-public')
            .listen('.message.sent', (e) => {
                this.emitter.emit('admin:message', e);
            })
            .listen('.session.status.changed', (e) => {
                this.emitter.emit('admin:session_status', e);
            });
    }
}

const chatSocketManager = new ChatSocketManager();
export default chatSocketManager;
