import { useState, useEffect, useCallback } from 'react';
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
    Download,
    Eye,
    MapPin
} from 'lucide-react';
import Select from '@/components/misc/Select';
import Pagination from '@/components/Pagination';
import NoRecordFound from '@/components/NoRecordFound';
import Loader from '@/components/Loader';
import { Badge } from '@/components/ui/badge';
import axiosMerchant from '@/axios';
import { handleError } from '@/utils/helpers';
import { useSelector, useDispatch } from 'react-redux';
import { getUsers } from '@/stores/features/ajaxFeature';
import moment from 'moment';
import { DateTimeRangePicker } from '@/components/misc/DateTimeRangePicker';

const GuestDriverShipments = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [shipments, setShipments] = useState([]);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshBtn, setRefreshBtn] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const today = moment().format('YYYY-MM-DD');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        from: today,
        to: today,
        from_time: "00:00",
        to_time: "23:59",
        driver: '',
        query: ''
    });

    const users = useSelector(state => state.ajax.users);
    const dispatch = useDispatch();

    const guestDrivers = users?.filter(user =>
        user.roles?.some(role => role.name === 'Guest Driver')
    ) || [];

    const fetchShipments = useCallback(async (resetPage = false) => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                from: filters.from ? `${filters.from} ${filters.from_time}` : '',
                to: filters.to ? `${filters.to} ${filters.to_time}` : '',
                page: resetPage ? 1 : currentPage,
                per_page: itemsPerPage,
            };

            const response = await axiosMerchant.get('guest-drivers-shipments', { params });
            if (response.data.success) {
                if (response.data.data?.data) {
                    setShipments(response.data.data.data || []);
                    setLinks(response.data.data.links || []);
                } else {
                    setShipments(response.data.data);
                    setLinks([]);
                }
            }
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    }, [filters, currentPage, itemsPerPage]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prevFilters => ({ ...prevFilters, query: searchQuery }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (!users) dispatch(getUsers());
        fetchShipments(true);
    }, [filters, fetchShipments, users, dispatch, itemsPerPage]); // <== تم إضافة itemsPerPage هنا

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleFilterChange = (key, value) => {
        if (key === 'query') {
            setSearchQuery(value);
        } else {
            setFilters(prevFilters => ({
                ...prevFilters,
                [key]: value
            }));
        }
        setCurrentPage(1);
    };

    const handleRefresh = () => {
        setFilters({
            from: today,
            to: today,
            from_time: "00:00",
            to_time: "23:59",
            driver: '',
            query: ''
        });
        setSearchQuery('');
        setCurrentPage(1);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
    };

    const getPaymentBadge = (paymentType) => {
        const variants = {
            'cash': 'default',
            'card': 'secondary',
            'cod': 'destructive'
        };
        return (
            <Badge variant={variants[paymentType] || 'outline'}>
                {paymentType?.toUpperCase() || 'N/A'}
            </Badge>
        );
    };

    // تغيير useEffect هنا
    useEffect(() => {
        // إذا تغيرت itemsPerPage، قم بإعادة تعيين الصفحة إلى 1 واستدعي جلب البيانات
        setCurrentPage(1);
        fetchShipments(true);
    }, [itemsPerPage]);

    useEffect(() => {
        // هذا الـ useEffect سيتم استدعاؤه فقط عند تغيير الصفحة
        fetchShipments(false);
    }, [currentPage]);

    // إزالة useEffect المكرر
    // useEffect(() => {
    //    fetchShipments();
    // }, [currentPage, fetchShipments, itemsPerPage]);

    const handleDateRangeChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">{t('Guest Driver Shipments')}</h1>

            {/* Filters Card */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>{t('Filter Shipments')}</CardTitle>
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

                        {/* Driver Filter */}
                        <div className="input-container">
                            <Label>{t('Guest Driver')}</Label>
                            <Select
                                options={guestDrivers.map(driver => ({
                                    value: driver.id,
                                    label: driver.name
                                }))}
                                value={guestDrivers.find(driver => driver.id === filters.driver) ?
                                    { value: filters.driver, label: guestDrivers.find(d => d.id === filters.driver)?.name } : null}
                                onChange={(selectedOption) =>
                                    handleFilterChange('driver', selectedOption?.value || '')
                                }
                                placeholder={t('Select Guest Driver')}
                                isClearable={true}
                            />
                        </div>

                        {/* Search */}
                        <div className="input-container">
                            <label>{t('Search')}</label>
                            <Input
                                placeholder={t('Search shipments...')}
                                value={searchQuery}
                                onChange={(e) => handleFilterChange('query', e.target.value)}
                                icon={
                                    refreshBtn && (
                                        <RefreshCcw className="w-4 h-4 cursor-pointer" onClick={handleRefresh} />
                                    )
                                }
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="refresh"
                                onClick={handleRefresh}
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex items-center space-x-2">
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
                    </div>
                </CardContent>
            </Card>

            {/* Shipments Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('Guest Driver Shipments')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center p-4">
                            <Loader />
                        </div>
                    ) : shipments.length > 0 ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">#</TableHead>
                                        <TableHead>{t('Tracking No')}</TableHead>
                                        <TableHead>{t('Guest Driver')}</TableHead>
                                        <TableHead>{t('Customer')}</TableHead>
                                        <TableHead>{t('Phone')}</TableHead>
                                        <TableHead>{t('Location')}</TableHead>
                                        <TableHead>{t('Payment Type')}</TableHead>
                                        <TableHead>{t('Created At')}</TableHead>
                                        {/* <TableHead className="text-center">{t('Actions')}</TableHead> */}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {shipments.map((shipment, index) => (
                                        <TableRow key={shipment.id}>
                                            <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                            <TableCell>
                                                <span className="font-mono font-medium">
                                                    {shipment.tracking_no || 'N/A'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{shipment.driver?.name || 'N/A'}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {shipment.driver?.driver?.company_name || 'No Company'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{shipment.customer_name || 'N/A'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono">{shipment.customer_phone || 'N/A'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-48">
                                                    <div className="text-sm">
                                                        {shipment.state?.en_name || shipment.governorate?.en_name || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {shipment.streetAddress || 'No address'}
                                                    </div>
                                                    {shipment.location_url && (
                                                        <a
                                                            href={shipment.location_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                                                        >
                                                            <MapPin className="w-3 h-3 mr-1" />
                                                            {t('View Map')}
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getPaymentBadge(shipment.payment_type)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {formatDate(shipment.created_at)}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {links && links.length > 0 && (
                                <Pagination
                                    links={links}
                                    currentPage={currentPage}
                                    onPageChange={handlePageChange}
                                />
                            )}
                        </>
                    ) : (
                        <NoRecordFound />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default GuestDriverShipments;