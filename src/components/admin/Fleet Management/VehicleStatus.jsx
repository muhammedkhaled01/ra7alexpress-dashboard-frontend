import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Loader2, Plus, Pencil, Trash2, History, MapPin, Clock, RotateCw, User, Truck, Phone, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search } from 'lucide-react';
import Select from '@/components/misc/Select';
import { Label } from '@/components/ui/label';
import axiosMerchant from '@/axios';
import { handleError, humanizeText, can, dateFormat, formatDecimalValue } from '@/utils/helpers';
import toast from 'react-hot-toast';
import Pagination from '@/components/Pagination';
import Loader from '@/components/Loader';
import PageTitle from '@/components/admin/Layouts/PageTitle';
import NoRecordFound from '@/components/NoRecordFound';
import DeleteAlert from '@/components/misc/DeleteAlert';
import ExportDialog from '@/components/misc/ExportDialog';
import { useGoogleMaps } from '@/contexts/GoogleMapsProvider';
import { useSelector } from 'react-redux';

export default function VehicleStatus() {
    const { t } = useTranslation();
    const { isLoaded } = useGoogleMaps();

    // State management
    const [truckStatuses, setTruckStatuses] = useState([]);
    const [filteredStatuses, setFilteredStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const {decimalPrecision} = useSelector((state) => state.setting)
    const [selectedStatus, setSelectedStatus] = useState('');
    const [refreshBtn, setRefreshBtn] = useState(false);

    // Dialog states
    const [showVehicleDetails, setShowVehicleDetails] = useState(false);
    const [showStatusForm, setShowStatusForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);

    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [statusHistory, setStatusHistory] = useState([]);

    // Form state
    const [statusForm, setStatusForm] = useState({
        id: null,
        truck_id: '',
        status: 'idle',
        location: '',
        latitude: '',
        longitude: ''
    });

    // Permission checks
    const accessAbility = can("Truck Status access");
    const createAbility = can("Truck Status create");
    const updateAbility = can("Truck Status update");
    const deleteAbility = can("Truck Status delete");

    // Status options matching backend enum
    const statusOptions = [
        { value: '', label: t('All Statuses') },
        { value: 'in_transit', label: t('In Transit') },
        { value: 'idle', label: t('Idle') },
        { value: 'long_idle', label: t('Long Idle') },
        { value: 'under_maintenance', label: t('Under Maintenance') }
    ];

    // Fetch truck statuses from API
    const fetchTruckStatuses = async (pageNumber = 1) => {
        setLoading(true);
        try {
            const response = await axiosMerchant.get(`truck_statuses?page=${pageNumber}`);
            if (response.data.success) {
                const data = response.data.data;
                setTruckStatuses(data.data || []);
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
            const response = await axiosMerchant.get(`truck_statuses?search=${searchTerm}`);
            if (response.data.success) {
                setTruckStatuses(response.data.data.data || []);
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
        setSelectedStatus("");
        fetchTruckStatuses(currentPage);
    };

    // Fetch status history for a specific truck
    const fetchStatusHistory = async (truckId) => {
        try {
            const response = await axiosMerchant.get(`truck_statuses/history/${truckId}`);
            if (response.data.success) {
                setStatusHistory(response.data.data.data || []);
            }
        } catch (error) {
            handleError(error);
        }
    };

    // Create or update truck status
    const handleSaveStatus = async () => {
        try {
            const endpoint = statusForm.id ? 'truck_statuses/update' : 'truck_statuses';
            const method = statusForm.id ? 'put' : 'post';

            const payload = {
                ...statusForm,
                last_updated: new Date().toISOString()
            };

            if (statusForm.id) {
                payload.id = statusForm.id;
            }

            const response = await axiosMerchant[method](endpoint, payload);

            if (response.data.success) {
                toast.success(statusForm.id ? "Status updated successfully" : "Status created successfully");
                setShowStatusForm(false);
                setStatusForm({
                    id: null,
                    truck_id: '',
                    status: 'idle',
                    location: '',
                    latitude: '',
                    longitude: ''
                });
                fetchTruckStatuses(currentPage);
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
        fetchTruckStatuses(currentPage);
    }, [currentPage]);

    // Apply filters
    useEffect(() => {
        let result = [...truckStatuses];

        if (selectedStatus) {
            result = result.filter(status => status.status === selectedStatus);
        }

        setFilteredStatuses(result);
    }, [truckStatuses, selectedStatus]);

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
            fetchTruckStatuses(currentPage);
        }, 30000);

        return () => clearInterval(interval);
    }, [currentPage]);

    // Get marker color based on status
    const getMarkerColor = (status) => {
        switch (status) {
            case 'in_transit': return '#22c55e'; // green
            case 'idle': return '#f59e0b'; // yellow
            case 'long_idle': return '#f97316'; // orange
            case 'under_maintenance': return '#ef4444'; // red
            default: return '#6b7280'; // gray
        }
    };

    // Get status badge variant
    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'in_transit': return 'success';
            case 'idle': return 'warning';
            case 'long_idle': return 'warning';
            case 'under_maintenance': return 'destructive';
            default: return 'secondary';
        }
    };

    // Handle vehicle click
    const handleVehicleClick = (vehicle) => {
        setSelectedVehicle(vehicle);
        setShowVehicleDetails(true);
    };

    // Handle edit status
    const handleEditStatus = (status) => {
        setStatusForm({
            id: status.id,
            truck_id: status.truck_id,
            status: status.status,
            location: status.location || '',
            latitude: status.latitude || '',
            longitude: status.longitude || ''
        });
        setShowStatusForm(true);
    };

    // Handle view history
    const handleViewHistory = (vehicle) => {
        setSelectedVehicle(vehicle);
        fetchStatusHistory(vehicle.truck_id);
        setShowHistory(true);
    };

    // Handle submit success
    const handleSubmitSuccess = () => {
        fetchTruckStatuses(currentPage);
    };

    return (
        <div>

            <div className="flex flex-wrap gap-3 mt-2 justify-between">
                <PageTitle title={t('Vehicle Status')} />
                {/* <div>
                    {createAbility && (
                        <Button onClick={() => setShowStatusForm(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('Add Status')}
                        </Button>
                    )}
                </div> */}
                <div className="flex flex-row gap-x-2">
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('Search vehicles...')}
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-48">
                            <Select
                                options={statusOptions}
                                value={statusOptions.find(opt => opt.value === selectedStatus)}
                                onChange={(opt) => setSelectedStatus(opt.value)}
                            />
                        </div>
                        <Button variant="refresh" onClick={handleRefresh}>
                            <RotateCw className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button variant="download" type="button" onClick={() => setShowExport(true)}>
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4">
                {/* Map */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Vehicle Locations')}</CardTitle>
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
                                                onClick={() => handleVehicleClick(status)}
                                                icon={{
                                                    url: `data:image/svg+xml,${encodeURIComponent(
                                                        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${getMarkerColor(status.status)}" width="24" height="24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>`
                                                    )}`
                                                }}
                                                title={`${status.truck?.number_plate} - ${humanizeText(status.status)}`}
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
                                    <TableCell colSpan={7} className="text-center">
                                        <Loader />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    ) : truckStatuses && truckStatuses.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">#</TableHead>
                                    <TableHead isFixed>{t('Vehicle')}</TableHead>
                                    <TableHead>{t('Driver')}</TableHead>
                                    <TableHead>{t('Status')}</TableHead>
                                    <TableHead>{t('Location')}</TableHead>
                                    <TableHead>{t('Last Updated')}</TableHead>
                                    {/* <TableHead className="text-right">{t('Actions')}</TableHead> */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStatuses.map((status, index) => (
                                    <TableRow
                                        key={status.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleVehicleClick(status)}
                                    >
                                        <TableCell className="font-medium">{index + 1}</TableCell>
                                        <TableCell isFixed>
                                            <div className="flex items-center">
                                                <Truck className="w-4 h-4 mr-2" />
                                                <div>
                                                    <div className="font-medium">{status.truck?.number_plate}</div>
                                                    <div className="text-sm text-muted-foreground">{status.truck?.company}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <User className="w-4 h-4 mr-2" />
                                                <div>
                                                    <div className="font-medium">{status.truck?.truck_driver?.name || 'No Driver'}</div>
                                                    <div className="text-sm text-muted-foreground">{status.truck?.truck_driver?.phone_number || ''}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(status.status)}>
                                                {humanizeText(status.status)}
                                            </Badge>
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

            {/* Vehicle Details Dialog */}
            <Dialog open={showVehicleDetails} onOpenChange={setShowVehicleDetails}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('Vehicle Details')}</DialogTitle>
                    </DialogHeader>
                    {selectedVehicle && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold mb-3">{t('Vehicle Information')}</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Truck className="w-4 h-4" />
                                            <span className="font-medium">License Plate:</span>
                                            <span>{selectedVehicle.truck?.number_plate}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Company:</span>
                                            <span className="ml-2">{selectedVehicle.truck?.company}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Type:</span>
                                            <span className="ml-2">{selectedVehicle.truck?.type}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Color:</span>
                                            <span className="ml-2">{selectedVehicle.truck?.color}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Barcode:</span>
                                            <span className="ml-2">{selectedVehicle.truck?.barcode}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-3">{t('Driver Information')}</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            <span className="font-medium">Name:</span>
                                            <span>{selectedVehicle.truck?.truck_driver?.user?.name || 'No Driver Assigned'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            <span className="font-medium">Phone:</span>
                                            <span>{selectedVehicle.truck?.truck_driver?.phone_number || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">ID Card:</span>
                                            <span className="ml-2">{selectedVehicle.truck?.truck_driver?.id_card_number || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Company:</span>
                                            <span className="ml-2">{selectedVehicle.truck?.truck_driver?.company || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-3">{t('Current Status')}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="font-medium">Status:</span>
                                        <Badge variant={getStatusBadgeVariant(selectedVehicle.status)} className="ml-2">
                                            {humanizeText(selectedVehicle.status)}
                                        </Badge>
                                    </div>
                                    <div>
                                        <span className="font-medium">Location:</span>
                                        <span className="ml-2">{selectedVehicle.location || 'Unknown'}</span>
                                    </div>
                                    {selectedVehicle.latitude && selectedVehicle.longitude && (
                                        <>
                                            <div>
                                                <span className="font-medium">Latitude:</span>
                                                <span className="ml-2">{formatDecimalValue(selectedVehicle.latitude, decimalPrecision)}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium">Longitude:</span>
                                                <span className="ml-2">{formatDecimalValue(selectedVehicle.longitude, decimalPrecision)}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="col-span-2">
                                        <span className="font-medium">Last Updated:</span>
                                        <span className="ml-2">{dateFormat(selectedVehicle.last_updated || selectedVehicle.updated_at, 'datetime')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* Status History Dialog */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{t('Status History')} - {selectedVehicle?.truck?.number_plate}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-96 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('Status')}</TableHead>
                                    <TableHead>{t('Location')}</TableHead>
                                    <TableHead>{t('Coordinates')}</TableHead>
                                    <TableHead>{t('Updated At')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statusHistory.map((history, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(history.status)}>
                                                {humanizeText(history.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{history.location || 'Unknown'}</TableCell>
                                        <TableCell>
                                            {history.latitude && history.longitude
                                                ? `${formatDecimalValue(history.latitude,decimalPrecision)}, ${formatDecimalValue(history.longitude,decimalPrecision)}`
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
                    api="truck-statuses/delete"
                />
            )}

            {/* Export Dialog */}
            {showExport && (
                <ExportDialog
                    model="truck_statuses"
                    endpoint="truck-statuses/export"
                    fields={[
                        { key: "id", label: "ID" },
                        { key: "truck.number_plate", label: "Vehicle Number" },
                        { key: "truck.company", label: "Company" },
                        { key: "truck.truck_driver.user.name", label: "Driver Name" },
                        { key: "status", label: "Status" },
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