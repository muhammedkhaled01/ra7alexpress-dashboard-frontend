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
    Phone,
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

const GuestCustomers = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshBtn, setRefreshBtn] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    // Get today's date for default filter
    const today = moment().format('YYYY-MM-DD');
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

    // Get guest drivers for filter
    const guestDrivers = users?.filter(user =>
        user.roles?.some(role => role.name === 'Guest Driver')
    ) || [];

    const fetchCustomers = useCallback(async (resetPage = false) => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                from: filters.from ? `${filters.from} ${filters.from_time}` : '',
                to: filters.to ? `${filters.to} ${filters.to_time}` : '',
                page: resetPage ? 1 : currentPage,
                per_page: itemsPerPage,
            };

            // This endpoint should return unique customers from guest shipments
            const response = await axiosMerchant.get('guest-drivers-shipments', { params });
            if (response.data.success) {
                // Extract unique customers from shipments
                const shipments = response.data.data?.data || response.data.data || [];
                const uniqueCustomers = [];
                const customerMap = new Map();

                shipments.forEach(shipment => {
                    const customerKey = `${shipment.customer_name}-${shipment.customer_phone}`;
                    if (!customerMap.has(customerKey)) {
                        customerMap.set(customerKey, {
                            id: shipment.id,
                            customer_name: shipment.customer_name,
                            customer_phone: shipment.customer_phone,
                            driver: shipment.driver,
                            location: {
                                governorate: shipment.governorate,
                                state: shipment.state,
                                place: shipment.place,
                                streetAddress: shipment.streetAddress,
                                location_url: shipment.location_url
                            },
                            first_shipment_date: shipment.created_at,
                            total_shipments: 1
                        });
                        uniqueCustomers.push(customerMap.get(customerKey));
                    } else {
                        customerMap.get(customerKey).total_shipments++;
                    }
                });

                setCustomers(uniqueCustomers);

                if (response.data.data?.links) {
                    setLinks(response.data.data.links);
                } else {
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
        if (!users) dispatch(getUsers());
        const timer = setTimeout(() => {
            fetchCustomers(true);
        }, 500);

        return () => clearTimeout(timer);
    }, [filters, fetchCustomers, users, dispatch]);

    useEffect(() => {
        fetchCustomers();
    }, [currentPage, fetchCustomers, itemsPerPage]);

    // Automatically toggle refresh button when search query changes
    useEffect(() => {
        setRefreshBtn(filters.query.trim() !== '');
    }, [filters.query]);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
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
            driver: '',
            query: ''
        });
        setCurrentPage(1);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatPhone = (phone) => {
        if (!phone) return 'N/A';
        // Format phone number nicely
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    };
    const handleDateRangeChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">{t('Guest Customer Leads')}</h1>

            {/* Filters Card */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>{t('Filter Customer Leads')}</CardTitle>
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
                        {/* Search */}
                        <div className="input-container">
                            <label>{t('Search')}</label>
                            <Input
                                placeholder={t('Search customers...')}
                                value={filters.query}
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
                    </div>
                </CardContent>
            </Card>

            {/* Customer Leads Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('Customer Leads from Guest Drivers')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center p-4">
                            <Loader />
                        </div>
                    ) : customers.length > 0 ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">#</TableHead>
                                        <TableHead>{t('Customer Name')}</TableHead>
                                        <TableHead>{t('Phone')}</TableHead>
                                        <TableHead>{t('Location')}</TableHead>
                                        <TableHead>{t('Acquired By')}</TableHead>
                                        <TableHead>{t('Total Shipments')}</TableHead>
                                        <TableHead>{t('First Shipment')}</TableHead>
                                        {/* <TableHead className="text-center">{t('Actions')}</TableHead> */}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.map((customer, index) => (
                                        <TableRow key={customer.id}>
                                            <TableCell>{(currentPage - 1) * 15 + index + 1}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{customer.customer_name || 'N/A'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-mono">{formatPhone(customer.customer_phone)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-48">
                                                    <div className="text-sm font-medium">
                                                        {customer.location?.state?.en_name || customer.location?.governorate?.en_name || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {customer.location?.streetAddress || 'No address'}
                                                    </div>
                                                    {customer.location?.location_url && (
                                                        <a
                                                            href={customer.location.location_url}
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
                                                <div>
                                                    <div className="font-medium text-sm">{customer.driver?.name || 'N/A'}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {customer.driver?.driver?.company_name || 'No Company'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {customer.total_shipments} {customer.total_shipments === 1 ? t('Shipment') : t('Shipments')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-muted-foreground">
                                                    {formatDate(customer.first_shipment_date)}
                                                </div>
                                            </TableCell>
                                            {/* <TableCell className="text-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        // Could implement customer details or call action
                                                        console.log('Contact customer:', customer);
                                                    }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                    {t('Contact')}
                                                </Button>
                                            </TableCell> */}
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

export default GuestCustomers;
