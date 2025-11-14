import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ExportDialog from '@/components/misc/ExportDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCcw, Container, Search, AlertTriangle } from 'lucide-react';
import Select from '@/components/misc/Select';
import Pagination from '@/components/Pagination';
import NoRecordFound from '@/components/NoRecordFound';
import Loader from '@/components/Loader';
import { useDispatch, useSelector } from 'react-redux';
import { humanizeText } from '@/utils/helpers';
import { getUsers } from '@/stores/features/ajaxFeature';
import axiosMerchant from '@/axios';
import moment from '@/utils/moment';
import { DateTimeRangePicker } from '@/components/misc/DateTimeRangePicker';

const UserActions = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [userActions, setUserActions] = useState([]);
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
        search: '',
        is_suspicious: false
    });

    const users = useSelector(state => state.ajax.users);
    const dispatch = useDispatch();

    const actionOptions = [
        { value: '', label: 'All Actions' },
        { value: 'create_shipment', label: 'Create Shipment' },
        { value: 'update_shipment', label: 'Update Shipment' },
        { value: 'delete_shipment', label: 'Delete Shipment' },
        { value: 'create_user', label: 'Create User' },
        { value: 'update_user', label: 'Update User' },
        { value: 'delete_user', label: 'Delete User' },
        { value: 'login', label: 'Login' },
        { value: 'logout', label: 'Logout' }
    ];

    const fetchUserActions = async () => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                from: filters.from ? `${filters.from} ${filters.from_time}` : '',
                to: filters.to ? `${filters.to} ${filters.to_time}` : ''
            };

            const response = await axiosMerchant.get(`user_actions?page=${currentPage}&per_page=${itemsPerPage}`, { params });
            console.log(response);
            if (response.data.success) {
                setUserActions(response.data.data.data);
                setLinks(response.data.data.links);
            }
        } catch (error) {
            console.error('Error fetching user actions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!users) dispatch(getUsers());
        fetchUserActions();
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
            search: '',
            is_suspicious: false
        });
        setCurrentPage(1);
        fetchUserActions();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };
    const handleDateRangeChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">{t('User Actions')}</h1>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>{t('Filter Actions')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        {/* Date From */}
                        <div className="input-container">
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
                        <div className="input-container">
                            <Label>{t('User')}</Label>
                            <Select
                                options={users?.map((user) => ({
                                    value: user.id,
                                    label: user.name
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

                        {/* Action Type Filter */}
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
                                placeholder={t('Search by details...')}
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                icon={<Search className="w-4 h-4" />}
                            />
                        </div>

                        {/* Action Buttons and Suspicious Toggle */}
                        <div className="flex gap-2 mt-4 items-center">
                            <Button
                                type="button"
                                onClick={() => setShowExport(true)}
                                title={t('Export Actions')}
                                variant="export"
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
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="showSuspicious"
                                    checked={filters.is_suspicious}
                                    onChange={(e) => handleFilterChange('is_suspicious', e.target.checked)}
                                    className="mr-2"
                                />
                                <Label htmlFor="showSuspicious">
                                    {t('Show Suspicious Actions')}
                                </Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* User Actions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('User Action Details')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center p-4">
                            <Loader />
                        </div>
                    ) : userActions.length > 0 ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('Timestamp')}</TableHead>
                                        <TableHead isFixed>{t('User')}</TableHead>
                                        <TableHead>{t('Action Type')}</TableHead>
                                        <TableHead>{t('Details')}</TableHead>
                                        <TableHead>{t('IP Address')}</TableHead>
                                        <TableHead>{t('Device')}</TableHead>
                                        <TableHead>{t('Status')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userActions.map((action) => (
                                        <TableRow
                                            key={action.id}
                                            className={action.is_suspicious ? 'bg-red-50/20 dark:bg-red-900/20' : ''}
                                        >
                                            <TableCell>{formatDate(action.created_at)}</TableCell>
                                            <TableCell isFixed>{action.user?.name}</TableCell>
                                            <TableCell>{humanizeText(action.action_type)}</TableCell>
                                            <TableCell>
                                                {typeof action.details === 'object'
                                                    ? JSON.stringify(action.details)
                                                    : action.details}
                                            </TableCell>
                                            <TableCell>{action.ip_address}</TableCell>
                                            <TableCell>{action.device}</TableCell>
                                            <TableCell>
                                                {action.is_suspicious && (
                                                    <div className="flex items-center text-red-500">
                                                        <AlertTriangle className="w-4 h-4 mr-1" />
                                                        {t('Suspicious')}
                                                    </div>
                                                )}
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
                    model="user_actions"
                    endpoint="user_actions/export"
                    fields={[
                        { key: 'created_at', label: 'Timestamp' },
                        { key: 'user.name', label: 'User' },
                        { key: 'action_type', label: 'Action Type' },
                        { key: 'details', label: 'Details' },
                        { key: 'ip_address', label: 'IP Address' },
                        { key: 'device', label: 'Device' },
                        { key: 'is_suspicious', label: 'Is Suspicious' }
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
                    //         options: users?.slice(1) || []
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

export default UserActions;