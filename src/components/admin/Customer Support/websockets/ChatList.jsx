import { MessageSquare, User, Clock, Ticket, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { hasRole } from '@/utils/helpers';

export default function ChatList({
    activeChats,
    myChats,
    closedChats,
    selectedChat,
    onChatSelect,
    activeTab,
    onTabChange
}) {

    const { t } = useTranslation();
    const isCustomerService = hasRole('Customer Service');
    const formatTime = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'Invalid date';
        }
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
        const priorityValue = priority || 'MEDIUM';
        const priorityMap = {
            'LOW': { variant: 'secondary', text: t('low') },
            'MEDIUM': { variant: 'default', text: t('medium') },
            'HIGH': { variant: 'warning', text: t('high') },
            'URGENT': { variant: 'destructive', text: t('urgent') }
        };
        const priorityInfo = priorityMap[priorityValue] || { variant: 'secondary', text: priorityValue };
        return <Badge variant={priorityInfo.variant}>{priorityInfo.text}</Badge>;
    };

    const renderChatCard = (chat) => {
        return (
            <Card
                key={chat.id}
                className={`p-4 cursor-pointer chat-card-hover transition-all duration-200 ${selectedChat?.id === chat.id
                    ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                onClick={() => onChatSelect(chat)}
            >
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            {chat.unread_messages_count > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                    {chat.unread_messages_count > 9 ? '9+' : chat.unread_messages_count}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
                                    {chat.customer_name}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {chat.customer_email || t('no_email')}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(chat.status)}
                    </div>
                </div>

                <div className="mb-3">
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                        {chat.initial_message || t('no_initial_message')}
                    </p>
                </div>

                {chat.tracking_number && (
                    <div className="mb-2 flex items-center gap-1 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <Package className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            {t('Tracking Number')}: {chat.tracking_number}
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    {getPriorityBadge(chat.priority || 'MEDIUM')}
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatTime(chat.created_at)}
                    </div>
                </div>

                {chat.ticket_id && (
                    <div className="mt-2 flex items-center gap-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <Ticket className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            {t('linked_to_ticket')}
                        </span>
                    </div>
                )}
            </Card>
        )
    };

    // Determine which chats to display
    const displayedChats = activeTab === 'active'
        ? activeChats
        : activeTab === 'my'
            ? myChats
            : closedChats;

    return (
        <Card className="col-span-1 flex flex-col border-2 shadow-lg">
            <div className="p-4 border-b dark:bg-gray-800/50 bg-gray-50/50">
                <h2 className="text-xl font-bold dark:text-white text-gray-800 mb-4">
                    {t('customer_support_chats')}
                </h2>

                <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                    <TabsList className={`grid w-full grid-cols-${isCustomerService ? 3 : 2}`}>
                        <TabsTrigger value="active" className="text-sm dark:text-gray-300">
                            {t('active')} ({activeChats.length})
                        </TabsTrigger>
                        {isCustomerService && (
                            <TabsTrigger value="my" className="text-sm dark:text-gray-300">
                                {t('my_chats')} ({myChats.length})
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="closed" className="text-sm dark:text-gray-300">
                            {t('closed')} ({closedChats.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="mt-4">
                        <div className="flex items-center gap-2 text-sm dark:text-gray-400 text-gray-600">
                            <MessageSquare className="h-4 w-4 dark:text-gray-400" />
                            <span>{t('active_conversations')}</span>
                            <Badge variant="success" className="ml-auto">{activeChats.length}</Badge>
                        </div>
                    </TabsContent>

                    <TabsContent value="my" className="mt-4">
                        <div className="flex items-center gap-2 text-sm dark:text-gray-400 text-gray-600">
                            <MessageSquare className="h-4 w-4 dark:text-gray-400" />
                            <span>{t('my_chats')}</span>
                            <Badge variant="default" className="ml-auto">{myChats.length}</Badge>
                        </div>
                    </TabsContent>

                    <TabsContent value="closed" className="mt-4">
                        <div className="flex items-center gap-2 text-sm dark:text-gray-400 text-gray-600">
                            <MessageSquare className="h-4 w-4 dark:text-gray-400" />
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
                            {displayedChats.map(renderChatCard)}

                            {displayedChats.length === 0 && (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                    <p className="text-sm">
                                        {activeTab === 'active'
                                            ? t('no_active_chats')
                                            : activeTab === 'my'
                                                ? t('no_my_chats')
                                                : t('no_closed_chats')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </Card>
    );
} 