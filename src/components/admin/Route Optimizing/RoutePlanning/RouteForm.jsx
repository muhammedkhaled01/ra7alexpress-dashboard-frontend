import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Select from '@/components/misc/Select';
import { format } from 'date-fns';
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function RouteForm({
    drivers,
    shipments,
    onSubmit,
    onClose,
    initialValues = {
        driverId: '',
        startLocation: '',
        endLocation: '',
        deliveryLocations: [],
        date: format(new Date(), 'yyyy-MM-dd')
    }
}) {
    const [form, setForm] = useState(initialValues);
    const [errors, setErrors] = useState({});

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrors({});

        const newErrors = {};
        if (!form.driverId) newErrors.driver = 'Driver is required';
        if (!form.startLocation) newErrors.startLocation = 'Start location is required';
        if (!form.endLocation) newErrors.endLocation = 'End location is required';
        if (form.deliveryLocations.length === 0) newErrors.deliveryLocations = 'At least one delivery location is required';
        if (!form.date) newErrors.date = 'Date is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSubmit(form);
    };

    return (
        <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
                <DialogTitle>Plan New Route</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="driver">Driver</Label>
                        <Select
                            id="driver"
                            className="basic-multi-select"
                            classNamePrefix="select"
                            value={drivers.find(d => d.id.toString() === form.driverId)
                                ? {
                                    value: form.driverId,
                                    label: drivers.find(d => d.id.toString() === form.driverId).name
                                }
                                : null
                            }
                            onChange={(selected) => setForm({ ...form, driverId: selected?.value || '' })}
                            options={drivers.map(driver => ({
                                value: driver.id.toString(),
                                label: driver.name
                            }))}
                            placeholder="Select driver..."
                        />
                        {errors.driver && (
                            <span className="text-red-500 text-xs">{errors.driver}</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deliveryLocations">Delivery Locations</Label>
                        <Select
                            id="deliveryLocations"
                            className="basic-multi-select"
                            classNamePrefix="select"
                            isMulti
                            value={form.deliveryLocations.map(loc => ({
                                value: loc,
                                label: shipments.find(o => o.id === loc)?.address || ''
                            }))}
                            onChange={(selected) => setForm({
                                ...form,
                                deliveryLocations: selected ? selected.map(s => s.value) : []
                            })}
                            options={shipments.map(shipment => ({
                                value: shipment.id,
                                label: `${shipment.address} (${shipment.customer})`
                            }))}
                            placeholder="Select delivery locations..."
                        />
                        {errors.deliveryLocations && (
                            <span className="text-red-500 text-xs">{errors.deliveryLocations}</span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startLocation">Start Location</Label>
                            <Input
                                id="startLocation"
                                value={form.startLocation}
                                onChange={(e) => setForm({ ...form, startLocation: e.target.value })}
                                placeholder="Click on map to set start location"
                                readOnly
                            />
                            {errors.startLocation && (
                                <span className="text-red-500 text-xs">{errors.startLocation}</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endLocation">End Location</Label>
                            <Input
                                id="endLocation"
                                value={form.endLocation}
                                onChange={(e) => setForm({ ...form, endLocation: e.target.value })}
                                placeholder="Click on map to set end location"
                                readOnly
                            />
                            {errors.endLocation && (
                                <span className="text-red-500 text-xs">{errors.endLocation}</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                        />
                        {errors.date && (
                            <span className="text-red-500 text-xs">{errors.date}</span>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Create Route
                        </Button>
                    </DialogFooter>
                </div>
            </form>
        </DialogContent>
    );
}

RouteForm.propTypes = {
    drivers: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.number
            ]).isRequired,
            name: PropTypes.string.isRequired
        })
    ).isRequired,
    shipments: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.number
            ]).isRequired,
            address: PropTypes.string.isRequired,
            customer: PropTypes.string.isRequired
        })
    ).isRequired,
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    initialValues: PropTypes.shape({
        driverId: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]),
        startLocation: PropTypes.string,
        endLocation: PropTypes.string,
        deliveryLocations: PropTypes.arrayOf(
            PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.number
            ])
        ),
        date: PropTypes.string
    }),
};
