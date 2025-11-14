import { MessageSquare, User, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo, memo } from 'react';

// Memoized merchant card component to prevent unnecessary re-renders
const MerchantCard = memo(({ merchant, isSelected, onMerchantSelect, t }) => {
    const formatTime = useCallback((dateString) => {
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
            console.error(t('Error formatting time:'), error);
            return t('Invalid date');
        }
    }, [t]);

    const getStatusBadge = useCallback((status) => {
        const statusMap = {
            'ACTIVE': { variant: 'success', text: t('active') },
            'CLOSED': { variant: 'secondary', text: t('closed') },
            'ARCHIVED': { variant: 'show', text: t('archived') }
        };
        const statusInfo = statusMap[status] || { variant: 'secondary', text: status };
        return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>;
    }, [t]);

    const formatWaybillCount = useCallback((merchant) => {
        const used = merchant.waybills_used || 0;
        const unused = merchant.waybills_unused || 0;
        const total = used + unused;
        const usagePercentage = total > 0 ? Math.round((used / total) * 100) : 0;

        return (
            <div className="flex items-center gap-2">
                <div className="w-16 text-center">
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">{unused}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t("Available")}</div>
                </div>
                <div className="relative w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="absolute left-0 top-0 h-full bg-blue-500"
                        style={{ width: `${usagePercentage}%` }}
                    />
                </div>
                <div className="w-16 text-center">
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{used}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t("Used")}</div>
                </div>
            </div>
        );
    }, [t]);

    return (
        <Card
            className={`p-4 cursor-pointer transition-all duration-200 ${
                isSelected
                    ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
            onClick={() => onMerchantSelect(merchant)}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        {merchant.unread_messages_count > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                {merchant.unread_messages_count > 9 ? '9+' : merchant.unread_messages_count}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {merchant.name}
                            </span>
                            {merchant.status && getStatusBadge(merchant.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {merchant.email}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Package className="h-4 w-4" />
                        <span>{t("Waybills")}</span>
                    </div>
                </div>
                {formatWaybillCount(merchant)}

                {merchant.last_message_time && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(merchant.last_message_time)}
                    </span>
                )}
            </div>

            {merchant.last_message && (
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                    {merchant.last_message}
                </p>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{t('ID')}: {merchant.id}</span>
                {merchant.phone && (
                    <span>{merchant.phone}</span>
                )}
            </div>
        </Card>
    );
});

MerchantCard.displayName = 'MerchantCard';

export default function MerchantList({
                                       merchants,
                                       selectedMerchant,
                                       onMerchantSelect,
                                       activeTab,
                                       onTabChange
                                   }) {
    const { t } = useTranslation();

    // Memoized filtered merchants
    const filteredMerchants = useMemo(() => {
        return activeTab === 'active'
            ? merchants.filter(merchant => merchant.status === 'ACTIVE')
            : merchants;
    }, [merchants, activeTab]);

    // Memoized tab counts
    const tabCounts = useMemo(() => ({
        all: merchants.length,
        active: merchants.filter(c => c.status === 'ACTIVE').length
    }), [merchants]);

    // Memoized merchant select handler
    const handleMerchantSelect = useCallback((merchant) => {
        onMerchantSelect(merchant);
    }, [onMerchantSelect]);

    return (
        <Card className="col-span-1 flex flex-col border-2 shadow-lg">
            <div className="p-4 border-b dark:bg-gray-800/50 bg-gray-50/50">
                <h2 className="text-xl font-bold dark:text-white text-gray-800 mb-4 flex items-center gap-2">
                    <User className="h-6 w-6" />
                    {t('Merchants')}
                </h2>

                <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="all" className="text-sm">
                            {t('All Merchants')} ({tabCounts.all})
                        </TabsTrigger>
                        <TabsTrigger value="active" className="text-sm">
                            {t('Active')} ({tabCounts.active})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-4">
                        <div className="flex items-center gap-2 text-sm dark:text-gray-400 text-gray-600">
                            <MessageSquare className="h-4 w-4" />
                            <span>{t('All Merchants')}</span>
                            <Badge variant="default" className="ml-auto">{tabCounts.all}</Badge>
                        </div>
                    </TabsContent>

                    <TabsContent value="active" className="mt-4">
                        <div className="flex items-center gap-2 text-sm dark:text-gray-400 text-gray-600">
                            <MessageSquare className="h-4 w-4" />
                            <span>{t('Active Chats')}</span>
                            <Badge variant="success" className="ml-auto">
                                {tabCounts.active}
                            </Badge>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="flex-1 overflow-hidden">
                <div className="h-[calc(100vh-18rem)] p-4">
                    <ScrollArea className="h-full">
                        <div className="space-y-3">
                            {filteredMerchants.map(merchant => (
                                <MerchantCard
                                    key={merchant.id}
                                    merchant={merchant}
                                    isSelected={selectedMerchant?.id === merchant.id}
                                    onMerchantSelect={handleMerchantSelect}
                                    t={t}
                                />
                            ))}

                            {filteredMerchants.length === 0 && (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <User className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                    <p className="text-sm">
                                        {activeTab === 'active'
                                            ? t('No active merchants')
                                            : t('No merchants found')}
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