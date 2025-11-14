import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Select from '@/components/misc/Select';
import { Badge } from '@/components/ui/badge';
import ExportDialog from '@/components/misc/ExportDialog';
import NoRecordFound from '@/components/NoRecordFound';
import { RefreshCcw, Container, Search, Plus, Edit2, Trash2, UserPlus } from 'lucide-react';
import RequiredField from "@/components/misc/RequiredField";

// Mock data generator for vehicles
const generateMockVehicles = () => {
    const vehicleTypes = ['Van', 'Truck', 'Pickup', 'Mini Van'];
    const statuses = ['Active', 'In Maintenance', 'Inactive'];
    const drivers = [
        { id: 1, name: 'John Driver' },
        { id: 2, name: 'Sarah Driver' },
        { id: 3, name: 'Mike Driver' },
        null // For unassigned vehicles
    ];

    return Array.from({ length: 20 }, (_, index) => ({
        id: `VEH${String(index + 1).padStart(4, '0')}`,
        licensePlate: `ABC${Math.floor(Math.random() * 1000)}`,
        vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
        driver: drivers[Math.floor(Math.random() * drivers.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        totalDistance: Math.floor(Math.random() * 100000),
        capacity: Math.floor(Math.random() * 5000) + 1000
    }));
};

export default function Vehicles() {
    const { t } = useTranslation();

    const [vehicles, setVehicles] = useState(generateMockVehicles());
    const [filteredVehicles, setFilteredVehicles] = useState(vehicles);
    const [currentPage, setCurrentPage] = useState(1);
    const [showExport, setShowExport] = useState(false);
    const [showVehicleForm, setShowVehicleForm] = useState(false);
    const [refreshBtn, setRefreshBtn] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        licensePlate: '',
        vehicleType: '',
        capacity: '',
        status: 'available'
    });
    const [formErrors, setFormErrors] = useState({
        licensePlate: '',
        vehicleType: '',
        capacity: '',
        status: ''
    });

    const [showAssignDriver, setShowAssignDriver] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    // Validation functions
    const validateField = (fieldName, value) => {
        const errorMap = {
            licensePlate: value ? '' : t('License Plate is required'),
            vehicleType: value ? '' : t('Vehicle Type is required'),
            capacity: value ? '' : t('Capacity is required'),
            status: value ? '' : t('Status is required')
        };
        return errorMap[fieldName];
    };

    const validateForm = (formData) => {
        const newErrors = {
            licensePlate: validateField('licensePlate', formData.licensePlate),
            vehicleType: validateField('vehicleType', formData.vehicleType),
            capacity: validateField('capacity', formData.capacity),
            status: validateField('status', formData.status)
        };
        console.log(newErrors, 'newErrors')
        setFormErrors(newErrors);
        return Object.values(newErrors).every(error => error === '');
    };

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        vehicleType: '',
        status: '',
        driver: ''
    });

    // Options arrays for select components
    const vehicleTypeOptions = [
        { value: '', label: t("All Types") },
        { value: 'Van', label: t("Van") },
        { value: 'Truck', label: t("Truck") },
        { value: 'Pickup', label: t("Pickup") },
        { value: 'Mini Van', label: t("Mini Van") }
    ];

    const statusOptions = [
        { value: '', label: t("All Statuses") },
        { value: 'Active', label: t("Active") },
        { value: 'In Maintenance', label: t("In Maintenance") },
        { value: 'Inactive', label: t("Inactive") }
    ];

    // Driver options for select
    const driverOptions = [
        { value: '', label: t("All Drivers") },
        { value: '1', label: t("John Driver") },
        { value: '2', label: t("Sarah Driver") },
        { value: '3', label: t("Mike Driver") }
    ];

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleRefresh = () => {
        setFilters({
            search: '',
            vehicleType: '',
            status: '',
            driver: ''
        });
        setCurrentPage(1);
    };

    // Apply filters
    useState(() => {
        let result = vehicles;

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            result = result.filter(vehicle =>
                vehicle.id.toLowerCase().includes(searchTerm) ||
                vehicle.licensePlate.toLowerCase().includes(searchTerm) ||
                (vehicle.driver?.name.toLowerCase().includes(searchTerm))
            );
        }

        if (filters.vehicleType) {
            result = result.filter(vehicle => vehicle.vehicleType === filters.vehicleType);
        }

        if (filters.status) {
            result = result.filter(vehicle => vehicle.status === filters.status);
        }

        if (filters.driver) {
            result = result.filter(vehicle => vehicle.driver?.id.toString() === filters.driver);
        }

        setFilteredVehicles(result);
    }, [vehicles, filters]);

    // Pagination
    const itemsPerPage = 10;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredVehicles.slice(indexOfFirstItem, indexOfLastItem);



    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const formatDistance = (distance) => {
        return `${distance.toLocaleString()} km`;
    };

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'Active': return 'success';
            case 'In Maintenance': return 'warning';
            case 'Inactive': return 'destructive';
            default: return 'secondary';
        }
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{t('Vehicles')}</h1>
                <Button onClick={() => setShowVehicleForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('Add Vehicle')}
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('Filter Vehicles')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="input-container">
                            <label>{t('Search')}</label>
                            <Input
                                placeholder={t('Search by ID, License Plate...')}
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                icon={<Search className="w-4 h-4" />}
                            />
                        </div>
                        <div className="input-container">
                            <label>{t('Vehicle Type')}</label>
                            <Select
                                options={vehicleTypeOptions}
                                value={vehicleTypeOptions.find(opt => opt.value === filters.vehicleType)}
                                onChange={(opt) => handleFilterChange('vehicleType', opt.value)}
                            />
                        </div>
                        <div className="input-container">
                            <label>{t('Status')}</label>
                            <Select
                                options={statusOptions}
                                value={statusOptions.find(opt => opt.value === filters.status)}
                                onChange={(opt) => handleFilterChange('status', opt.value)}
                            />
                        </div>
                        <div className="input-container">
                            <label>{t('Driver')}</label>
                            <Select
                                options={driverOptions}
                                value={driverOptions.find(opt => opt.value === filters.driver)}
                                onChange={(opt) => handleFilterChange('driver', opt.value)}
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button
                                onClick={() => setShowExport(true)}
                                title={t('Export Vehicles')} 
                                variant="export"
                            >
                                <Container className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleRefresh}
                                title={t('Reset Filters')}
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Vehicles Table */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{t('Vehicle List')}</CardTitle>
                        <Button type="button" variant="refresh" onClick={() => {
                            setRefreshBtn(true);
                            setVehicles(generateMockVehicles());
                        }}>
                            <RefreshCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {currentItems.length > 0 ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead isFixed>{t('Vehicle ID')}</TableHead>
                                        <TableHead isFixed>{t('License Plate')}</TableHead>
                                        <TableHead>{t('Vehicle Type')}</TableHead>
                                        <TableHead>{t('Driver')}</TableHead>
                                        <TableHead>{t('Status')}</TableHead>
                                        <TableHead>{t('Last Used')}</TableHead>
                                        <TableHead>{t('Total Distance')}</TableHead>
                                        <TableHead>{t('Actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentItems.map((vehicle) => (
                                        <TableRow key={vehicle.id}>
                                            <TableCell>{vehicle.id}</TableCell>
                                            <TableCell isFixed>{vehicle.licensePlate}</TableCell>
                                            <TableCell>{vehicle.vehicleType}</TableCell>
                                            <TableCell>
                                                {vehicle.driver?.name || t('Unassigned')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(vehicle.status)}>
                                                    {t(vehicle.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(vehicle.lastUsed)}</TableCell>
                                            <TableCell>{formatDistance(vehicle.totalDistance)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            setFormData({
                                                                id: vehicle.id,
                                                                licensePlate: vehicle.licensePlate,
                                                                vehicleType: vehicle.vehicleType,
                                                                capacity: vehicle.capacity,
                                                                status: vehicle.status
                                                            });
                                                            setShowVehicleForm(true);
                                                        }}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedVehicle(vehicle);
                                                            setShowAssignDriver(true);
                                                        }}
                                                    >
                                                        <UserPlus className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => {
                                                            // Handle delete
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="mt-4">
                                {/* Pagination will be implemented in a future update */}
                            </div>
                        </>
                    ) : (
                        <NoRecordFound />
                    )}
                </CardContent>
            </Card>

            {/* Export Dialog */}
            {showExport && (
                <ExportDialog
                    model="vehicles"
                    endpoint="vehicles/export"
                    fields={[
                        { key: 'id', label: 'Vehicle ID' },
                        { key: 'licensePlate', label: 'License Plate' },
                        { key: 'vehicleType', label: 'Vehicle Type' },
                        { key: 'driver', label: 'Driver' },
                        { key: 'status', label: 'Status' },
                        { key: 'lastUsed', label: 'Last Used' },
                        { key: 'totalDistance', label: 'Total Distance' },
                        { key: 'capacity', label: 'Capacity' }
                    ]}
                    filters={[
                        {
                            key: 'vehicle_type',
                            label: 'Vehicle Type',
                            type: 'select',
                            options: vehicleTypeOptions.slice(1)
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            type: 'select',
                            options: statusOptions.slice(1)
                        },
                        {
                            key: 'driver',
                            label: 'Driver',
                            type: 'select',
                            options: driverOptions.slice(1)
                        }
                    ]}
                    onClose={() => setShowExport(false)}
                />
            )}

            {/* Vehicle Form Dialog */}
            <Dialog open={showVehicleForm} onOpenChange={() => {
                setShowVehicleForm(false);
                setFormData({
                    id: '',
                    licensePlate: '',
                    vehicleType: '',
                    capacity: '',
                    status: 'available'
                });
                setFormErrors({
                    licensePlate: '',
                    vehicleType: '',
                    capacity: '',
                    status: ''
                });
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {formData.id ? t('Edit Vehicle') : t('Add New Vehicle')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="input-container">
                                <label>{t('License Plate')} <RequiredField /></label>
                                <Input
                                    placeholder="ABC123"
                                    value={formData.licensePlate}
                                    onChange={(e) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            licensePlate: e.target.value
                                        }));
                                        validateField('licensePlate', e.target.value);
                                    }}
                                    error={!!formErrors.licensePlate}
                                />
                                {formErrors.licensePlate && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.licensePlate}</p>
                                )}
                            </div>
                            <div className="input-container">
                                <label>{t('Vehicle Type')} <RequiredField /></label>
                                <Select
                                    options={vehicleTypeOptions.slice(1)}
                                    value={vehicleTypeOptions.find(opt => opt.value === formData.vehicleType)}
                                    onChange={(opt) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            vehicleType: opt.value
                                        }));
                                        validateField('vehicleType', opt.value);
                                    }}
                                    error={!!formErrors.vehicleType}
                                />
                                {formErrors.vehicleType && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.vehicleType}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="input-container">
                                <label>{t('Capacity (kg)')} <RequiredField /></label>
                                <Input
                                    type="number"
                                    placeholder="1000"
                                    value={formData.capacity}
                                    onChange={(e) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            capacity: e.target.value
                                        }));
                                        validateField('capacity', e.target.value);
                                    }}
                                    error={!!formErrors.capacity}
                                />
                                {formErrors.capacity && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.capacity}</p>
                                )}
                            </div>
                            <div className="input-container">
                                <label>{t('Status')} </label>
                                <Select
                                    options={statusOptions.slice(1)}
                                    value={statusOptions.find(opt => opt.value === formData.status)}
                                    onChange={(opt) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            status: opt.value
                                        }));
                                        validateField('status', opt.value);
                                    }}
                                    error={!!formErrors.status}
                                />
                                {formErrors.status && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.status}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowVehicleForm(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={(e) => {
                            e.preventDefault();
                            const isValid = validateForm(formData);
                            if (!isValid) {
                                console.log('Form validation failed:', formErrors);
                                return;
                            }

                            const newVehicle = {
                                ...formData,
                                id: formData.id || `VEH${String(vehicles.length + 1).padStart(4, '0')}`,
                                lastUsed: new Date().toISOString(),
                                totalDistance: 0
                            };

                            if (formData.id) {
                                // Editing existing vehicle
                                setVehicles(prevVehicles =>
                                    prevVehicles.map(v => v.id === formData.id ? newVehicle : v)
                                );
                            } else {
                                // Adding new vehicle
                                setVehicles(prevVehicles => [...prevVehicles, newVehicle]);
                            }

                            setShowVehicleForm(false);
                        }}>
                            {t('Save')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Assign Driver Dialog */}
            <Dialog open={showAssignDriver} onOpenChange={() => {
                setShowAssignDriver(false);
                setSelectedVehicle(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Assign Driver')}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <label>{t('Select Driver')}</label>
                        <Select
                            options={driverOptions.slice(1)}
                            defaultValue={driverOptions.find(
                                opt => opt.value === selectedVehicle?.driver?.id.toString()
                            )}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowAssignDriver(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={() => {
                            // Handle driver assignment
                            setShowAssignDriver(false);
                        }}>
                            {t('Assign')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
