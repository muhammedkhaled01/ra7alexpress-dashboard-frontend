import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Plus, RefreshCcw } from 'lucide-react';
import axios from '@/axios';
import ScheduledMessagesTable from './ScheduledMessagesTable';
import ScheduleMessageModal from './ScheduleMessageModal';
import LogsModal from './LogsModal';
import DeleteAlert from '@/components/misc/DeleteAlert';

export default function ScheduledMessages() {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [currentMessage, setCurrentMessage] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        channel: '',
        message_body: '',
        recipient_type: '',
        schedule_time: ''
    });
    const [loading, setLoading] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [refreshBtn, setRefreshBtn] = useState(false);

    const fetchMessages = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/messages/scheduled');
            setMessages(response.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to fetch messages'));
        } finally {
            setLoading(false);
        }
    }, [setMessages, setLoading, t]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const url = '/messages/scheduled';
            const method = currentMessage ? 'put' : 'post';
            
            await axios[method](url, {
                message_title: formData.title,
                channel: formData.channel,
                body: formData.message_body,
                recipients: formData.recipient_type.filter(Boolean), // Remove empty strings
                scheduled_at: formData.schedule_time,
                id: currentMessage?.id
            });
            
            toast.success(currentMessage ? t('Message updated successfully') : t('Message scheduled successfully'));
            handleCloseModal();
            await fetchMessages();
        } catch (error) {
            toast.error(error.response?.data?.message || (currentMessage ? t('Failed to update message') : t('Failed to schedule message')));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (message) => {
        setCurrentMessage(message);
        setFormData({
            title: message.message_title,
            channel: message.channel,
            message_body: message.body,
            recipient_type: message.recipients || [],
            schedule_time: message.scheduled_at
        });
        setShowScheduleModal(true);
    };

    const handleDelete = async (messageId) => {
        setSelectedRecord({ id: messageId });
        setDeleteAlert(true);
    };

    const handleCloseModal = () => {
        setShowScheduleModal(false);
        setShowLogsModal(false);
        setCurrentMessage(null);
        setFormData({
            title: '',
            channel: '',
            message_body: '',
            recipient_type: '',
            schedule_time: ''
        });
    };

    const handleDeleteConfirm = async () => {
        setLoading(true);
        await fetchMessages();
        setLoading(false);
    };

    const handleLogs = (message) => {
        setCurrentMessage(message);
        setShowLogsModal(true);
    };

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    return (
        <div className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-2 justify-between md:items-center">
                <h1 className="text-2xl font-bold">{t('Scheduled Messages')}</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setShowScheduleModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('Schedule New Message')}
                    </Button>
                    <Button type="button" variant="refresh" onClick={() => {
                        setRefreshBtn(true);
                        fetchMessages();
                    }}>
                        <RefreshCcw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('Scheduled Messages')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScheduledMessagesTable
                        messages={messages}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onLogs={handleLogs}
                        loading={loading}
                        t={t}
                    />
                </CardContent>
            </Card>

            <ScheduleMessageModal
                open={showScheduleModal}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
                t={t}
                isEdit={currentMessage !== null}
                loading={loading}
            />

            <LogsModal
                open={showLogsModal}
                onClose={handleCloseModal}
                messageId={currentMessage?.id}
                t={t}
            />

            {deleteAlert && (
                <DeleteAlert
                    onSubmitSuccess={handleDeleteConfirm}
                    record={selectedRecord}
                    onClose={() => {
                        setDeleteAlert(false);
                        setSelectedRecord(null);
                    }}
                    api="messages/scheduled/delete"
                />
            )}
        </div>
    );
}
