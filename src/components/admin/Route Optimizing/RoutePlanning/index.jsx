import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import RouteMap from './Map';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Select from '@/components/misc/Select';
import { useDispatch, useSelector } from 'react-redux';
import { getDrivers } from '@/stores/features/ajaxFeature';
import { Button } from '@/components/ui/button';
import axiosMerchant from '@/axios';

export default function RoutePlanning() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [routes, setRoutes] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedDriver, setSelectedDriver] = useState('');
    const [open, setOpen] = useState(false);
    const drivers = useSelector((store) => store.ajax.drivers);
    const dispatch = useDispatch();
    useEffect(() => {
        if (!drivers) dispatch(getDrivers());
    }, []);
    const fetchRoutes = useCallback(async () => {
        try {
            setIsLoaded(false);
            const response = await axiosMerchant.get('/routes', {
                params: {
                    date: selectedDate,
                    driver_id: selectedDriver
                }
            });
            // The routes are in response.data.data.data due to pagination
            setRoutes(response.data.data.data || []);
            setIsLoaded(true);
        } catch (error) {
            console.error('Error fetching routes:', error);
            toast.error('Failed to fetch routes');
            setIsLoaded(true);
        }
    }, [selectedDate, selectedDriver]);

    const handleSubmit = async () => {
        try {
            const response = await axiosMerchant.post('/routes/plan', {
                route_date: selectedDate,
                driver_id: selectedDriver
            });
            if (response.data.status === 'success') {
                toast.success('Route planned successfully');
                setOpen(false);
                fetchRoutes();
            } else if (response.data.status === 'no_shipments') {
                toast.error('No pending shipments for the selected date');
            }
        } catch (error) {
            console.error('Error planning route:', error);
            toast.error('Failed to plan route');
        }
    };

    useEffect(() => {
        if (selectedDate && selectedDriver) {
            fetchRoutes();
        }
    }, [selectedDate, selectedDriver, fetchRoutes]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Route Planning</h2>
                <Button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    Create Route
                </Button>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                    <div className="flex flex-col gap-1">
                        <Label>Select Date</Label>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label>Select Driver</Label>
                        <Select
                            value={selectedDriver ? { value: selectedDriver, label: drivers?.find(d => d.id === selectedDriver)?.name || '' } : null}
                            onChange={(selectedOption) => setSelectedDriver(selectedOption?.value)}
                            options={drivers?.map(driver => ({
                                value: driver.id,
                                label: driver.name
                            })) || []}
                            placeholder="Select Driver..."
                            noOptionsMessage={() => "No drivers available"}
                            isClearable={true}
                        />
                    </div>
                </div>

                <RouteMap routes={routes} isLoaded={isLoaded} />
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Route ID</TableHead>
                            <TableHead>Driver</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Total Stops</TableHead>
                            <TableHead>Total Distance</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {routes?.map((route) => (
                            <TableRow key={route.id}>
                                <TableCell>{route.id}</TableCell>
                                <TableCell>{route.driver.name}</TableCell>
                                <TableCell>{new Date(route.date).toLocaleDateString()}</TableCell>
                                <TableCell>{route.stops?.length || 0}</TableCell>
                                <TableCell>{route.total_distance} km</TableCell>
                                <TableCell className="text-right">
                                    <button
                                        onClick={() => {
                                            // TODO: Implement route details modal
                                        }}
                                        className="text-primary hover:text-primary-dark"
                                    >
                                        View Details
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Plan New Route</DialogTitle>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                Select a date and driver to plan a new route.
                            </p>
                        </div>
                    </DialogHeader>
                    <div className="mt-5">
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!selectedDate || !selectedDriver}
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:text-sm"
                        >
                            {selectedDate && selectedDriver ? 'Plan Route' : 'Select Date and Driver'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
