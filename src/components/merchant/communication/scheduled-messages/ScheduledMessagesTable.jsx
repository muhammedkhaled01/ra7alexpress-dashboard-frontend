import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, FileText, EditIcon, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropTypes from 'prop-types';
import Loader from '@/components/Loader';

const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
        case 'scheduled':
            return { label: 'Scheduled', variant: 'default' };
        case 'sent':
            return { label: 'Sent', variant: 'success' };
        case 'cancelled':
            return { label: 'Cancelled', variant: 'destructive' };
        default:
            return { label: 'Unknown', variant: 'default' };
    }
};

const ScheduledMessagesTable = ({ messages, onEdit, onDelete, onLogs, t, loading }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('Message Title')}</TableHead>
                    <TableHead>{t('Recipient Type')}</TableHead>
                    <TableHead>{t('Channel')}</TableHead>
                    <TableHead>{t('Scheduled Time')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">
                            <Loader />
                        </TableCell>
                    </TableRow>
                )}
                {!loading &&
                    messages.map((message) => {
                        const status = getStatusBadge(message.status);
                        return (
                            <TableRow key={message.id}>
                                <TableCell>{message.message_title}</TableCell>
                                <TableCell>{message.recipients.map((recipient, i) => (
                                    <Badge key={i}>{recipient}</Badge>
                                ))}</TableCell>
                                <TableCell>{message.channel}</TableCell>
                                <TableCell>{new Date(message.schedule_time).toLocaleString()}</TableCell>
                                <TableCell>
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onLogs(message)}
                                        >
                                            <FileText className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(message)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete(message.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })
                }
            </TableBody>
        </Table>
    );
};

ScheduledMessagesTable.propTypes = {
    messages: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            recipient_type: PropTypes.string.isRequired,
            channel: PropTypes.string.isRequired,
            schedule_time: PropTypes.string.isRequired,
            status: PropTypes.string.isRequired
        })
    ).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onLogs: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
};

export default ScheduledMessagesTable;
