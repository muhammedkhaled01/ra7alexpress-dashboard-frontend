import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Loader2, Plus, Pencil, Trash2, History, MapPin, Clock, RotateCw, User, Phone, Download, Calendar, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import axiosMerchant from '@/axios';
import { handleError, can, dateFormat, formatDecimalValue } from '@/utils/helpers';
import toast from 'react-hot-toast';
import Pagination from '@/components/Pagination';
import Loader from '@/components/Loader';
import PageTitle from '@/components/admin/Layouts/PageTitle';
import NoRecordFound from '@/components/NoRecordFound';
import DeleteAlert from '@/components/misc/DeleteAlert';
import ExportDialog from '@/components/misc/ExportDialog';
import { useGoogleMaps } from '@/contexts/GoogleMapsProvider';
import { useSelector } from 'react-redux';

export default function DriverStatus() {
    const { t } = useTranslation();
    const { isLoaded } = useGoogleMaps();

    // State management
    const [driverStatuses, setDriverStatuses] = useState([]);
    const [filteredStatuses, setFilteredStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const { decimalPrecision } = useSelector((state) => state.setting)
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshBtn, setRefreshBtn] = useState(false);

    // Date filter states
    const [dateRange, setDateRange] = useState({
        from: null,
        to: null
    });
    const [showDateFilter, setShowDateFilter] = useState(false);

    // Dialog states
    const [showDriverDetails, setShowDriverDetails] = useState(false);
    const [showStatusForm, setShowStatusForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);

    const [selectedDriver, setSelectedDriver] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [statusHistory, setStatusHistory] = useState([]);

    // Form state
    const [statusForm, setStatusForm] = useState({
        id: null,
        driver_id: '',
        location: '',
        latitude: '',
        longitude: ''
    });

    // Permission checks
    const accessAbility = can("Driver Status access");
    const createAbility = can("Driver Status create");
    const updateAbility = can("Driver Status update");
    const deleteAbility = can("Driver Status delete");
    const exportAbility = can("Driver Status export");

    // Fetch driver statuses from API
    const fetchDriverStatuses = async (pageNumber = 1) => {
        setLoading(true);
        try {
            const response = await axiosMerchant.get(`driver_statuses?page=${pageNumber}`);
            if (response.data.success) {
                const data = response.data.data;
                setDriverStatuses(data.data || []);
                setLinks(data.links || []);
            }
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    // Search functionality
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm || searchTerm.trim() === "") {
            return;
        }
        setLoading(true);
        setRefreshBtn(true);
        try {
            const response = await axiosMerchant.get(`driver_statuses?search=${searchTerm}`);
            if (response.data.success) {
                setDriverStatuses(response.data.data.data || []);
                setLinks([]);
            }
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    // Refresh functionality
    const handleRefresh = () => {
        setSearchTerm("");
        setRefreshBtn(false);
        setDateRange({ from: null, to: null });
        fetchDriverStatuses(currentPage);
    };

    // Date filter functionality
    const handleDateFilter = (selectedDate) => {
        if (!dateRange.from || (dateRange.from && dateRange.to)) {
            // Starting new range or replacing existing range
            setDateRange({ from: selectedDate, to: null });
        } else {
            // Completing the range
            if (selectedDate < dateRange.from) {
                setDateRange({ from: selectedDate, to: dateRange.from });
            } else {
                setDateRange({ from: dateRange.from, to: selectedDate });
            }
        }
    };

    const clearDateFilter = () => {
        setDateRange({ from: null, to: null });
    };

    // Fetch status history for a specific driver
    const fetchStatusHistory = async (driverId) => {
        try {
            const response = await axiosMerchant.get(`driver_statuses/history/${driverId}`);
            if (response.data.success) {
                setStatusHistory(response.data.data.data || []);
            }
        } catch (error) {
            handleError(error);
        }
    };

    // Create or update driver status
    const handleSaveStatus = async () => {
        // Check permissions before submitting
        if (statusForm.id && !updateAbility) {
            toast.error(t("You don't have permission to update driver status"));
            return;
        }
        if (!statusForm.id && !createAbility) {
            toast.error(t("You don't have permission to create driver status"));
            return;
        }

        try {
            const endpoint = statusForm.id ? 'driver_statuses/update' : 'driver_statuses/store';
            const method = statusForm.id ? 'post' : 'post';

            const payload = {
                ...statusForm,
                last_updated: new Date().toISOString()
            };

            if (statusForm.id) {
                payload.id = statusForm.id;
            }

            const response = await axiosMerchant[method](endpoint, payload);

            if (response.data.success) {
                toast.success(statusForm.id ? "Driver status updated successfully" : "Driver status created successfully");
                setShowStatusForm(false);
                setStatusForm({
                    id: null,
                    driver_id: '',
                    location: '',
                    latitude: '',
                    longitude: ''
                });
                fetchDriverStatuses(currentPage);
            }
        } catch (error) {
            handleError(error);
        }
    };

    // Delete handlers
    const openDeleteAlert = (record) => {
        setSelectedRecord(record);
        setDeleteAlert(true);
    };

    const closeDeleteAlert = () => {
        setSelectedRecord(null);
        setDeleteAlert(false);
    };

    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Initial data fetch
    useEffect(() => {
        fetchDriverStatuses(currentPage);
    }, [currentPage]);

    // Apply filters
    useEffect(() => {
        let result = [...driverStatuses];

        // Apply date filter
        if (dateRange.from && dateRange.to) {
            result = result.filter(status => {
                const statusDate = new Date(status.last_updated || status.updated_at);
                const fromDate = new Date(dateRange.from);
                const toDate = new Date(dateRange.to);
                toDate.setHours(23, 59, 59, 999); // Include the entire end date

                return statusDate >= fromDate && statusDate <= toDate;
            });
        }

        setFilteredStatuses(result);
    }, [driverStatuses, dateRange]);

    // Search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            searchTerm.trim() !== "" ? setRefreshBtn(true) : setRefreshBtn(false);
            if (searchTerm.trim() !== "") {
                handleSearch({ preventDefault: () => { } });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Auto-refresh data every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchDriverStatuses(currentPage);
        }, 30000);

        return () => clearInterval(interval);
    }, [currentPage]);

    // Get marker color for drivers (all same color since no status)
    const getMarkerColor = () => {
        return '#22c55e'; // green for active drivers
    };

    // Handle driver click
    const handleDriverClick = (driver) => {
        setSelectedDriver(driver);
        setShowDriverDetails(true);
    };

    // Handle edit status
    const handleEditStatus = (status) => {
        setStatusForm({
            id: status.id,
            driver_id: status.driver_id,
            location: status.location || '',
            latitude: status.latitude || '',
            longitude: status.longitude || ''
        });
        setShowStatusForm(true);
    };

    // Handle view history
    const handleViewHistory = (driver) => {
        setSelectedDriver(driver);
        fetchStatusHistory(driver.driver_id);
        setShowHistory(true);
    };

    // Handle submit success
    const handleSubmitSuccess = () => {
        fetchDriverStatuses(currentPage);
    };

    return (
        <div>

            <div className="flex flex-wrap gap-3 mt-2 justify-between">
                <PageTitle title={t('Driver Status')} />
                <div className="flex flex-row gap-x-2">
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('Search drivers...')}
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Date Filter with Always Visible Calendar */}
                        <Popover open={showDateFilter} onOpenChange={setShowDateFilter}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="relative">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {dateRange.from && dateRange.to ? (
                                        `${dateFormat(dateRange.from, 'date')} - ${dateFormat(dateRange.to, 'date')}`
                                    ) : (
                                        t('Filter by Date')
                                    )}
                                    {(dateRange.from || dateRange.to) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="ml-2 h-auto p-0 text-muted-foreground hover:text-foreground"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearDateFilter();
                                            }}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <div className="p-4">
                                    <div className="mb-4">
                                        <h4 className="font-medium mb-2">{t('Select Date Range')}</h4>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {dateRange.from && !dateRange.to
                                                ? t('Select end date')
                                                : t('Click dates to select range')
                                            }
                                        </p>
                                        {dateRange.from && dateRange.to && (
                                            <div className="mb-4 p-2 bg-muted rounded">
                                                <p className="text-sm">
                                                    <strong>{t('Selected Range')}:</strong><br />
                                                    {dateFormat(dateRange.from, 'date')} - {dateFormat(dateRange.to, 'date')}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Always Visible Calendar */}
                                    <CalendarComponent
                                        mode="single"
                                        selected={dateRange.from}
                                        onSelect={handleDateFilter}
                                        className="rounded-md border"
                                        disabled={(date) => date > new Date()}
                                    />

                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={clearDateFilter}
                                            className="flex-1"
                                        >
                                            {t('Clear')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => setShowDateFilter(false)}
                                            className="flex-1"
                                            disabled={!dateRange.from || !dateRange.to}
                                        >
                                            {t('Apply Filter')}
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {(refreshBtn || dateRange.from || dateRange.to) && (
                            <Button variant="outline" onClick={handleRefresh}>
                                <RotateCw className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                    {exportAbility && (
                        <Button type="button" variant="download" onClick={() => setShowExport(true)}>
                            <Download className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4">
                {/* Map */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Driver Locations')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] rounded-md overflow-hidden">
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={{ lat: 23.588, lng: 58.3829 }}
                                    zoom={11}
                                >
                                    {filteredStatuses.map((status) => (
                                        status.latitude && status.longitude && (
                                            <Marker
                                                key={status.id}
                                                position={{
                                                    lat: parseFloat(status.latitude),
                                                    lng: parseFloat(status.longitude)
                                                }}
                                                onClick={() => handleDriverClick(status)}
                                                icon={{
                                                    url: `data:image/svg+xml,${encodeURIComponent(
                                                        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${getMarkerColor()}" width="24" height="24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>`
                                                    )}`
                                                }}
                                                title={`${status.driver?.name || 'Unknown Driver'} - ${status.location || 'Unknown Location'}`}
                                            />
                                        )
                                    ))}
                                </GoogleMap>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-muted">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <div className="shadow-md py-4 mt-2 rounded-lg">
                    {loading ? (
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        <Loader />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    ) : driverStatuses && driverStatuses.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">#</TableHead>
                                    <TableHead>{t('Driver')}</TableHead>
                                    <TableHead>{t('Phone')}</TableHead>
                                    <TableHead>{t('Location')}</TableHead>
                                    <TableHead>{t('Last Updated')}</TableHead>
                                    <TableHead className="text-right">{t('Actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStatuses.map((status, index) => (
                                    <TableRow
                                        key={status.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleDriverClick(status)}
                                    >
                                        <TableCell className="font-medium">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <User className="w-4 h-4 mr-2" />
                                                <div>
                                                    <div className="font-medium">{status.driver?.name || 'Unknown Driver'}</div>
                                                    <div className="text-sm text-muted-foreground">{status.driver?.email || ''}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <Phone className="w-4 h-4 mr-2" />
                                                {status.driver?.driver?.phone || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-2" />
                                                {status.location || 'Unknown'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <Clock className="w-4 h-4 mr-2" />
                                                {dateFormat(status.last_updated || status.updated_at, 'datetime')}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                                                {updateAbility && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditStatus(status)}
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewHistory(status)}
                                                >
                                                    <History className="w-3 h-3" />
                                                </Button>
                                                {deleteAbility && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openDeleteAlert(status)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <NoRecordFound />
                    )}

                    {links.length > 0 && (
                        <div className="mt-4">
                            <Pagination
                                links={links}
                                currentPage={currentPage}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Driver Details Dialog */}
            <Dialog open={showDriverDetails} onOpenChange={setShowDriverDetails}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('Driver Details')}</DialogTitle>
                    </DialogHeader>
                    {selectedDriver && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold mb-3">{t('Driver Information')}</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            <span className="font-medium">Name:</span>
                                            <span>{selectedDriver.driver?.name || 'Unknown'}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Email:</span>
                                            <span className="ml-2">{selectedDriver.driver?.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            <span className="font-medium">Phone:</span>
                                            <span>{selectedDriver.driver?.driver?.phone || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Status:</span>
                                            <span className="ml-2">{selectedDriver.driver?.driver?.status || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">ID Card:</span>
                                            <span className="ml-2">{selectedDriver.driver?.driver?.id_card || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-3">{t('Current Location')}</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="font-medium">Location:</span>
                                            <span className="ml-2">{selectedDriver.location || 'Unknown'}</span>
                                        </div>
                                        {selectedDriver.latitude && selectedDriver.longitude && (
                                            <>
                                                <div>
                                                    <span className="font-medium">Latitude:</span>
                                                    <span className="ml-2">{formatDecimalValue(selectedDriver.latitude, decimalPrecision)}</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Longitude:</span>
                                                    <span className="ml-2">{formatDecimalValue(selectedDriver.longitude, decimalPrecision)}</span>
                                                </div>
                                            </>
                                        )}
                                        <div>
                                            <span className="font-medium">Last Updated:</span>
                                            <span className="ml-2">{dateFormat(selectedDriver.last_updated || selectedDriver.updated_at, 'datetime')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Status Form Dialog */}
            <Dialog open={showStatusForm} onOpenChange={setShowStatusForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{statusForm.id ? t('Edit Driver Location') : t('Add Driver Location')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="input-container">
                            <label htmlFor="driver_id">{t('Driver ID')}</label>
                            <Input
                                id="driver_id"
                                type="number"
                                value={statusForm.driver_id}
                                onChange={(e) => setStatusForm(prev => ({ ...prev, driver_id: e.target.value }))}
                                placeholder="Enter driver ID"
                            />
                        </div>
                        <div className="input-container">
                            <label htmlFor="location">{t('Location')}</label>
                            <Input
                                id="location"
                                value={statusForm.location}
                                onChange={(e) => setStatusForm(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="Enter location"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="latitude">{t('Latitude')}</Label>
                                <Input
                                    id="latitude"
                                    type="number"
                                    step="any"
                                    value={statusForm.latitude}
                                    onChange={(e) => setStatusForm(prev => ({ ...prev, latitude: e.target.value }))}
                                    placeholder="Enter latitude"
                                />
                            </div>
                            <div>
                                <Label htmlFor="longitude">{t('Longitude')}</Label>
                                <Input
                                    id="longitude"
                                    type="number"
                                    step="any"
                                    value={statusForm.longitude}
                                    onChange={(e) => setStatusForm(prev => ({ ...prev, longitude: e.target.value }))}
                                    placeholder="Enter longitude"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStatusForm(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={handleSaveStatus}>
                            {t('Save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Status History Dialog */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{t('Location History')} - {selectedDriver?.driver?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-96 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('Location')}</TableHead>
                                    <TableHead>{t('Coordinates')}</TableHead>
                                    <TableHead>{t('Updated At')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statusHistory.map((history, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{history.location || 'Unknown'}</TableCell>
                                        <TableCell>
                                            {history.latitude && history.longitude
                                                ? `${formatDecimalValue(history.latitude, decimalPrecision)}, ${formatDecimalValue(history.longitude, decimalPrecision)}`
                                                : 'N/A'
                                            }
                                        </TableCell>
                                        <TableCell>{dateFormat(history.last_updated || history.updated_at, 'datetime')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Alert Dialog */}
            {deleteAlert && (
                <DeleteAlert
                    onSubmitSuccess={handleSubmitSuccess}
                    record={selectedRecord}
                    onClose={closeDeleteAlert}
                    api="driver_statuses/delete"
                />
            )}

            {/* Export Dialog */}
            {showExport && (
                <ExportDialog
                    model="driver_statuses"
                    endpoint="driver-statuses/export"
                    fields={[
                        { key: "id", label: "ID" },
                        { key: "driver.name", label: "Driver Name" },
                        { key: "driver.email", label: "Driver Email" },
                        { key: "driver.driver.phone", label: "Phone Number" },
                        { key: "location", label: "Location" },
                        { key: "latitude", label: "Latitude" },
                        { key: "longitude", label: "Longitude" },
                        { key: "last_updated", label: "Last Updated" },
                        { key: "created_at", label: "Created At" },
                        { key: "updated_at", label: "Updated At" },
                    ]}
                    onClose={() => setShowExport(false)}
                />
            )}
        </div>
    );
} 