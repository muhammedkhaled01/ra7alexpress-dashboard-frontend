import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useMerchantChatWebSocket } from "./websockets/useMerchantChatWebSocket";
import { useMerchantChatAPI } from "./websockets/useMerchantChatAPI";
import MerchantList from "./websockets/MerchantList";
import MerchantChatWindow from "./websockets/MerchantChatWindow";
import { useLanguage } from "@/contexts/LanguageProvider";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import toast from 'react-hot-toast';
import { debounce } from 'lodash';

export default function MerchantChatDashboard() {
    const user = useSelector(state => state.auth.user);
    const [merchants, setMerchants] = useState([]);
    const [selectedMerchant, setSelectedMerchant] = useState(null);
    const [activeTab, setActiveTab] = useState("all");
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [messagesPage, setMessagesPage] = useState(1);
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Custom hooks
    const {
        isLoading,
        isLoadingOldMessages,
        fetchMerchants,
        fetchMerchantChatHistory,
        loadOlderMessages,
        sendMessage,
        createPickupRequest,
        createSettlementRequest,
        createWaybillRequest,
        closeChatSession,
        markMessagesAsRead
    } = useMerchantChatAPI();

    // Debounced functions for better performance
    const debouncedMarkAsRead = useMemo(
        () => debounce((sessionId) => markMessagesAsRead(sessionId), 500),
        [markMessagesAsRead]
    );

    // Optimized WebSocket event handlers
    const handleMessageReceived = useCallback(
        (event) => {
            try {
                setMerchants(prevMerchants => {
                    const merchantIndex = prevMerchants.findIndex(merchant => merchant.id === event.merchant_id);
                    if (merchantIndex === -1) return prevMerchants;

                    const updatedMerchants = [...prevMerchants];
                    const merchant = updatedMerchants[merchantIndex];

                    const updatedMerchant = {
                        ...merchant,
                        updated_at: new Date().toISOString(),
                        last_message: event.message,
                        last_message_time: event.created_at
                    };

                    // Only increment unread count if not the currently selected merchant
                    if (!selectedMerchant || selectedMerchant.id !== event.merchant_id) {
                        updatedMerchant.unread_messages_count = (merchant.unread_messages_count || 0) + 1;
                    }

                    updatedMerchants[merchantIndex] = updatedMerchant;
                    return updatedMerchants;
                });

                // Update chat window if this message is for the selected merchant
                if (selectedMerchant && selectedMerchant.id === event.merchant_id) {
                    setSelectedMerchant(prevMerchant => {
                        if (!prevMerchant) return prevMerchant;

                        // Check if message already exists to avoid duplicates
                        const messageExists = prevMerchant.messages?.some(
                            msg => msg.id === event.id
                        );
                        if (messageExists) return prevMerchant;

                        const newMessage = {
                            id: event.id,
                            merchant_chat_session_id: event.merchant_chat_session_id,
                            sender_type: event.sender_type,
                            sender_id: event.sender_id,
                            sender_name: event.sender_name,
                            message: event.message,
                            message_type: event.message_type,
                            attachments: event.attachments || [],
                            created_at: event.created_at,
                            is_read: event.is_read,
                            read_at: event.read_at
                        };

                        return {
                            ...prevMerchant,
                            messages: [...(prevMerchant.messages || []), newMessage],
                            unread_messages_count: 0,
                            last_message: event.message,
                            last_message_time: event.created_at
                        };
                    });

                    // Debounced mark as read
                    if (selectedMerchant.current_session_id) {
                        debouncedMarkAsRead(selectedMerchant.current_session_id);
                    }
                }
            } catch (error) {
                console.error("Error processing received message:", error);
                toast.error(t("error_receiving_message"));
            }
        },
        [selectedMerchant, debouncedMarkAsRead, t]
    );

    const handleSessionStatusChanged = useCallback(
        (event) => {
            try {
                setMerchants(prevMerchants =>
                    prevMerchants.map(merchant =>
                        merchant.id === event.merchant_id
                            ? {
                                ...merchant,
                                status: event.session_status,
                                unread_messages_count: event.unread_count || merchant.unread_messages_count,
                                updated_at: event.updated_at
                            }
                            : merchant
                    )
                );

                // Update selected merchant if applicable
                if (selectedMerchant && selectedMerchant.id === event.merchant_id) {
                    setSelectedMerchant(prev => ({
                        ...prev,
                        status: event.session_status,
                    }));
                }
            } catch (error) {
                console.error("Error processing session status change:", error);
            }
        },
        [selectedMerchant]
    );

    // WebSocket setup
    const { isConnected, activeChannels } = useMerchantChatWebSocket(
        selectedMerchant,
        handleMessageReceived,
        handleSessionStatusChanged
    );

    // Optimized merchant selection handler
    const handleMerchantSelect = useCallback(
        async (merchant) => {
            try {
                // Early return if same merchant is selected
                if (selectedMerchant?.id === merchant.id) return;

                setSelectedMerchant(prev => {
                    if (prev?.id === merchant.id) return prev;
                    return { ...merchant, messages: [] };
                });

                setMessagesPage(1);
                setHasMoreMessages(false);

                // Reset unread count immediately for better UX
                if (merchant.unread_messages_count > 0) {
                    setMerchants(prevMerchants =>
                        prevMerchants.map(c =>
                            c.id === merchant.id
                                ? { ...c, unread_messages_count: 0 }
                                : c
                        )
                    );
                }

                // Fetch chat history only if session exists
                if (merchant.current_session_id) {
                    const history = await fetchMerchantChatHistory(merchant.id, merchant.current_session_id);
                    if (history) {
                        setSelectedMerchant(prevMerchant => ({
                            ...prevMerchant,
                            messages: history.messages || [],
                            hasMoreMessages: history.hasMore || false,
                        }));
                        setHasMoreMessages(history.hasMore || false);
                    }
                }
            } catch (error) {
                console.error("Error selecting merchant:", error);
                toast.error(t("error_selecting_merchant"));
            }
        },
        [selectedMerchant, fetchMerchantChatHistory, t]
    );

    const selectMerchantByChatSessionId = useCallback(
        async (chatId) => {
            try {
                const targetMerchant = merchants.find(merchant => merchant.current_session_id === parseInt(chatId));
                if (targetMerchant) {
                    await handleMerchantSelect(targetMerchant);
                } else {
                    toast.error(t("merchant_not_found"));
                }
            } catch (error) {
                console.error("Error selecting merchant by chat session ID:", error);
                toast.error(t("error_selecting_merchant"));
            }
        },
        [merchants, handleMerchantSelect, t]
    );

    // Handle URL parameter only once on initial load
    useEffect(() => {
        const chatId = searchParams.get('chat_id');
        if (chatId && merchants.length > 0 && isInitialLoad) {
            selectMerchantByChatSessionId(chatId);
            setIsInitialLoad(false);
        }
    }, [searchParams, merchants, selectMerchantByChatSessionId, isInitialLoad]);

    // Optimized load older messages handler
    const handleLoadOlderMessages = useCallback(
        async () => {
            if (!selectedMerchant || isLoadingOldMessages || !hasMoreMessages) return;

            try {
                const nextPage = messagesPage + 1;
                const result = await loadOlderMessages(
                    selectedMerchant.id,
                    selectedMerchant.current_session_id,
                    nextPage
                );

                if (result.messages.length > 0) {
                    setSelectedMerchant(prevMerchant => ({
                        ...prevMerchant,
                        messages: [...result.messages, ...(prevMerchant.messages || [])],
                    }));
                    setMessagesPage(nextPage);
                }

                setHasMoreMessages(result.hasMore);
            } catch (error) {
                console.error("Error loading older messages:", error);
                toast.error(t("error_loading_messages"));
            }
        },
        [selectedMerchant, isLoadingOldMessages, hasMoreMessages, messagesPage, loadOlderMessages, t]
    );

    // Optimized send message handler
    const handleSendMessage = useCallback(
        async (merchantId, message) => {
            if (!message.trim() || !selectedMerchant) return false;

            try {
                const success = await sendMessage(merchantId, message, {
                    sender_id: user.id,
                    sender_name: user.name,
                });

                if (!success) {
                    toast.error(t("error_sending_message"));
                    return false;
                }

                return true;
            } catch (error) {
                console.error("Error sending message:", error);
                toast.error(t("error_sending_message"));
                return false;
            }
        },
        [sendMessage, selectedMerchant, user, t]
    );

    // Request handlers
    const handlePickupRequest = useCallback(
        async (merchantId, data) => {
            try {
                return await createPickupRequest(merchantId, data);
            } catch (error) {
                console.error("Error creating pickup request:", error);
                toast.error(t("error_creating_pickup"));
                return false;
            }
        },
        [createPickupRequest, t]
    );

    const handleWaybillRequest = useCallback(
        async (merchantId, data) => {
            try {
                return await createWaybillRequest(merchantId, data);
            } catch (error) {
                console.error("Error creating waybill request:", error);
                toast.error(t("error_creating_waybill"));
                return false;
            }
        },
        [createWaybillRequest, t]
    );

    const handleCloseChat = useCallback(
        async (sessionId) => {
            try {
                const success = await closeChatSession(sessionId);
                if (success && selectedMerchant && selectedMerchant.current_session_id === sessionId) {
                    setSelectedMerchant(null);
                }
                return success;
            } catch (error) {
                console.error("Error closing chat:", error);
                toast.error(t("error_closing_chat"));
                return false;
            }
        },
        [closeChatSession, selectedMerchant, t]
    );

    // Load merchants on component mount with error handling
    useEffect(() => {
        let mounted = true;

        const loadMerchants = async () => {
            try {
                const merchantsData = await fetchMerchants();
                if (mounted) {
                    setMerchants(merchantsData);
                }
            } catch (error) {
                console.error("Error loading merchants:", error);
                toast.error(t("error_loading_merchants"));
            }
        };

        loadMerchants();

        return () => {
            mounted = false;
        };
    }, [fetchMerchants, t]);

    const { language } = useLanguage();

    return (
        <div className="p-4">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
                {/* Merchants List */}
                <MerchantList
                    merchants={merchants}
                    selectedMerchant={selectedMerchant}
                    onMerchantSelect={handleMerchantSelect}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    connectionStatus={isConnected ? 'connected' : 'disconnected'}
                />

                {/* Chat Window */}
                <MerchantChatWindow
                    selectedMerchant={selectedMerchant}
                    onSendMessage={handleSendMessage}
                    onPickupRequest={handlePickupRequest}
                    onWaybillRequest={handleWaybillRequest}
                    onCloseChat={handleCloseChat}
                    isLoading={isLoading}
                    isLoadingOldMessages={isLoadingOldMessages}
                    hasMoreMessages={hasMoreMessages}
                    onLoadOlderMessages={handleLoadOlderMessages}
                    connectionStatus={isConnected ? 'connected' : 'disconnected'}
                />
            </div>

            {/* Debug Info (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed top-4 right-4 bg-gray-800 text-white px-3 py-1 rounded text-xs opacity-75">
                    WS: {isConnected ? '✅' : '❌'} | Channels: {activeChannels.length}
                </div>
            )}
        </div>
    );
}