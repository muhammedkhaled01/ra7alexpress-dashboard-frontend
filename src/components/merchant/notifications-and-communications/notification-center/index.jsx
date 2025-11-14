import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Select from '@/components/misc/Select';
import { toast } from 'react-hot-toast';
import { Search } from 'lucide-react';
import NotificationsTable from './NotificationsTable';
import NotificationDetailsModal from './NotificationDetailsModal';

export default function NotificationCenter() {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState([]);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        search: ''
    });

    // Mock data for testing
    useEffect(() => {
        setNotifications([
            {
                id: '1',
                title: 'Shipment #123456 is ready for pickup',
                type: 'shipment',
                status: 'unread',
                createdAt: new Date().toISOString(),
                message: 'Your shipment has been processed and is ready for pickup at your local office.'
            },
            {
                id: '2',
                title: 'Invoice #INV-001 is due',
                type: 'billing',
                status: 'unread',
                createdAt: new Date().toISOString(),
                message: 'Your invoice for May 2025 is due within 7 days.'
            },
            {
                id: '3',
                title: 'Support Ticket #123 created',
                type: 'support',
                status: 'read',
                createdAt: new Date().toISOString(),
                message: 'Your support ticket has been created successfully.'
            }
        ]);
    }, []);

    const handleMarkAsRead = (id) => {
        setNotifications(notifications.map(notification => 
            notification.id === id ? { ...notification, status: 'read' } : notification
        ));
        toast.success(t('Notification marked as read'));
    };

    const handleMarkAllAsRead = () => {
        setNotifications(notifications.map(notification => ({ ...notification, status: 'read' })));
        toast.success(t('All notifications marked as read'));
    };

    const filteredNotifications = notifications.filter(notification => {
        const matchesType = !filters.type || notification.type === filters.type;
        const matchesStatus = !filters.status || notification.status === filters.status;
        const matchesSearch = !filters.search || 
            notification.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            notification.message.toLowerCase().includes(filters.search.toLowerCase());
        return matchesType && matchesStatus && matchesSearch;
    });

    return (
        <div className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-2 justify-between md:items-center">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{t('Notifications')}</h1>
                    <Badge variant="destructive">
                        {notifications.filter(n => n.status === 'unread').length}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                    >
                        {t('Mark All as Read')}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder={t('Search notifications...')}
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    leftIcon={<Search className="w-4 h-4" />}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Select
                                    options={[
                                        { value: '', label: t('All Types') },
                                        { value: 'shipment', label: t('Shipment') },
                                        { value: 'billing', label: t('Billing') },
                                        { value: 'support', label: t('Support') }
                                    ]}
                                    value={{ value: filters.type, label: t(filters.type || 'All Types') }}
                                    onChange={(opt) => setFilters(prev => ({ ...prev, type: opt.value }))}
                                />
                                <Select
                                    options={[
                                        { value: '', label: t('All Status') },
                                        { value: 'unread', label: t('Unread') },
                                        { value: 'read', label: t('Read') }
                                    ]}
                                    value={{ value: filters.status, label: t(filters.status || 'All Status') }}
                                    onChange={(opt) => setFilters(prev => ({ ...prev, status: opt.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <NotificationsTable
                        notifications={filteredNotifications}
                        onDetails={(notification) => {
                            setSelectedNotification(notification);
                            setShowDetailsModal(true);
                        }}
                        onMarkAsRead={handleMarkAsRead}
                        t={t}
                    />
                </CardContent>
            </Card>

            <NotificationDetailsModal
                open={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                notification={selectedNotification}
                t={t}
            />
        </div>
    );
}
