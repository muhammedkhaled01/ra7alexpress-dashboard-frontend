import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import axios from '@/axios';
import { toast } from 'react-toastify';
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
import CreateTask from './Create';
import EditTask from './Edit';
import Loader from '@/components/Loader';
import DeleteAlert from '@/components/misc/DeleteAlert';

export default function AutomatedTasks() {
    const { t } = useTranslation();
    // State Management
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [refreshBtn, setRefreshBtn] = useState(false);

    // Fetch tasks from API
    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/automated_tasks');
            // Extract the data array from the pagination response
            const paginatedData = response.data.data;
            setTasks(paginatedData.data || []); // Set the actual data array
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch tasks');
            toast.error('Failed to fetch automated tasks');
        } finally {
            setLoading(false);
        }
    };

    // Form Handlers
    const handleCreateTask = async () => {
        fetchTasks();
        setIsCreateModalOpen(false);
    };

    const handleEditTask = (task) => {
        setCurrentTask(task);
        setIsEditModalOpen(true);
    };

    const handleUpdateTask = async () => {
        fetchTasks();
    };

    const handleDeleteTask = async (taskId) => {
        setSelectedRecord({ id: taskId });
        setDeleteAlert(true);
    };

    const handleDeleteConfirm = async () => {
        fetchTasks();
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">{t('Automated Tasks')}</h1>
            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{t('Tasks')}</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                title={t('Create New Task')}
                            >
                                <PlusCircle className="mr-2" /> {t('Create Task')}
                            </Button>
                            <Button type="button" variant="refresh" onClick={() => {
                                setRefreshBtn(true);
                                fetchTasks();
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
                                <TableHead isFixed>{t('Task Name')}</TableHead>
                                <TableHead>{t('trigger')}</TableHead>
                                <TableHead>{t('Action')}</TableHead>
                                <TableHead>{t('Status')}</TableHead>
                                <TableHead>{t('Created At')}</TableHead>
                                <TableHead>{t('Updated At')}</TableHead>
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
                            ) : tasks.map(task => (
                                <TableRow key={task.id}>
                                    <TableCell isFixed>{task.task_name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium">{t('Type')}: {t(task.trigger_type)}</span>
                                            {task.trigger_type === 'event' && (
                                                <>
                                                    <span className="text-sm text-muted-foreground">
                                                        {t('Event')}: {JSON.parse(task.trigger_data).event}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {t('Status')}: {JSON.parse(task.trigger_data).status}
                                                    </span>
                                                </>
                                            )}
                                            {task.trigger_type === 'time' && (
                                                <span className="text-sm text-muted-foreground">
                                                    {t('Schedule')}: {JSON.parse(task.trigger_data).cron}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium">{t('Type')}: {t(task.action_type)}</span>
                                            {task.action_type === 'send_email' && (
                                                <>
                                                    <span className="text-sm text-muted-foreground">
                                                        {t('Template')}: {t(JSON.parse(task.action_data).template)}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {t('Shipment Tracking Number')}: {JSON.parse(task.action_data).shipment_tracking_number}
                                                    </span>
                                                </>
                                            )}
                                            {task.action_type === 'send_sms' && (
                                                <>
                                                    <span className="text-sm text-muted-foreground">
                                                        {t('Phone Number')}: {JSON.parse(task.action_data).phone}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {t('Message')}: {JSON.parse(task.action_data).message}
                                                    </span>
                                                </>
                                            )}
                                            {task.action_type === 'status_update' && (
                                                <>
                                                    <span className="text-sm text-muted-foreground">
                                                        {t('Shipment Tracking Number')}: {JSON.parse(task.action_data).shipment_tracking_number}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {t('New Status')}: {t(JSON.parse(task.action_data).new_status)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={task.status === 'active' ? 'success' : 'outline'} className="capitalize">
                                            {t(task.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(task.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(task.updated_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleEditTask(task)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => handleDeleteTask(task.id)}
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

            {/* Create Task Modal */}
            <CreateTask
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateTask}
            />

            {/* Edit Task Modal */}
            <EditTask
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onUpdate={handleUpdateTask}
                task={currentTask}
            />

            {deleteAlert && (
                <DeleteAlert
                    onSubmitSuccess={handleDeleteConfirm}
                    record={selectedRecord}
                    onClose={() => {
                        setDeleteAlert(false);
                        setSelectedRecord(null);
                    }}
                    api="automated_tasks/delete"
                />
            )}
        </div>
    );
}
