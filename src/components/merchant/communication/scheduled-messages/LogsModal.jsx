import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import PropTypes from 'prop-types';
import axios from '@/axios';
import { useState, useEffect } from 'react';
import Loader from '@/components/Loader';
import RequiredField from '@/components/misc/RequiredField';

const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
        case 'delivered':
            return { label: 'Delivered', variant: 'success' };
        case 'failed':
            return { label: 'Failed', variant: 'destructive' };
        default:
            return { label: status, variant: 'default' };
    }
};

const LogsModal = ({ open, onClose, messageId, t }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && messageId) {
            fetchLogs();
        }
    }, [open, messageId]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/messages/logs/${messageId}`);
            setLogs(response.data.data);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('Delivery Logs')}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Recipient')} <RequiredField /></TableHead>
                                <TableHead>{t('Channel')} <RequiredField /></TableHead>
                                <TableHead>{t('Status')} <RequiredField /></TableHead>
                                <TableHead>{t('Time')} <RequiredField /></TableHead>
                                <TableHead>{t('Details')} <RequiredField /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        <Loader />
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading && logs.length > 0 && logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>{log.recipient}</TableCell>
                                    <TableCell>{log.channel}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadge(log.status).variant}>
                                            {getStatusBadge(log.status).label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                    <TableCell>{log.details || '-'}</TableCell>
                                </TableRow>
                            ))}
                            {!loading && logs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        {t('No logs available')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>{t('Close')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

LogsModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    messageId: PropTypes.string,
    t: PropTypes.func.isRequired
};

export default LogsModal;
