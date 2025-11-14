import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    Search,
    LogOut,
    NetworkIcon,
    Tablet,
    Download
} from 'lucide-react';
import Select from '@/components/misc/Select';
import Pagination from '@/components/Pagination';
import NoRecordFound from '@/components/NoRecordFound';
import Loader from '@/components/Loader';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { getUsers } from '@/stores/features/ajaxFeature';
import axiosMerchant from '@/axios';
import ExportDialog from '@/components/misc/ExportDialog';
import moment from '@/utils/moment';
import { DateTimeRangePicker } from '@/components/misc/DateTimeRangePicker';

const SessionsManagement = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [terminatingSessions, setTerminatingSessions] = useState({});
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
        status: 'active',
        search: ''
    });

    const users = useSelector(state => state.ajax.users);
    const dispatch = useDispatch();

    // Status options for filter
    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
    ];

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                from: filters.from ? `${filters.from} ${filters.from_time}` : '',
                to: filters.to ? `${filters.to} ${filters.to_time}` : ''
            };

            const response = await axiosMerchant.get(`sessions?page=${currentPage}&per_page=${itemsPerPage}`, { params });
            if (response.data.success) {
                setSessions(response.data.data.data);
                setLinks(response.data.data.links);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            toast.error(t('Error fetching sessions'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!users) dispatch(getUsers());
        fetchSessions();
    }, [currentPage, filters, itemsPerPage]);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleFilterChange = (key, selectedOption) => {
        setFilters(prev => ({
            ...prev,
            [key]: selectedOption ? selectedOption.value : ''
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
            status: 'active',
            search: ''
        });
        setCurrentPage(1);
        fetchSessions();
    };

    const handleEndSession = async (sessionId) => {
        try {
            setTerminatingSessions(prev => ({ ...prev, [sessionId]: true }));
            const response = await axiosMerchant.post(`sessions/destroy/${sessionId}`);
            if (response.data.message) {
                toast.success(t(response.data.message));
                fetchSessions();
            }
        } catch (error) {
            console.error('Error terminating session:', error);
            toast.error(t(error.response?.data?.message || 'Error terminating session'));
        } finally {
            setTerminatingSessions(prev => ({ ...prev, [sessionId]: false }));
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const isSessionActive = (session) => {
        return session.is_active;
    };
    const handleDateRangeChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">{t('Sessions Management')}</h1>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>{t('Filter Sessions')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        {/* Date From */}
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
                                    label: user.name
                                })) || []}
                                value={users?.map((user) => ({
                                    value: user.id,
                                    label: user.name
                                })).find(option => option.value === filters.user) || null}
                                onChange={(selectedOption) => handleFilterChange('user', selectedOption)}
                                placeholder={t('Select User')}
                                isClearable={true}
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="input-container">
                            <Label>{t('Status')}</Label>
                            <Select
                                options={statusOptions}
                                value={statusOptions.find(option => option.value === filters.status) || null}
                                onChange={(selectedOption) => handleFilterChange('status', selectedOption)}
                                placeholder={t('Select Status')}
                                isClearable={true}
                            />
                        </div>

                        {/* Search */}
                        <div className="input-container">
                            <label>{t('Search')}</label>
                            <Input
                                placeholder={t('Search sessions...')}
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                icon={<Search className="w-4 h-4" />}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                            <Button
                                variant="refresh"
                                onClick={handleRefresh}
                                title={t('Reset Filters')}
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </Button>
                            <Button variant="download"
                                onClick={() => setShowExport(true)}
                                title={t('Export')}
                            >
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sessions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('Active Sessions')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center p-4">
                            <Loader />
                        </div>
                    ) : sessions.length > 0 ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead isFixed>{t('User')}</TableHead>
                                        <TableHead>{t('Session Start')}</TableHead>
                                        <TableHead>{t('Last Activity')}</TableHead>
                                        <TableHead>{t('Device Info')}</TableHead>
                                        <TableHead>{t('IP Address')}</TableHead>
                                        <TableHead>{t('Status')}</TableHead>
                                        <TableHead>{t('Actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.map((session) => (
                                        <TableRow
                                            key={session.id}
                                            className={!isSessionActive(session) ? 'opacity-60' : ''}
                                        >
                                            <TableCell isFixed>{session.authenticatable?.name}</TableCell>
                                            <TableCell>{formatDate(session.created_at)}</TableCell>
                                            <TableCell>{formatDate(session.updated_at)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Tablet className="w-4 h-4" />
                                                    {session.user_agent}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <NetworkIcon className="w-4 h-4" />
                                                    {session.ip_address}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={isSessionActive(session) ? 'success' : 'secondary'}
                                                >
                                                    {isSessionActive(session) ? t('Active') : t('Inactive')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleEndSession(session.id)}
                                                    disabled={!isSessionActive(session) || terminatingSessions[session.id]}
                                                >
                                                    {terminatingSessions[session.id] ? (
                                                        <Loader className="w-4 h-4 mr-1" />
                                                    ) : (
                                                        <LogOut className="w-4 h-4 mr-1" />
                                                    )}
                                                    {terminatingSessions[session.id] ? t('Ending...') : t('End Session')}
                                                </Button>
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

            {showExport && (
                <ExportDialog
                    model="sessions"
                    endpoint="sessions/export"
                    fields={[
                        { key: "id", label: "ID" },
                        { key: "authenticatable.name", label: "User Name" },
                        { key: "ip_address", label: "IP Address" },
                        { key: "user_agent", label: "Device Info" },
                        { key: "created_at", label: "Session Start" },
                        { key: "updated_at", label: "Last Activity" },
                        { key: "is_active", label: "Status" }
                    ]}
                    onClose={() => setShowExport(false)}
                />
            )}
        </div>
    );
};

export default SessionsManagement;
