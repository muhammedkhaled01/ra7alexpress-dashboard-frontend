import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useRequestSupportChatAPI } from "./websockets/useRequestSupportChatAPI";
import { useRequestSupportWebSocket } from "./websockets/useRequestSupportWebSocket";
import RequestSupportWindow from "./websockets/RequestSupportWindow";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge.jsx";

export default function RequestSupport() {
    const { t } = useTranslation();
    const user = useSelector((state) => state.auth.user);
    const [messages, setMessages] = useState([]);
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingOldMessages, setIsLoadingOldMessages] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [messagesPage, setMessagesPage] = useState(1);
    const messagesEndRef = useRef(null);

    const {
        sendMessage,
        fetchMerchantChatHistory,
        startNewChat,
        loadOlderMessages
    } = useRequestSupportChatAPI(user?.id, user?.name);

    const handleMessageReceived = useCallback((event) => {
        setMessages(prevMessages => {
            const messageExists = prevMessages.some(msg => msg.id === event.id);
            if (messageExists) {
                console.log("🚫 Duplicate message detected, ignoring:", event.id);
                return prevMessages;
            }
            console.log("✅ Adding new message:", event.id);
            return [...prevMessages, event];
        });
    }, []);

    const handleSessionStatusChanged = useCallback((event) => {
        console.log("🔄 Session status changed:", event);
        if (event.status === 'CLOSED') {
            toast.success(t('chat_closed_by_admin'));
            setSession(null);
        }
    }, [t]);

    const { isConnected } = useRequestSupportWebSocket(
        session?.id,
        handleMessageReceived,
        handleSessionStatusChanged
    );

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const history = await fetchMerchantChatHistory();
            if (history?.messages) {
                setMessages(history.messages.reverse());
                setSession(history.session);
                // Check if there are more messages to load
                if (history.messages.length >= 20) {
                    setHasMoreMessages(true);
                } else {
                    setHasMoreMessages(false);
                }
            }
        } catch (error) {
            console.error("Failed to fetch chat history:", error);
            setMessages([]);
            setSession(null);
            setHasMoreMessages(false);
        } finally {
            setIsLoading(false);
        }
    }, [fetchMerchantChatHistory]);

    useEffect(() => {
        if (user?.id) {
            fetchHistory();
        }
    }, [user, fetchHistory]);

    const handleSendMessage = useCallback(async (text) => {
        if (!text.trim()) return;

        try {
            if (session) {
                // If a session exists, just send the message.
                // The new message will be added to the state via the WebSocket listener.
                await sendMessage(text, session.session_id);
            } else {
                // If no session exists, start a new chat.
                // The first message will be added to the state via the WebSocket listener.
                const newSession = await startNewChat(text);
                if (newSession) {
                    setSession(newSession);
                }
            }
        } catch (error) {
            console.error("Error sending or starting chat:", error);
        }
    }, [sendMessage, startNewChat, session]);

    const handleLoadOlderMessages = useCallback(async () => {
        if (!session || isLoadingOldMessages || !hasMoreMessages) return;

        setIsLoadingOldMessages(true);
        const nextPage = messagesPage + 1;
        try {
            const olderData = await loadOlderMessages(session.session_id, nextPage);
            if (olderData && olderData.messages) {
                setMessages(prevMessages => [...olderData.messages.reverse(), ...prevMessages]);
                setMessagesPage(nextPage);
                setHasMoreMessages(olderData.messages.length > 0);
            }
        } catch (error) {
            console.error("Failed to load older messages:", error);
            setHasMoreMessages(false);
        } finally {
            setIsLoadingOldMessages(false);
        }
    }, [session, isLoadingOldMessages, hasMoreMessages, messagesPage, loadOlderMessages]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    return (
        <div className="p-4 h-full">
            <Card className="max-w-3xl mx-auto h-full p-4 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center space-x-2">
                        <MessageSquare className="h-6 w-6 text-blue-500" />
                        <h2 className="text-xl font-bold">{t('Request Support')}</h2>
                    </div>
                    <Badge variant={isConnected ? "success" : "danger"}>
                        {t(isConnected ? 'Online' : 'Offline')}
                    </Badge>
                </div>

                <div className="flex-1 overflow-hidden p-4">
                    <RequestSupportWindow
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        isLoading={isLoading}
                        isLoadingOldMessages={isLoadingOldMessages}
                        hasMoreMessages={hasMoreMessages}
                        onLoadOlderMessages={handleLoadOlderMessages}
                        messagesEndRef={messagesEndRef}
                        selectedSession={session}
                        connectionStatus={isConnected ? 'connected' : 'disconnected'}
                    />
                </div>
            </Card>
        </div>
    );
}