import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Ticket, Clock, User, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import axiosMerchant from '@/axios';
import Echo from '@/utils/echo';
import toast from 'react-hot-toast';
import './LiveChat.css';

export default function LiveChat() {
    const { t } = useTranslation();
    const [activeChats, setActiveChats] = useState([]);
    const [closedChats, setClosedChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);
    const [ticketSubject, setTicketSubject] = useState('');
    const [showTicketDialog, setShowTicketDialog] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [activeTab, setActiveTab] = useState('active');
    const [isLoadingOldMessages, setIsLoadingOldMessages] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [messagesPage, setMessagesPage] = useState(1);
    const messagesEndRef = useRef(null);
    const messagesStartRef = useRef(null);
    const messagesScrollRef = useRef(null);
    const activeChannelsRef = useRef(new Set());

    // Fetch chats based on status
    const fetchChats = async (status = 'ACTIVE') => {
        try {
            const response = await axiosMerchant.get('/chat-sessions', {
                params: {
                    status: status,
                    per_page: 20
                }
            });

            if (status === 'ACTIVE') {
                setActiveChats(response.data.data || []);
            } else if (status === 'CLOSED') {
                setClosedChats(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        }
    };

    // Fetch active chats (for backward compatibility)
    const fetchActiveChats = () => fetchChats('ACTIVE');

    // Fetch chat history
    const fetchChatHistory = async (sessionId) => {
        try {
            const response = await axiosMerchant.get(`/chat-sessions/${sessionId}/history`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching chat history:', error);
            return null;
        }
    };

    // Load older messages
    const loadOlderMessages = async (sessionId, page = 1) => {
        if (isLoadingOldMessages || !hasMoreMessages) return;

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

            setHasMoreMessages(hasMore);

            if (newMessages.length > 0) {
                setSelectedChat(prevChat => ({
                    ...prevChat,
                    messages: [...newMessages.reverse(), ...(prevChat.messages || [])]
                }));
            }

        } catch (error) {
            console.error('Error loading older messages:', error);
        } finally {
            setIsLoadingOldMessages(false);
        }
    };

    // Send message
    const handleSendMessage = async () => {
        if (!message.trim() || !selectedChat) return;

        setIsLoading(true);
        try {
            await axiosMerchant.post(`/chat-sessions/${selectedChat.id}/message`, {
                message: message.trim(),
                sender_type: 'AGENT',
                sender_name: 'Support Agent'
            });

            setMessage('');

            // No need to manually refresh - real-time updates will handle this
        } catch (error) {
            console.error('Error sending message:', error);
            // On error, we might want to show a notification to the user
            alert('Failed to send message. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Generate ticket
    const handleGenerateTicket = async () => {
        if (!ticketSubject.trim() || !selectedChat) return;

        setIsGeneratingTicket(true);
        try {
            const response = await axiosMerchant.post(`/chat-sessions/${selectedChat.id}/escalate`, {
                subject: ticketSubject
            });

            toast.success(`${t('ticket_generated_successfully')}: ${response.data.data.ticket.ticket_number}`);
            setShowTicketDialog(false);
            setTicketSubject('');

            // Real-time updates will handle the refresh automatically
        } catch (error) {
            console.error('Error generating ticket:', error);
            toast.error(t('error_generating_ticket'));
        } finally {
            setIsGeneratingTicket(false);
        }
    };

    // Close chat session
    const handleCloseChat = async (sessionId) => {
        try {
            await axiosMerchant.post(`/chat-sessions/${sessionId}/close`, {});

            // Real-time updates will handle the refresh automatically
            // If we're closing the currently selected chat, clear the selection
            if (selectedChat && selectedChat.id === sessionId) {
                setSelectedChat(null);
            }
        } catch (error) {
            console.error('Error closing chat:', error);
            alert('Failed to close chat. Please try again.');
        }
    };

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Handle scroll event for loading older messages
    const handleMessagesScroll = (e) => {
        const { scrollTop } = e.target;

        // If scrolled to top and has more messages, load older messages
        if (scrollTop === 0 && hasMoreMessages && selectedChat && !isLoadingOldMessages) {
            const nextPage = messagesPage + 1;
            setMessagesPage(nextPage);
            loadOlderMessages(selectedChat.id, nextPage);
        }
    };

    // Setup WebSocket connection and listeners
    useEffect(() => {
        if (!Echo) {
            console.error('Echo is not available');
            return;
        }

        console.log('Setting up WebSocket connection...');

        // Listen for connection status
        if (Echo.connector && Echo.connector.pusher) {
            Echo.connector.pusher.connection.bind('connected', () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);
            });

            Echo.connector.pusher.connection.bind('disconnected', () => {
                console.log('❌ WebSocket disconnected');
                setIsConnected(false);
            });

            Echo.connector.pusher.connection.bind('error', (error) => {
                console.error('⚠️ WebSocket error:', error);
                setIsConnected(false);
            });

            Echo.connector.pusher.connection.bind('auth_error', (error) => {
                console.error('🔐 WebSocket authentication error:', error);
                setIsConnected(false);
            });
        }

        // TEMPORARY: Listen to public channel for testing
        console.log('📡 Attempting to join chat-admin-public channel (for testing)...');
        const adminChannel = Echo.channel('chat-admin-public')
            .subscribed(() => {
                console.log('✅ Successfully subscribed to chat-admin channel');
            })
            .error((error) => {
                console.error('❌ Failed to subscribe to chat-admin channel:', error);
            })
            .listen('.message.sent', (e) => {
                console.log('📨 New message received on admin channel:', e);

                // Update active chats list to reflect new activity
                setActiveChats(prevChats => {
                    return prevChats.map(chat => {
                        if (chat.id === e.chat_session_id) {
                            return {
                                ...chat,
                                updated_at: new Date().toISOString()
                            };
                        }
                        return chat;
                    });
                });

                // If this message is for the currently selected chat, update it
                if (selectedChat && selectedChat.id === e.chat_session_id) {
                    setSelectedChat(prevChat => ({
                        ...prevChat,
                        messages: [...(prevChat.messages || []), {
                            id: e.id,
                            chat_session_id: e.chat_session_id,
                            sender_type: e.sender_type,
                            sender_id: e.sender_id,
                            sender_name: e.sender_name,
                            message: e.message,
                            message_type: e.message_type,
                            attachments: e.attachments,
                            created_at: e.created_at,
                            sender: e.sender
                        }]
                    }));
                }
            })
            .listen('.session.status.changed', (e) => {
                console.log('🔄 Session status changed on admin channel:', e);

                // Update the session in active chats list
                if (e.status_type === 'created') {
                    // Add new session to the list
                    setActiveChats(prevChats => [e.session, ...prevChats]);
                } else {
                    // Update existing session
                    setActiveChats(prevChats => {
                        return prevChats.map(chat => {
                            if (chat.id === e.session.id) {
                                return { ...chat, ...e.session };
                            }
                            return chat;
                        }).filter(chat => chat.status === 'ACTIVE'); // Remove closed chats
                    });
                }

                // If this is the currently selected chat, update it
                if (selectedChat && selectedChat.id === e.session.id) {
                    setSelectedChat(prevChat => ({
                        ...prevChat,
                        ...e.session,
                        assignedAgent: e.assigned_agent,
                        ticket: e.ticket
                    }));
                }
            });

        return () => {
            console.log('🧹 Cleaning up admin WebSocket connections...');
            adminChannel?.stopListening('.message.sent');
            adminChannel?.stopListening('.session.status.changed');
            Echo.leaveChannel('chat-admin');
        };
    }, [selectedChat]);

    // Listen to specific chat session when selected
    useEffect(() => {
        if (!selectedChat || !Echo) return;

        const channelName = `chat-session.${selectedChat.id}`;
        console.log(`📡 Joining private channel: ${channelName}`);

        // Leave previous channel if exists
        if (activeChannelsRef.current.has(channelName)) {
            Echo.leaveChannel(channelName);
        }

        // Add error handling for channel subscription
        const sessionChannel = Echo.channel(channelName)
            .subscribed(() => {
                console.log(`✅ Successfully subscribed to ${channelName}`);
            })
            .error((error) => {
                console.error(`❌ Failed to subscribe to ${channelName}:`, error);
            })
            .listen('.message.sent', (e) => {
                console.log(`📨 Message received for session ${selectedChat.id}:`, e);

                setSelectedChat(prevChat => {
                    if (!prevChat || prevChat.id !== e.chat_session_id) return prevChat;

                    // Check if message already exists to avoid duplicates
                    const messageExists = prevChat.messages?.some(msg => msg.id === e.id);
                    if (messageExists) return prevChat;

                    return {
                        ...prevChat,
                        messages: [...(prevChat.messages || []), {
                            id: e.id,
                            chat_session_id: e.chat_session_id,
                            sender_type: e.sender_type,
                            sender_id: e.sender_id,
                            sender_name: e.sender_name,
                            message: e.message,
                            message_type: e.message_type,
                            attachments: e.attachments,
                            created_at: e.created_at,
                            sender: e.sender
                        }]
                    };
                });
            })
            .listen('.session.status.changed', (e) => {
                console.log('Session status changed for current chat:', e);

                setSelectedChat(prevChat => {
                    if (!prevChat || prevChat.id !== e.session.id) return prevChat;

                    return {
                        ...prevChat,
                        ...e.session,
                        assignedAgent: e.assigned_agent,
                        ticket: e.ticket
                    };
                });
            });

        activeChannelsRef.current.add(channelName);

        return () => {
            console.log(`Leaving channel: ${channelName}`);
            sessionChannel?.stopListening('.message.sent');
            sessionChannel?.stopListening('.session.status.changed');
            Echo.leaveChannel(channelName);
            activeChannelsRef.current.delete(channelName);
        };
    }, [selectedChat?.id]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [selectedChat?.messages]);

    // Fetch active chats initially
    useEffect(() => {
        fetchChats('ACTIVE');
        fetchChats('CLOSED');
        // Reduced polling frequency since we have real-time updates
        const interval = setInterval(() => {
            fetchChats('ACTIVE');
            fetchChats('CLOSED');
        }, 5);
        return () => clearInterval(interval);
    }, []);

    // Reset message pagination when selecting a new chat
    useEffect(() => {
        if (selectedChat) {
            setMessagesPage(1);
            setHasMoreMessages(true);
        }
    }, [selectedChat?.id]);

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'ACTIVE': { variant: 'success', text: t('active') },
            'CLOSED': { variant: 'secondary', text: t('closed') },
            'ESCALATED': { variant: 'warning', text: t('escalated') }
        };
        const statusInfo = statusMap[status] || { variant: 'secondary', text: status };
        return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>;
    };

    const getPriorityBadge = (priority) => {
        const priorityMap = {
            'LOW': { variant: 'secondary', text: t('low') },
            'MEDIUM': { variant: 'default', text: t('medium') },
            'HIGH': { variant: 'warning', text: t('high') },
            'URGENT': { variant: 'destructive', text: t('urgent') }
        };
        const priorityInfo = priorityMap[priority] || { variant: 'secondary', text: priority };
        return <Badge variant={priorityInfo.variant}>{priorityInfo.text}</Badge>;
    };
    return (
        <div className="p-4">
            <div className="grid grid-cols-3 gap-6 h-full">
                {/* Chat List */}
                <Card className="col-span-1 flex flex-col border-2 shadow-lg">
                    <div className="p-4 border-b bg-gray-50/50">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">{t('customer_support_chats')}</h2>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="active" className="text-sm">
                                    {t('active')} ({activeChats.length})
                                </TabsTrigger>
                                <TabsTrigger value="closed" className="text-sm">
                                    {t('closed')} ({closedChats.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="active" className="mt-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MessageSquare className="h-4 w-4" />
                                    <span>{t('active_conversations')}</span>
                                    <Badge variant="success" className="ml-auto">{activeChats.length}</Badge>
                                </div>
                            </TabsContent>

                            <TabsContent value="closed" className="mt-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MessageSquare className="h-4 w-4" />
                                    <span>{t('closed_conversations')}</span>
                                    <Badge variant="secondary" className="ml-auto">{closedChats.length}</Badge>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <div className="h-[calc(100vh-18rem)] p-4">
                            <ScrollArea className="h-full">
                                <div className="space-y-3">
                                    {(activeTab === 'active' ? activeChats : closedChats).map((chat) => (
                                        <Card
                                            key={chat.id}
                                            className={`p-4 cursor-pointer chat-card-hover ${selectedChat?.id === chat.id} hover:bg-gray-50`}
                                            onClick={() => setSelectedChat(chat)}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <User className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-sm text-gray-800">{chat.customer_name}</span>
                                                        <p className="text-xs text-gray-500">{chat.customer_email}</p>
                                                    </div>
                                                </div>
                                                {getStatusBadge(chat.status)}
                                            </div>

                                            <div className="mb-3">
                                                <p className="text-xs text-gray-600 line-clamp-2">
                                                    {chat.initial_message || t('no_initial_message')}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                {getPriorityBadge(chat.priority)}
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Clock className="h-3 w-3" />
                                                    {formatTime(chat.created_at)}
                                                </div>
                                            </div>

                                            {chat.ticket_id && (
                                                <div className="mt-2 flex items-center gap-1 p-2 bg-blue-50 rounded">
                                                    <Ticket className="h-3 w-3 text-blue-500" />
                                                    <span className="text-xs text-blue-600 font-medium">
                                                        {t('linked_to_ticket')}
                                                    </span>
                                                </div>
                                            )}
                                        </Card>
                                    ))}

                                    {(activeTab === 'active' ? activeChats : closedChats).length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                            <p className="text-sm">
                                                {activeTab === 'active' ? t('no_active_chats') : t('no_closed_chats')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </Card>

                {/* Chat Window */}
                <Card className="col-span-2 flex flex-col border-2 shadow-lg">
                    {selectedChat ? (
                        <div className="h-[calc(100vh-8rem)] flex flex-col">
                            {/* Chat Header */}
                            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            {selectedChat.customer_name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">{selectedChat.customer_name}</h2>
                                            <p className="text-sm text-gray-600">{selectedChat.customer_email}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                                                    {t('session')}: {selectedChat.session_id}
                                                </span>
                                                {selectedChat.ticket && (
                                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                                        {t('ticket')}: {selectedChat.ticket.ticket_number}
                                                    </span>
                                                )}
                                                {getStatusBadge(selectedChat.status)}
                                                {getPriorityBadge(selectedChat.priority)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="shadow-sm">
                                                    <Ticket className="h-4 w-4 mr-2" />
                                                    {t('generate_ticket')}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>{t('generate_ticket')}</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">
                                                            {t('reason_for_ticket')} *
                                                        </label>
                                                        <Input
                                                            value={ticketSubject}
                                                            onChange={(e) => setTicketSubject(e.target.value)}
                                                            placeholder={t('enter_reason_for_ticket')}
                                                        />
                                                    </div>

                                                    <p className="text-sm text-gray-600">
                                                        {t('ticket_generation_note')}
                                                    </p>

                                                    <Button
                                                        onClick={handleGenerateTicket}
                                                        disabled={isGeneratingTicket || !ticketSubject.trim()}
                                                        className="w-full"
                                                    >
                                                        {isGeneratingTicket ? t('generating') : t('generate_ticket')}
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleCloseChat(selectedChat.id)}
                                            className="shadow-sm"
                                        >
                                            {t('close_chat')}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <ScrollArea
                                    className="flex-1 messages-scroll"
                                    onScrollCapture={handleMessagesScroll}
                                    ref={messagesScrollRef}
                                >
                                    <div className="p-4 space-y-4">
                                        <div ref={messagesStartRef} />

                                        {/* Load More Messages Button */}
                                        {hasMoreMessages && (
                                            <div className="flex justify-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const nextPage = messagesPage + 1;
                                                        setMessagesPage(nextPage);
                                                        loadOlderMessages(selectedChat.id, nextPage);
                                                    }}
                                                    disabled={isLoadingOldMessages}
                                                    className="text-xs"
                                                >
                                                    {isLoadingOldMessages ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900 mr-2"></div>
                                                            {t('loading_messages')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronUp className="h-3 w-3 mr-1" />
                                                            {t('load_older_messages')}
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}

                                        {selectedChat.messages?.map((msg, index) => (
                                            <div
                                                key={msg.id || index}
                                                className={`flex ${msg.sender_type === 'AGENT' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${msg.sender_type === 'AGENT'
                                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                                        : msg.sender_type === 'SYSTEM'
                                                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                            : 'bg-gray-100 text-gray-900 border border-gray-200'
                                                        }`}
                                                >
                                                    <p className="text-sm leading-relaxed">{msg.message}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <p className={`text-xs font-medium ${msg.sender_type === 'AGENT'
                                                            ? 'text-blue-100'
                                                            : msg.sender_type === 'SYSTEM'
                                                                ? 'text-yellow-600'
                                                                : 'text-gray-500'
                                                            }`}>
                                                            {msg.sender_name}
                                                        </p>
                                                        <p className={`text-xs ${msg.sender_type === 'AGENT'
                                                            ? 'text-blue-200'
                                                            : msg.sender_type === 'SYSTEM'
                                                                ? 'text-yellow-500'
                                                                : 'text-gray-400'
                                                            }`}>
                                                            {formatTime(msg.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t bg-gray-50/50">
                                <div className="flex gap-3">
                                    <Textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder={t('type_your_message')}
                                        className="flex-1 min-h-[50px] resize-none border-2 focus:border-blue-300 rounded-xl live-chat-input"
                                        disabled={isLoading}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={isLoading || !message.trim()}
                                        className="self-end bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-6 rounded-xl shadow-sm"
                                        size="lg"
                                    >
                                        {isLoading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <div className="text-center p-8">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <MessageSquare className="h-12 w-12 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{t('select_chat_to_start')}</h3>
                                <p className="text-gray-600 max-w-sm">{t('choose_chat_from_list')}</p>
                                <div className="mt-6 text-sm text-gray-500">
                                    <p>{t('real_time_messaging_ready')}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}