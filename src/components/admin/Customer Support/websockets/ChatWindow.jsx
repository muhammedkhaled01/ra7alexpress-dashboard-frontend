import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Ticket, ChevronUp, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

export default function ChatWindow({
    selectedChat,
    onSendMessage,
    onGenerateTicket,
    onCloseChat,
    onArchiveChat,
    isLoading,
    isGeneratingTicket,
    isLoadingOldMessages,
    hasMoreMessages,
    onLoadOlderMessages
}) {
    const { t } = useTranslation();
    const [message, setMessage] = useState('');
    const [ticketSubject, setTicketSubject] = useState('');
    const [showTicketDialog, setShowTicketDialog] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesStartRef = useRef(null);
    const messagesScrollRef = useRef(null);

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
            'ARCHIVED': { variant: 'show', text: t('archived') },
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

    // Render attachment based on file type
    const renderAttachment = (attachment, index) => {
        const isImage = attachment.mime_type?.startsWith('image/') ||
            attachment.path?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const fileName = attachment.original_name
        const fileUrl = `${attachment.path}`;

        if (isImage) {
            return (
                <div key={index} className="inline-block mr-2 mb-2">
                    <img
                        src={fileUrl}
                        alt={fileName}
                        className="max-w-48 max-h-32 rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-gray-200"
                        onClick={() => window.open(fileUrl, '_blank')}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center truncate max-w-48">
                        {fileName}
                    </p>
                </div>
            );
        } else {
            return (
                <div key={index} className="inline-block mr-2 mb-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 bg-white hover:bg-gray-50"
                        onClick={() => window.open(fileUrl, '_blank')}
                    >
                        <FileText className="w-4 h-4" />
                        <span className="truncate max-w-32">{fileName}</span>
                        <Download className="w-3 h-3" />
                    </Button>
                </div>
            );
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
            onLoadOlderMessages();
        }
    };

    // Handle send message
    const handleSendMessage = async () => {
        if (!message.trim() || !selectedChat) return;

        const success = await onSendMessage(selectedChat.id, message);
        if (success) {
            setMessage('');
        }
    };

    // Handle generate ticket
    const handleGenerateTicket = async () => {
        if (!ticketSubject.trim() || !selectedChat) return;

        const result = await onGenerateTicket(selectedChat.id, ticketSubject);
        if (result) {
            setShowTicketDialog(false);
            setTicketSubject('');
        }
    };
    // console.log("selectedChat", selectedChat);
    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [selectedChat?.messages]);

    if (!selectedChat) {
        return (
            <Card className="md:col-span-2 flex flex-col border-2 shadow-lg">
                <div className="h-full flex items-center justify-center dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center p-8">
                        <div className="w-24 h-24 bg-gradient-to-br dark:from-blue-600 dark:to-indigo-600 from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MessageSquare className="h-12 w-12 dark:text-blue-400 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold dark:text-white text-gray-800 mb-2">
                            {t('select_chat_to_start')}
                        </h3>
                        <p className="dark:text-gray-300 text-gray-600 max-w-sm">
                            {t('choose_chat_from_list')}
                        </p>
                        <div className="mt-6 text-sm dark:text-gray-400 text-gray-500">
                            <p>{t('real_time_messaging_ready')}</p>
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="col-span-2 flex flex-col border-2 shadow-lg">
            <div className="h-[calc(100vh-8rem)] flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div className="flex flex-row flex-wrap space-y-2 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {selectedChat.customer_name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                    {selectedChat.customer_name}
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {selectedChat.customer_email}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                                        {t('Tracking Number')}: {selectedChat.tracking_number}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                                        {t('session')}: {selectedChat.session_id}
                                    </span>
                                    {getStatusBadge(selectedChat.status)}
                                    {getPriorityBadge(selectedChat.priority)}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row gap-2">
                            <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
                                {selectedChat?.ticket ? (
                                    <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded">
                                        {t('ticket')}: {selectedChat.ticket.ticket_number}
                                    </span>
                                ) : (
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="shadow-sm">
                                            <Ticket className="h-4 w-4 mr-2" />
                                            {t('generate_ticket')}
                                        </Button>
                                    </DialogTrigger>
                                )}

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

                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('ticket_generation_note')}
                                        </p>
                                        {!selectedChat?.ticket && (
                                            <Button
                                                onClick={handleGenerateTicket}
                                                disabled={isGeneratingTicket || !ticketSubject.trim()}
                                                className="w-full"
                                            >
                                                {isGeneratingTicket ? t('generating') : t('generate_ticket')}
                                            </Button>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                            {selectedChat?.status !== 'CLOSED' && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onCloseChat(selectedChat.id)}
                                    className="shadow-sm"
                                >
                                    {t('close_chat')}
                                </Button>
                            )}
                            {selectedChat?.status !== 'ARCHIVED' && (
                                <Button
                                    variant="show"
                                    size="sm"
                                    onClick={() => onArchiveChat(selectedChat.id)}
                                    className="shadow-sm"
                                >
                                    {t('archive_chat')}
                                </Button>
                            )}
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
                                        onClick={onLoadOlderMessages}
                                        disabled={isLoadingOldMessages}
                                        className="text-xs"
                                    >
                                        {isLoadingOldMessages ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900 dark:border-gray-100 mr-2"></div>
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
                                            ? msg.isOptimistic
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                            : msg.sender_type === 'SYSTEM'
                                                ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed">{msg.message}</p>

                                        {/* Render attachments */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="mt-3">
                                                {msg.attachments.map((attachment, attachIndex) =>
                                                    renderAttachment(attachment, attachIndex)
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mt-2">
                                            <p className={`text-xs font-medium ${msg.sender_type === 'AGENT'
                                                ? 'text-blue-100'
                                                : msg.sender_type === 'SYSTEM'
                                                    ? 'text-yellow-600 dark:text-yellow-300'
                                                    : 'text-gray-500 dark:text-gray-400'
                                                }`}>
                                                {msg.sender_name}
                                                {/* {msg.isOptimistic && (
                                                    <span className="ml-1 text-blue-200">({t('sending')})</span>
                                                )} */}
                                            </p>&nbsp;{'-'}&nbsp;
                                            <p className={`text-xs ${msg.sender_type === 'AGENT'
                                                ? 'text-blue-200'
                                                : msg.sender_type === 'SYSTEM'
                                                    ? 'text-yellow-500 dark:text-yellow-400'
                                                    : 'text-gray-400 dark:text-gray-500'
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
                <div className="p-4 border-t bg-gray-50/50 dark:bg-gray-800/50">
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
                            className="flex-1 min-h-[50px] resize-none border-2 focus:border-blue-300 dark:focus:border-blue-600 rounded-xl live-chat-input dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            disabled={isLoading || selectedChat.status === 'CLOSED'}
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={isLoading || !message.trim() || selectedChat.status === 'CLOSED'}
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
        </Card>
    );
} 