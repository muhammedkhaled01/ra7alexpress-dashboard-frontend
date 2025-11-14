import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ExportDialog from '@/components/misc/ExportDialog';
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
import {
    RefreshCcw,
    Container,
    Search
} from 'lucide-react';
import Select from '@/components/misc/Select';
import Pagination from '@/components/Pagination';
import NoRecordFound from '@/components/NoRecordFound';
import Loader from '@/components/Loader';
import axiosMerchant from '@/axios';
import { useDispatch, useSelector } from 'react-redux';
import { humanizeText } from '@/utils/helpers';
import { getUsers } from '@/stores/features/ajaxFeature';
import moment from '@/utils/moment';
import { DateTimeRangePicker } from '@/components/misc/DateTimeRangePicker';

const ActivityLogs = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [activityLogs, setActivityLogs] = useState([]);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [showExport, setShowExport] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    // Filters
    const today = moment().format('YYYY-MM-DD');
    const [filters, setFilters] = useState({
        from: today,
        to: today,
        from_time: "00:00",
        to_time: "23:59",
        user: '',
        action: '',
        search: ''
    });

    const users = useSelector(state => state.ajax.users);
    const dispatch = useDispatch();

    const actionOptions = [
        { value: '', label: 'All Actions' },
        { value: 'shipment_created', label: 'Shipment Created' },
        { value: 'shipment_updated', label: 'Shipment Updated' },
        { value: 'shipment_assigned', label: 'Shipment Assigned' },
        { value: 'shipment_confirmed', label: 'Shipment Confirmed' },
        { value: 'shipment_delivered', label: 'Shipment Delivered' },
        { value: 'shipment_status_changed', label: 'Shipment Status Changed' }
    ];

    const fetchActivityLogs = async () => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                from: filters.from ? `${filters.from} ${filters.from_time}` : '',
                to: filters.to ? `${filters.to} ${filters.to_time}` : ''
            };

            const response = await axiosMerchant.get(`activity_logs?page=${currentPage}&per_page=${itemsPerPage}`, { params });
            if (response.data.success) {
                setActivityLogs(response.data.data.data);
                setLinks(response.data.data.links);
            }
        } catch (error) {
            console.error('Error fetching activity logs:', error);
        } finally {
            setLoading(false);
        }
    };
    const handleDateRangeChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

    useEffect(() => {
        if (!users) dispatch(getUsers());
        fetchActivityLogs();
    }, [currentPage, filters, itemsPerPage]);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1);
    };

    const handleRefresh = () => {
        setFilters({
            from: today,
            to: today,
            from_time: "00:00",
            to_time: "23:59",
            user: '',
            action: '',
            search: ''
        });
        setCurrentPage(1);
        fetchActivityLogs();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">{t('Activity Logs')}</h1>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>{t('Filter Logs')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="input-container">
                            <Label>{t('Date From')}</Label>
                            <DateTimeRangePicker
                                filters={{
                                    from: filters.from,
                                    to: filters.to,
                                    from_time: filters.from_time,
                                    to_time: filters.to_time,
                                }}
                                onChange={handleDateRangeChange}
                                t={t}
                            />
                        </div>
                        <div className="input-container">
                            <label className="text-sm text-gray-600 dark:text-gray-300">
                                {t("Show")}
                            </label>
                            <Select
                                value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
                                onChange={(selectedOption) => {
                                    setItemsPerPage(Number(selectedOption.value));
                                }}
                                options={[
                                    { value: 5, label: '5' },
                                    { value: 8, label: '8' },
                                    { value: 15, label: '15' },
                                    { value: 25, label: '25' },
                                    { value: 50, label: '50' },
                                    { value: 100, label: '100' }
                                ]}
                                className="w-20 text-sm"
                                isSearchable={false}
                            />
                        </div>

                        {/* User Filter */}
                        <div className="input-container">
                            <Label>{t('User')}</Label>
                            <Select
                                options={users?.map((user) => ({
                                    value: user.id,
                                    label: `${user.name}`
                                })) || []}
                                value={filters.user ? {
                                    value: filters.user,
                                    label: users?.find(u => u.id === filters.user)?.name || ''
                                } : null}
                                onChange={(selectedOption) => handleFilterChange('user', selectedOption?.value || '')}
                                placeholder={t('Select User')}
                                isClearable={true}
                            />
                        </div>

                        {/* Action Filter */}
                        <div className="input-container">
                            <Label>{t('Action')}</Label>
                            <Select
                                options={actionOptions}
                                value={filters.action ? actionOptions.find(option => option.value === filters.action) : null}
                                onChange={(selectedOption) => handleFilterChange('action', selectedOption?.value || '')}
                                placeholder={t('Select Action...')}
                                isClearable={true}
                            />
                        </div>
                        {/* Search */}
                        <div className="input-container">
                            <label>{t('Search')}</label>
                            <Input
                                placeholder={t('Search By Description...')}
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                icon={<Search className="w-4 h-4" />}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                            <Button
                                type="button"
                                onClick={() => setShowExport(true)}
                                title={t('Export Logs')} variant="export"
                            >
                                <Container className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="refresh"
                                onClick={handleRefresh}
                                title={t('Reset Filters')}
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Activity Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('Activity Log Details')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center p-4">
                            <Loader />
                        </div>
                    ) : activityLogs.length > 0 ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('Timestamp')}</TableHead>
                                        <TableHead isFixed>{t('User')}</TableHead>
                                        <TableHead>{t('Action')}</TableHead>
                                        <TableHead>{t('Description')}</TableHead>
                                        <TableHead>{t('IP Address')}</TableHead>
                                        <TableHead>{t('User Agent')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activityLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{formatDate(log.created_at)}</TableCell>
                                            <TableCell isFixed>{log.user?.name}</TableCell>
                                            <TableCell>{humanizeText(log.action)}</TableCell>
                                            <TableCell>{log.description}</TableCell>
                                            <TableCell>{log.ip_address}</TableCell>
                                            <TableCell className="max-w-xs truncate" title={log.user_agent}>
                                                {log.user_agent}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Pagination
                                links={links}
                                currentPage={currentPage}
                                onPageChange={handlePageChange}
                            />
                        </>
                    ) : (
                        <NoRecordFound />
                    )}
                </CardContent>
            </Card>

            {/* Export Dialog */}
            {showExport && (
                <ExportDialog
                    model="activity_logs"
                    endpoint="activity_logs/export"
                    fields={[
                        { key: 'created_at', label: 'Timestamp' },
                        { key: 'user.name', label: 'User' },
                        { key: 'action', label: 'Action' },
                        { key: 'description', label: 'Description' },
                        { key: 'ip_address', label: 'IP Address' },
                        { key: 'user_agent', label: 'User Agent' }
                    ]}
                    // filters={[
                    //     {
                    //         key: 'from',
                    //         label: 'From Date',
                    //         type: 'date'
                    //     },
                    //     {
                    //         key: 'to',
                    //         label: 'To Date',
                    //         type: 'date'
                    //     },
                    //     {
                    //         key: 'user',
                    //         label: 'User',
                    //         type: 'select',
                    //         options: users.slice(1)
                    //     },
                    //     {
                    //         key: 'action',
                    //         label: 'Action',
                    //         type: 'select',
                    //         options: actionOptions.slice(1)
                    //     }
                    // ]}
                    onClose={() => setShowExport(false)}
                />
            )}
        </div>
    );
};

export default ActivityLogs;
