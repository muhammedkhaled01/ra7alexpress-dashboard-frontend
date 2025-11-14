import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, RefreshCcw } from 'lucide-react';
import axios from '@/axios';
import { toast } from 'react-toastify';
import CreateScheduledAction from './Create';
import EditScheduledAction from './Edit';
import Loader from '@/components/Loader';
import DeleteAlert from '@/components/misc/DeleteAlert';

export default function ScheduledActions() {
    const { t } = useTranslation();
    // State Management
    const [scheduledActions, setScheduledActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [currentAction, setCurrentAction] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [refreshBtn, setRefreshBtn] = useState(false);

    const resetCurrentAction = () => {
        setCurrentAction(null);
    };

    // Fetch scheduled actions from API
    useEffect(() => {
        fetchScheduledActions();
    }, []);

    const fetchScheduledActions = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/scheduled-actions');
            const paginatedData = response.data.data;
            setScheduledActions(paginatedData.data || []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch scheduled actions');
            toast.error('Failed to fetch scheduled actions');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAction = async (payloadFromChild) => {
        try {
            const response = await axios.post('/scheduled-actions', payloadFromChild);
            await fetchScheduledActions();
            return response.data;
        } catch (err) {
            setLoading(false);
            toast.error('Failed to create scheduled action');
            throw err;
        } finally {
            setLoading(false);
        }
    };
    const handleEditAction = (action) => {
        setCurrentAction(action);
        setIsActionModalOpen(true);
    };

    const handleUpdateAction = async (formData) => {
        try {
            setLoading(true);
            const response = await axios.put(`/scheduled-actions`, {
                id: currentAction.id,
                action_name: formData.action_name,
                schedule_display: formData.schedule_display,
                cron_expression: formData.cron_expression,
                action_type: formData.action_type,
                action_display: formData.action_display,
                status: formData.status
            });
            toast.success(t('Scheduled action updated successfully'));
            fetchScheduledActions();
            setIsActionModalOpen(false);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update scheduled action');
            toast.error(err.response?.data?.message || 'Failed to update scheduled action');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAction = async (actionId) => {
        setSelectedRecord({ id: actionId });
        setDeleteAlert(true);
    };

    const handleDeleteConfirm = async () => {
        fetchScheduledActions();
        setSelectedRecord(null);
    };
    return (
        <div className="p-4">
            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{t('Scheduled Actions')}</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => {
                                    resetCurrentAction();
                                    setIsActionModalOpen(true);
                                }}
                                title={t('Create New Scheduled Action')}
                            >
                                <PlusCircle className="mr-2" /> {t('Create Action')}
                            </Button>
                            <Button type="button" variant="refresh" onClick={() => {
                                setRefreshBtn(true);
                                fetchScheduledActions();
                            }}>
                                <RefreshCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead isFixed>{t('Action Name')}</TableHead>
                                <TableHead>{t('Schedule')}</TableHead>
                                <TableHead>{t('Action')}</TableHead>
                                <TableHead>{t('Last Run')}</TableHead>
                                <TableHead>{t('Status')}</TableHead>
                                <TableHead>{t('Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">
                                        <Loader />
                                    </TableCell>
                                </TableRow>
                            ) : scheduledActions.map(action => (
                                <TableRow key={action.id}>
                                    <TableCell isFixed>{action.action_name}</TableCell>
                                    <TableCell>{action.schedule_display}</TableCell>
                                    <TableCell>{action.action_display}</TableCell>
                                    <TableCell>{action.last_run_at}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={action.status === 'active' ? 'success' : 'secondary'} className="capitalize"
                                        >
                                            {t(action.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleEditAction(action)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => handleDeleteAction(action.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Dialog open={isActionModalOpen} onOpenChange={() => setIsActionModalOpen(false)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {currentAction ? t('Edit Scheduled Action') : t('Create New Scheduled Action')}
                        </DialogTitle>
                    </DialogHeader>
                    {currentAction ? (
                        <EditScheduledAction
                            action={currentAction}
                            onClose={() => {
                                setIsActionModalOpen(false);
                                resetCurrentAction();
                            }}
                            onUpdate={handleUpdateAction}
                        />
                    ) : (
                        <CreateScheduledAction
                            onClose={() => {
                                setIsActionModalOpen(false);
                                resetCurrentAction();
                            }}
                            onSubmit={handleCreateAction}
                        />
                    )}
                </DialogContent>
            </Dialog>
            {deleteAlert && (
                <DeleteAlert
                    onSubmitSuccess={handleDeleteConfirm}
                    record={selectedRecord}
                    onClose={() => {
                        setDeleteAlert(false);
                        setSelectedRecord(null);
                    }}
                    api="scheduled-actions/delete"
                />
            )}
        </div>
    );
}
