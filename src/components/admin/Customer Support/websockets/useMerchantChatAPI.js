// useMerchantChatAPI.js
import { useState, useCallback } from 'react';
import axiosMerchant from '@/axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const useMerchantChatAPI = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingOldMessages, setIsLoadingOldMessages] = useState(false);

    // Fetch merchants with chat info
    const fetchMerchants = useCallback(async () => {
        try {
            const response = await axiosMerchant.get('/merchants/with-chat-info');
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching merchants:', error);
            toast.error(t('error_fetching_merchants'));
            return [];
        }
    }, [t]);

    // Fetch merchant chat history
    const fetchMerchantChatHistory = useCallback(async (merchantId) => {
        try {
            const response = await axiosMerchant.get(`/merchant-chat/${merchantId}/messages`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching merchant chat history:', error);
            toast.error(t('error_fetching_history'));
            return null;
        }
    }, [t]);

    // Load older messages
    const loadOlderMessages = useCallback(async (merchantId, sessionId, page = 1) => {
        if (isLoadingOldMessages) return { messages: [], hasMore: false };

        setIsLoadingOldMessages(true);
        try {
            const response = await axiosMerchant.get(`/merchant-chat/${merchantId}/messages`, {
                params: {
                    session_id: sessionId,
                    page: page,
                    per_page: 20,
                    sort: 'desc'
                }
            });

            const newMessages = response.data.data?.messages || [];
            const hasMore = response.data.data?.hasMore || false;

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
    const sendMessage = useCallback(async (merchantId, message, senderDetails = {}) => {
        if (!message.trim()) return false;

        setIsLoading(true);
        try {
            const requestBody = {
                message: message.trim(),
                message_type: 'TEXT',
                ...(senderDetails.sender_id && { sender_id: senderDetails.sender_id }),
                ...(senderDetails.sender_name && { sender_name: senderDetails.sender_name })
            };

            await axiosMerchant.post(`/merchant-chat/${merchantId}/message`, requestBody);

            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error(t('error_sending_message'));
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    // Create pickup request
    const createPickupRequest = useCallback(async (merchantId, data) => {
        setIsLoading(true);
        try {
            const response = await axiosMerchant.post(`/merchant-chat/${merchantId}/request/pickup`, data);
            toast.success(t('pickup_request_created'));
            return response.data.data;
        } catch (error) {
            console.error('Error creating pickup request:', error);
            toast.error(t('error_creating_pickup_request'));
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    // Create settlement request
    const createSettlementRequest = useCallback(async (merchantId, data) => {
        setIsLoading(true);
        try {
            const response = await axiosMerchant.post(`/merchant-chat/${merchantId}/request/settlement`, data);
            toast.success(t('settlement_request_created'));
            return response.data.data;
        } catch (error) {
            console.error('Error creating settlement request:', error);
            toast.error(t('error_creating_settlement_request'));
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    // Create waybill request
    const createWaybillRequest = useCallback(async (merchantId, data) => {
        setIsLoading(true);
        try {
            const response = await axiosMerchant.post(`/merchant-chat/${merchantId}/request/waybills`, data);
            toast.success(t('waybill_request_created'));
            return response.data.data;
        } catch (error) {
            console.error('Error creating waybill request:', error);
            toast.error(t('error_creating_waybill_request'));
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    // Close chat session
    const closeChatSession = useCallback(async (sessionId) => {
        try {
            await axiosMerchant.post(`/merchant-chat/${sessionId}/close`);
            toast.success(t('chat_closed_successfully'));
            return true;
        } catch (error) {
            console.error('Error closing chat:', error);
            toast.error(t('error_closing_chat'));
            return false;
        }
    }, [t]);

    // Mark messages as read
    const markMessagesAsRead = useCallback(async (sessionId) => {
        try {
            await axiosMerchant.post(`/merchant-chat/${sessionId}/mark-read`);
            return true;
        } catch (error) {
            console.error('Error marking messages as read:', error);
            return false;
        }
    }, []);

    return {
        // State
        isLoading,
        isLoadingOldMessages,

        // Methods
        fetchMerchants,
        fetchMerchantChatHistory,
        loadOlderMessages,
        sendMessage,
        createPickupRequest,
        createSettlementRequest,
        createWaybillRequest,
        closeChatSession,
        markMessagesAsRead
    };
};