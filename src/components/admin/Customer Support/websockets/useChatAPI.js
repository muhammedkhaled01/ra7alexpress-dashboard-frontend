import { useState, useCallback } from 'react';
import axiosMerchant from '@/axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const useChatAPI = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);
    const [isLoadingOldMessages, setIsLoadingOldMessages] = useState(false);

    // Fetch chats based on status
    const fetchChats = useCallback(async (status = 'ACTIVE') => {
        try {
            const response = await axiosMerchant.get('/chat-sessions', {
                params: {
                    status: status,
                    per_page: 20
                }
            });

            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching chats:', error);
            toast.error(t('error_fetching_chats'));
            return [];
        }
    }, [t]);

    // Fetch chat history
    const fetchChatHistory = useCallback(async (sessionId) => {
        try {
            const response = await axiosMerchant.get(`/chat-sessions/${sessionId}/history`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching chat history:', error);
            toast.error(t('error_fetching_history'));
            return null;
        }
    }, [t]);

    // Load older messages
    const loadOlderMessages = useCallback(async (sessionId, page = 1) => {
        if (isLoadingOldMessages) return { messages: [], hasMore: false };

        setIsLoadingOldMessages(true);
        try {
            const response = await axiosMerchant.get(`/chat-sessions/${sessionId}/messages`, {
                params: {
                    page: page,
                    per_page: 20,
                    sort: 'desc'
                }
            });

            const newMessages = response.data.data || [];
            const hasMore = response.data.current_page < response.data.last_page;

            return {
                messages: newMessages.reverse(),
                hasMore: hasMore
            };
        } catch (error) {
            console.error('Error loading older messages:', error);
            toast.error(t('error_loading_messages'));
            return { messages: [], hasMore: false };
        } finally {
            setIsLoadingOldMessages(false);
        }
    }, [isLoadingOldMessages, t]);

    // Send message
    const sendMessage = useCallback(async (sessionId, message) => {
        if (!message.trim()) return false;

        setIsLoading(true);
        try {
            await axiosMerchant.post(`/chat-sessions/${sessionId}/message`, {
                message: message.trim(),
                sender_type: 'AGENT',
                sender_name: 'Support Agent'
            });

            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error(t('error_sending_message'));
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    // Generate ticket
    const generateTicket = useCallback(async (sessionId, subject) => {
        if (!subject.trim()) return null;

        setIsGeneratingTicket(true);
        try {
            const response = await axiosMerchant.post(`/chat-sessions/${sessionId}/escalate`, {
                subject: subject
            });

            toast.success(`${t('ticket_generated_successfully')}: ${response.data.data.ticket.ticket_number}`);
            return response.data.data;
        } catch (error) {
            console.error('Error generating ticket:', error);
            toast.error(t('error_generating_ticket'));
            return null;
        } finally {
            setIsGeneratingTicket(false);
        }
    }, [t]);

    // Archive chat session
    const archiveChat = useCallback(async (sessionId) => {
        try {
            await axiosMerchant.post(`/chat-sessions/${sessionId}/archive`, {});
            toast.success(t('chat_archived_successfully'));
            return true;
        } catch (error) {
            console.error('Error archiving chat:', error);
            toast.error(t('error_archiving_chat'));
            return false;
        }
    }, [t]);

    // Close chat session
    const closeChat = useCallback(async (sessionId) => {
        try {
            await axiosMerchant.post(`/chat-sessions/${sessionId}/close`, {});
            toast.success(t('chat_closed_successfully'));
            return true;
        } catch (error) {
            console.error('Error closing chat:', error);
            toast.error(t('error_closing_chat'));
            return false;
        }
    }, [t]);

    return {
        // State
        isLoading,
        isGeneratingTicket,
        isLoadingOldMessages,
        
        // Methods
        fetchChats,
        fetchChatHistory,
        loadOlderMessages,
        sendMessage,
        generateTicket,
        closeChat,
        archiveChat
    };
}; 