// src/pages/websockets/useRequestSupportChatAPI.js
import { useState, useCallback } from 'react';
import axiosMerchant from '@/axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const useRequestSupportChatAPI = (userId,userName) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    // Fetch the merchant's current active chat history
    const fetchMerchantChatHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosMerchant.get(`/merchant-chat/messages/${userId}`);
            return {
                messages: response.data.data.messages || [],
                session: response.data.data.session,
            };
        } catch (error) {
            console.error('Error fetching chat history:', error);
            toast.error(t('error_fetching_history'));
            return { messages: [], session: null };
        } finally {
            setIsLoading(false);
        }
    }, [t, userId]);

    // Function to load older messages
    const loadOlderMessages = useCallback(async (sessionId, page = 1) => {
        try {
            const response = await axiosMerchant.get(`/merchant-chat/${sessionId}/messages?page=${page}`);
            return {
                messages: response.data.data.messages || [],
                hasMore: response.data.data.has_more
            };
        } catch (error) {
            console.error('Error loading older messages:', error);
            toast.error(t('error_loading_older_messages'));
            return { messages: [], hasMore: false };
        }
    }, [t]);

    // Starts a new chat session with an initial message
    const startNewChat = useCallback(async (message) => {
        setIsLoading(true);
        try {
            const response = await axiosMerchant.post('/merchant-chat/start-chat', {
                message
            });
            toast.success(t('chat_started_successfully'));
            return response.data.session;
        } catch (error) {
            console.error('Error starting chat:', error);
            toast.error(t('error_starting_chat'));
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    // Sends a message to an existing chat session
    const sendMessage = useCallback(async (message, sessionId) => {
        if (!sessionId) {
            console.error("Session ID is missing for sending a message.");
            return;
        }
        try {
            const response = await axiosMerchant.post(`/merchant-chat/message/${userId}`, {
                message,
                session_id: sessionId,
                sender_id: userId,
                sender_name: userName,
            });
            return response.data.data;
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error(t('error_sending_message'));
            throw error;
        }
    }, [t]);

    return {
        isLoading,
        sendMessage,
        fetchMerchantChatHistory,
        startNewChat,
        loadOlderMessages
    };
};