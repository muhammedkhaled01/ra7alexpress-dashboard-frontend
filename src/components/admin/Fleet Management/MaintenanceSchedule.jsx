import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Select from '@/components/misc/Select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCcw, Plus, Check } from 'lucide-react';

// Mock data generator for maintenance schedules
const generateMockSchedules = (t) => {
    const maintenanceTypes = [
        t('Oil Change'),
        t('Tire Replacement'),
        t('Brake Service'),
        t('General Inspection'),
        t('Filter Change')
    ];

    const vehicles = [
        { id: 'VEH0001', plate: 'ABC123' },
        { id: 'VEH0002', plate: 'XYZ789' },
        { id: 'VEH0003', plate: 'DEF456' }
    ];

    const notes = [
        'Regular maintenance check',
        'Urgent repair needed',
        'Annual inspection',
        'Preventive maintenance',
        'Follow-up service'
    ];

    return Array.from({ length: 15 }, (_, index) => {
        const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
        const maintenanceDate = new Date();
        maintenanceDate.setDate(maintenanceDate.getDate() + (Math.random() * 30 - 15));

        return {
            id: `MAINT${String(index + 1).padStart(4, '0')}`,
            vehicleId: vehicle.id,
            licensePlate: vehicle.plate,
            maintenanceDate: maintenanceDate.toISOString(),
            maintenanceType: maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)],
            status: getStatusFromDate(maintenanceDate),
            notes: notes[Math.floor(Math.random() * notes.length)],
            notified: Math.random() > 0.5,
            createdAt: new Date(maintenanceDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        };
    });
};



function getStatusFromDate(date) {
    const today = new Date();
    if (date < today) return 'Overdue';
    return Math.random() > 0.3 ? 'Scheduled' : 'Completed';
}

export default function MaintenanceSchedule() {
    const { t } = useTranslation();
    const maintenanceTypeOptions = [
        { value: '', label: t('All Types') },
        { value: 'Oil Change', label: t('Oil Change') },
        { value: 'Tire Replacement', label: t('Tire Replacement') },
        { value: 'Brake Service', label: t('Brake Service') },
        { value: 'General Inspection', label: t('General Inspection') },
        { value: 'Filter Change', label: t('Filter Change') }
    ];

    const statusOptions = [
        { value: '', label: t('All Statuses') },
        { value: 'Scheduled', label: t('Scheduled') },
        { value: 'Completed', label: t('Completed') },
        { value: 'Overdue', label: t('Overdue') }
    ];
    const [schedules, setSchedules] = useState(generateMockSchedules(t));
    const [filteredSchedules, setFilteredSchedules] = useState(schedules);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [formData, setFormData] = useState({
        vehicleId: '',
        maintenanceType: '',
        maintenanceDate: new Date(),
        notes: ''
    });

    // Filters
    const today = new Date();
    const [filters, setFilters] = useState({
        dateRange: {
            from: today.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0]
        },
        maintenanceType: '',
        status: ''
    });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleDateRangeChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            dateRange: {
                ...prev.dateRange,
                [key]: value
            }
        }));
    };

    const handleRefresh = () => {
        const filterButton = document.getElementById('resetFiltersButton');
        if (filterButton) {
            filterButton.classList.add('animate-spin');
            setTimeout(() => filterButton.classList.remove('animate-spin'), 500);
        }

        setFilters({
            dateRange: { from: '', to: '' },
            maintenanceType: '',
            status: ''
        });

        // Reset filtered schedules to show all
        setFilteredSchedules(schedules);
    };

    // Apply filters
    useEffect(() => {
        const applyFilters = () => {
            let result = [...schedules];

            // Apply date range filter
            if (filters.dateRange.from || filters.dateRange.to) {
                result = result.filter(schedule => {
                    const scheduleDate = new Date(schedule.maintenanceDate);
                    scheduleDate.setHours(0, 0, 0, 0);

                    if (filters.dateRange.from) {
                        const fromDate = new Date(filters.dateRange.from);
                        fromDate.setHours(0, 0, 0, 0);
                        if (scheduleDate < fromDate) return false;
                    }

                    if (filters.dateRange.to) {
                        const toDate = new Date(filters.dateRange.to);
                        toDate.setHours(23, 59, 59, 999);
                        if (scheduleDate > toDate) return false;
                    }

                    return true;
                });
            }

            // Apply maintenance type filter
            if (filters.maintenanceType) {
                result = result.filter(schedule =>
                    schedule.maintenanceType.toLowerCase() === filters.maintenanceType.toLowerCase()
                );
            }

            // Apply status filter
            if (filters.status) {
                result = result.filter(schedule =>
                    schedule.status.toLowerCase() === filters.status.toLowerCase()
                );
            }

            // Sort by maintenance date
            result.sort((a, b) => new Date(a.maintenanceDate) - new Date(b.maintenanceDate));

            setFilteredSchedules(result);
        };

        // Debounce filter application
        const timeoutId = setTimeout(applyFilters, 300);
        return () => clearTimeout(timeoutId);
    }, [schedules, filters]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'Scheduled': return 'secondary';
            case 'Overdue': return 'destructive';
            default: return 'secondary';
        }
    };

    const handleMarkComplete = (schedule) => {
        // Simulate API call delay
        setTimeout(() => {
            const updatedSchedules = schedules.map(s =>
                s.id === schedule.id ? {
                    ...s,
                    status: 'Completed',
                    completedAt: new Date().toISOString(),
                    notes: s.notes + '\nCompleted on: ' + new Date().toLocaleString()
                } : s
            );
            setSchedules(updatedSchedules);
        }, 500);
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{t('Maintenance Schedule')}</h1>
                <Button onClick={() => setShowScheduleForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('Schedule Maintenance')}
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('Filter Schedule')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="input-container">
                            <label>{t('From Date')}</Label>
                            <Input
                                type="date"
                                value={filters.dateRange.from}
                                onChange={(e) => handleDateRangeChange('from', e.target.value)}
                            />
                        </div>
                        <div className="input-container">
                            <label>{t('To Date')}</Label>
                            <Input
                                type="date"
                                value={filters.dateRange.to}
                                onChange={(e) => handleDateRangeChange('to', e.target.value)}
                            />
                        </div>
                        <div className="input-container">
                            <label>{t('Maintenance Type')}</Label>
                            <Select
                                options={maintenanceTypeOptions}
                                value={maintenanceTypeOptions.find(opt => opt.value === filters.maintenanceType)}
                                onChange={(opt) => handleFilterChange('maintenanceType', opt.value)}
                            />
                        </div>
                        <div className="input-container">
                            <label>{t('Status')}</Label>
                            <Select
                                options={statusOptions}
                                value={statusOptions.find(opt => opt.value === filters.status)}
                                onChange={(opt) => handleFilterChange('status', opt.value)}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="refresh"
                                onClick={handleRefresh}
                                title={t('Reset Filters')}
                                className="transition-transform duration-500"
                            >
                                <RefreshCcw
                                    id="resetFiltersButton"
                                    className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Maintenance Schedule Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('Maintenance Records')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead isFixed>{t('Vehicle ID')}</TableHead>
                                <TableHead>{t('License Plate')}</TableHead>
                                <TableHead>{t('Maintenance Date')}</TableHead>
                                <TableHead>{t('Maintenance Type')}</TableHead>
                                <TableHead>{t('Status')}</TableHead>
                                <TableHead>{t('Notes')}</TableHead>
                                <TableHead>{t('Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSchedules.map((schedule) => (
                                <TableRow
                                    key={schedule.id}
                                    className={schedule.status === 'Overdue' ? 'bg-red-50/20 dark:bg-red-900/20' : ''}
                                >
                                    <TableCell>{schedule.vehicleId}</TableCell>
                                    <TableCell isFixed>{schedule.licensePlate}</TableCell>
                                    <TableCell>{formatDate(schedule.maintenanceDate)}</TableCell>
                                    <TableCell>{schedule.maintenanceType}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(schedule.status)}>
                                            {schedule.status}
                                        </Badge>
                                        {!schedule.notified && schedule.status === 'Scheduled' && (
                                            <Badge variant="warning" className="ml-2">
                                                {t('Reminder Pending')}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{schedule.notes}</TableCell>
                                    <TableCell>
                                        {schedule.status !== 'Completed' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleMarkComplete(schedule)}
                                            >
                                                <Check className="w-4 h-4 mr-2" />
                                                {t('Mark Complete')}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Schedule Maintenance Form */}
            <Dialog open={showScheduleForm} onOpenChange={setShowScheduleForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Schedule Maintenance')}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>{t('Vehicle')}</Label>
                                <Select
                                    options={[
                                        { value: 'VEH0001', label: 'VEH0001 - ABC123' },
                                        { value: 'VEH0002', label: 'VEH0002 - XYZ789' },
                                        { value: 'VEH0003', label: 'VEH0003 - DEF456' }
                                    ]}
                                    onChange={(opt) => {
                                        // Update form data with selected vehicle
                                        setFormData(prev => ({
                                            ...prev,
                                            vehicleId: opt.value
                                        }));
                                    }}
                                />
                            </div>
                            <div>
                                <Label>{t('Maintenance Type')}</Label>
                                <Select
                                    options={maintenanceTypeOptions.slice(1)}
                                    value={maintenanceTypeOptions.find(opt => opt.value === formData.maintenanceType)}
                                    onChange={(opt) => setFormData(prev => ({
                                        ...prev,
                                        maintenanceType: opt.value
                                    }))}
                                />
                            </div>
                        </div>
                        <div className="input-container">
                            <label>{t('Maintenance Date')}</Label>
                            <Input
                                type="date"
                                value={formData.maintenanceDate ? new Date(formData.maintenanceDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    maintenanceDate: e.target.value
                                }))}
                            />
                        </div>
                        <div className="input-container">
                            <label>{t('Notes')}</Label>
                            <Textarea
                                placeholder={t('Enter maintenance details...')}
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    notes: e.target.value
                                }))}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowScheduleForm(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={() => {
                            // Validate form
                            if (!formData.vehicleId || !formData.maintenanceType || !formData.maintenanceDate) {
                                return;
                            }

                            // Simulate API call delay
                            setTimeout(() => {
                                const vehicle = schedules.find(s => s.vehicleId === formData.vehicleId);
                                const newSchedule = {
                                    ...formData,
                                    id: `MAINT${String(schedules.length + 1).padStart(4, '0')}`,
                                    status: 'Scheduled',
                                    licensePlate: vehicle?.licensePlate || 'Unknown',
                                    createdAt: new Date().toISOString(),
                                    notified: false
                                };
                                setSchedules(prev => [...prev, newSchedule]);
                                setShowScheduleForm(false);
                                setFormData({
                                    vehicleId: '',
                                    maintenanceType: '',
                                    maintenanceDate: new Date(),
                                    notes: ''
                                });
                            }, 500);
                        }}>
                            {t('Schedule')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
