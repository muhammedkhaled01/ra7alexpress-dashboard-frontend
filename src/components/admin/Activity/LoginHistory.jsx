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
    Container
} from 'lucide-react';
import Select from '@/components/misc/Select';
import Pagination from '@/components/Pagination';
import NoRecordFound from '@/components/NoRecordFound';
import Loader from '@/components/Loader';
import { useNavigate } from 'react-router-dom';
import { can } from '@/utils/helpers';
import { useDispatch, useSelector } from 'react-redux';
import { getUsers } from '@/stores/features/ajaxFeature';
import axiosMerchant from '@/axios';
import ExportDialog from '@/components/misc/ExportDialog';
import moment from '@/utils/moment';
import { DateTimeRangePicker } from '@/components/misc/DateTimeRangePicker';

export default function LoginHistory() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [loginHistory, setLoginHistory] = useState([]);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [showExport, setShowExport] = useState(false);
    const [stats, setStats] = useState({
        total_logins: 0,
        failed_logins: 0,
        success_rate: 0
    });
    const today = moment().format('YYYY-MM-DD');
    const [filters, setFilters] = useState({
        from: today,
        to: today,
        from_time: "00:00",
        to_time: "23:59",
        user: '',
        status: '',
        search: ''
    });
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const users = useSelector(state => state.ajax.users);
    const dispatch = useDispatch();

    // Login Status options
    const statusOptions = [
        { value: '', label: t('All Statuses') },
        { value: 'success', label: t('Success') },
        { value: 'failed', label: t('Failed') }
    ];

    const fetchLoginHistory = async () => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                page: currentPage,
                from: filters.from ? `${filters.from} ${filters.from_time}` : '',
                to: filters.to ? `${filters.to} ${filters.to_time}` : '',
                per_page: itemsPerPage
            };

            const response = await axiosMerchant.get('login_histories', { params });
            if (response.data.success) {
                setLoginHistory(response.data.data.histories.data);
                setLinks(response.data.data.histories.links);
                setStats(response.data.data.stats);
            }
        } catch (error) {
            console.error('Error fetching login history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!users) dispatch(getUsers());
        fetchLoginHistory();
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
            status: '',
            search: ''
        });
        setCurrentPage(1);
        fetchLoginHistory();
    };
    const handleDateRangeChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const navigate = useNavigate();
    const canAccess = can("Login History access");

    if (!canAccess) {
        return navigate("/unauthorized");
    }

    return (
        <div className='p-4'>
            <h1 className='text-2xl font-bold mb-6'>{t('Login History')}</h1>

            {/* Login Statistics */}
            <Card className='mb-6'>
                <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-4 text-center py-6'>
                    <div>
                        <h3 className='text-lg font-semibold'>{t('Total Logins')}</h3>
                        <p className='text-2xl'>{stats.total_logins}</p>
                    </div>
                    <div>
                        <h3 className='text-lg font-semibold text-red-500'>{t('Failed Attempts')}</h3>
                        <p className='text-2xl text-red-500'>{stats.failed_logins}</p>
                    </div>
                    <div>
                        <h3 className='text-lg font-semibold text-green-500'>{t('Success Rate')}</h3>
                        <p className='text-2xl text-green-500'>{stats.success_rate}%</p>
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <Card className='mb-6'>
                <CardHeader>
                    <CardTitle>{t('Filter Login History')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-5 gap-4 items-end'>
                        <div className='input-container'>
                            <Label>{t('Date')}</Label>
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
                        <div className='input-container'>
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
                                onChange={(selectedOption) => handleFilterChange('user', selectedOption?.value || '')}
                                placeholder={t('Select User')}
                                isClearable={true}
                            />
                        </div>

                        {/* Login Status Filter */}
                        <div className='input-container'>
                            <Label>{t('Login Status')}</Label>
                            <Select
                                options={statusOptions}
                                value={statusOptions.find(option => option.value === filters.status) || null}
                                onChange={(selectedOption) => handleFilterChange('status', selectedOption?.value || '')}
                                placeholder={t('Select Status')}
                                isClearable={true}
                            />
                        </div>

                        {/* Search */}
                        <div className='input-container'>
                            <label>{t('Search')}</label>
                            <Input
                                placeholder={t('Search logs...')}
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                icon={<Search className='w-4 h-4' />}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className='flex gap-2 mt-4'>
                            <Button
                                type="button"
                                onClick={() => setShowExport(true)}
                                title={t('Export Logs')} variant="export"
                            >
                                <Container className="w-4 h-4" />
                            </Button>
                            <Button
                                variant='refresh'
                                onClick={handleRefresh}
                                title={t('Reset Filters')}
                            >
                                <RefreshCcw className='w-4 h-4' />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Login History Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('Login History Details')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className='text-center p-4'>
                            <Loader />
                        </div>
                    ) : loginHistory.length > 0 ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('Timestamp')}</TableHead>
                                        <TableHead isFixed>{t('User')}</TableHead>
                                        <TableHead>{t('Email')}</TableHead>
                                        <TableHead>{t('Status')}</TableHead>
                                        <TableHead>{t('IP Address')}</TableHead>
                                        <TableHead>{t('Device Info')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loginHistory.map((log) => (
                                        <TableRow
                                            key={log.id}
                                            className={!log.status ? 'bg-red-50 dark:bg-red-900/5' : 'bg-green-50 dark:bg-green-900/5'}
                                        >
                                            <TableCell>{formatDate(log.created_at)}</TableCell>
                                            <TableCell isFixed>{log.user?.name}</TableCell>
                                            <TableCell>{log.email}</TableCell>
                                            <TableCell>
                                                <span className={`
                                                    px-2 py-1 rounded text-xs font-medium
                                                    ${!log.status
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'}
                                                    transition-colors duration-200 ease-in-out
                                                `}>
                                                    {log.status ? t('Success') : t('Failed')}
                                                </span>
                                            </TableCell>
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
                    model="login_histories"
                    endpoint="login_histories/export"
                    fields={[
                        { key: 'id', label: 'ID' },
                        { key: 'user.name', label: 'User' },
                        { key: 'email', label: 'Email' },
                        { key: 'status', label: 'Status' },
                        { key: 'ip_address', label: 'IP Address' },
                        { key: 'user_agent', label: 'Device Info' },
                        { key: 'created_at', label: 'Timestamp' },
                        { key: 'updated_at', label: 'Last Updated' }
                    ]}
                    onClose={() => setShowExport(false)}
                />
            )}
        </div>
    );
}
