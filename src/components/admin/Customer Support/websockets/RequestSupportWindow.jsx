import { useState, useEffect, useRef } from 'react';
import {
    MessageSquare, Send, ChevronUp, Download, FileText,
    Image as ImageIcon, Calendar, CreditCard, Ticket, Package
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { useSelector } from "react-redux";
import { formatCurrentCurrency } from '@/utils/helpers';
import { useLanguage } from '@/contexts/LanguageProvider';

export default function RequestSupportWindow({
    messages,
    onSendMessage,
    isLoading,
    isLoadingOldMessages,
    hasMoreMessages,
    onLoadOlderMessages,
    messagesEndRef,
    selectedSession
}) {
    const { t } = useTranslation();
    const user = useSelector((state) => state.auth.user);
    const [message, setMessage] = useState('');
    const scrollAreaRef = useRef(null);
    const { currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting)
    const { language } = useLanguage();

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    // Corrected logic to determine if the message is from the merchant
    const isMerchantMessage = (msg) => msg.sender_type === 'MERCHANT';

    const renderAttachment = (attachment, index) => {
        const isImage = attachment.mime_type?.startsWith('image/') ||
            attachment.path?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const fileName = attachment.original_name;
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

    const renderRequestCard = (request, index) => {
        try {
            const messageData = JSON.parse(request.message);
            if (messageData.type && messageData.data) {
                const cardColor = isMerchantMessage(request) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-800';
                const iconColor = isMerchantMessage(request) ? 'text-blue-600' : 'text-gray-600';

                return (
                    <div key={index}
                        className={`max-w-[100%] ${cardColor} border rounded-lg p-4 mb-3`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {messageData.type === 'pickup_request' && <Calendar className={`h-4 w-4 ${iconColor}`} />}
                                {messageData.type === 'settlement_request' && <CreditCard className={`h-4 w-4 ${iconColor}`} />}
                                {messageData.type === 'waybill_request' && <Ticket className={`h-4 w-4 ${iconColor}`} />}
                                <span className="font-medium text-sm capitalize">
                                    {messageData.type.replace('_', ' ')}
                                </span>
                            </div>
                            <Badge variant={
                                messageData.data.status === 'pending' ? 'secondary' :
                                    messageData.data.status === 'approved' ? 'success' :
                                        messageData.data.status === 'rejected' ? 'destructive' : 'default'
                            }>
                                {t(messageData.data.status)}
                            </Badge>
                        </div>

                        {messageData.type === 'pickup_request' && (
                            <div className="text-sm space-y-1">
                                <p>{t('📅 Date:')} {new Date(messageData.data.scheduled_at).toLocaleDateString()}</p>
                                <p>{t('📦 Shipments:')} {messageData.data.shipments_count}</p>
                            </div>
                        )}

                        {messageData.type === 'settlement_request' && (
                            <div className="text-sm">
                                <p>{t(`💰 Amount: ${formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}`)} {messageData.data.amount}</p>
                            </div>
                        )}

                        {messageData.type === 'waybill_request' && (
                            <div className="text-sm">
                                <p>{t('📅 Date:')} {new Date(messageData.data.scheduled_at).toLocaleDateString()}</p>
                                <p>{t('🎫 Waybills:')} {messageData.data.shipments_count}</p>
                            </div>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                            {formatTime(request.created_at)}
                        </p>
                    </div>
                );
            }
        } catch (e) {
            console.error(t('Error parsing request card:'), e);
        }
        return null;
    };

    const handleSendMessage = () => {
        if (!message.trim()) return;
        onSendMessage(message);
        setMessage('');
    };

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, messagesEndRef]);

    return (
        <Card className="flex flex-col h-[calc(100vh-18rem)] border-2 shadow-lg">
            {/* Messages */}
            <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea
                    className="flex-1 messages-scroll"
                    onScrollCapture={(e) => {
                        const { scrollTop } = e.target;
                        if (scrollTop === 0 && hasMoreMessages && selectedSession && !isLoadingOldMessages) {
                            onLoadOlderMessages();
                        }
                    }}
                    ref={scrollAreaRef}
                >
                    <div className="p-4 space-y-4">
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
                                            {t('Loading messages...')}
                                        </>
                                    ) : (
                                        <>
                                            <ChevronUp className="h-3 w-3 mr-1" />
                                            {t('Load older messages')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            msg.message_type === 'CARD' ? (
                                renderRequestCard(msg, index)
                            ) : (
                                <div
                                    key={msg.id || index}
                                    className={`flex ${isMerchantMessage(msg) ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${isMerchantMessage(msg)
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
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
                                            <p className={`text-xs font-medium ${isMerchantMessage(msg)
                                                    ? 'text-blue-100'
                                                    : msg.sender_type === 'SYSTEM'
                                                        ? 'text-yellow-600 dark:text-yellow-300'
                                                        : 'text-gray-500 dark:text-gray-400'
                                                }`}>
                                                {msg.sender_name}
                                            </p>
                                            <p className={`text-xs ${isMerchantMessage(msg)
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
                            )
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex gap-3 items-end">
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder={t('Type your message...')}
                        className="flex-1 min-h-[50px] resize-none border-2 focus:border-blue-300 dark:focus:border-blue-600 rounded-xl"
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
        </Card>
    );
}