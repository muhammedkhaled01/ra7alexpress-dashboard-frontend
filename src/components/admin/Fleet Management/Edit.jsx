import React, { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Select from "@/components/misc/Select";
import axiosMerchant from "@/axios";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import Loader from "@/components/Loader";
import RequiredField from "@/components/misc/RequiredField";

export default function Edit({ onSubmitSuccess, onClose, record }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [trucks, setTrucks] = useState([]);
    const [formData, setFormData] = useState({
        id: "",
        truck_id: "",
        maintenance_type: "",
        scheduled_at: "",
        status: "",
        notes: ""
    });
    const [errors, setErrors] = useState({
        truck_id: '',
        maintenance_type: '',
        scheduled_at: '',
        status: '',
        notes: ''
    });

    const maintenanceTypeOptions = [
        { value: 'oil_change', label: t('Oil Change') },
        { value: 'tire_replacement', label: t('Tire Replacement') },
        { value: 'brake_service', label: t('Brake Service') },
        { value: 'general_inspection', label: t('General Inspection') },
        { value: 'filter_change', label: t('Filter Change') },
        { value: 'others', label: t('Others') }
    ];

    const statusOptions = [
        { value: 'pending', label: t('Pending') },
        { value: 'completed', label: t('Completed') },
        { value: 'overdue', label: t('Overdue') }
    ];

    useEffect(() => {
        fetchTrucks();
        if (record) {
            setFormData({
                id: record.id,
                truck_id: record.truck_id,
                maintenance_type: record.maintenance_type,
                scheduled_at: formatDateTimeLocal(record.scheduled_at),
                status: record.status,
                notes: record.notes || ""
            });
        }
    }, [record]);

    const fetchTrucks = async () => {
        try {
            const response = await axiosMerchant.get('maintenance-schedules/trucks');
            const trucksData = response.data.data.map(truck => ({
                value: truck.id,
                label: `${truck.barcode} - ${truck.number_plate} (${truck.company})`
            }));
            setTrucks(trucksData);
        } catch (error) {
            handleError(error);
        }
    };

    const formatDateTimeLocal = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {
            truck_id: formData.truck_id ? '' : t('Vehicle is required'),
            maintenance_type: formData.maintenance_type ? '' : t('Maintenance Type is required'),
            scheduled_at: formData.scheduled_at ? '' : t('Scheduled Date & Time is required'),
            status: formData.status ? '' : t('Status is required'),
            notes: formData.notes ? '' : t('Notes are required')
        };
        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form before submission
        const isValid = validateForm();
        if (!isValid) return;

        setLoading(true);

        try {
            await axiosMerchant.post("maintenance-schedules/update", formData);
            onSubmitSuccess();
            onClose();
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                handleError(error);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!record) return null;

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("Edit Maintenance Schedule")}</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="truck_id">{t("Vehicle")} <RequiredField /></Label>
                        <Select
                            options={trucks}
                            value={trucks.find(truck => truck.value === formData.truck_id)}
                            onChange={(option) => handleInputChange('truck_id', option.value)}
                            placeholder={t("Select Vehicle")}
                            error={errors.truck_id}
                        />
                        {errors.truck_id && (
                            <p className="mt-1 text-sm text-red-500">{errors.truck_id}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="maintenance_type">{t("Maintenance Type")} <RequiredField /></Label>
                        <Select
                            options={maintenanceTypeOptions}
                            value={maintenanceTypeOptions.find(type => type.value === formData.maintenance_type)}
                            onChange={(option) => handleInputChange('maintenance_type', option.value)}
                            placeholder={t("Select Maintenance Type")}
                            error={errors.maintenance_type}
                        />
                        {errors.maintenance_type && (
                            <p className="mt-1 text-sm text-red-500">{errors.maintenance_type}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="scheduled_at">{t("Scheduled Date & Time")} <RequiredField /></Label>
                        <Input
                            type="datetime-local"
                            value={formData.scheduled_at}
                            onChange={(e) => handleInputChange('scheduled_at', e.target.value)}
                            error={errors.scheduled_at}
                        />
                        {errors.scheduled_at && (
                            <p className="mt-1 text-sm text-red-500">{errors.scheduled_at}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="status">{t("Status")} <RequiredField /></Label>
                        <Select
                            options={statusOptions}
                            value={statusOptions.find(status => status.value === formData.status)}
                            onChange={(option) => handleInputChange('status', option.value)}
                            placeholder={t("Select Status")}
                            error={errors.status}
                        />
                        {errors.status && (
                            <p className="mt-1 text-sm text-red-500">{errors.status}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="notes">{t("Notes")} <RequiredField /></Label>
                        <Textarea
                            placeholder={t("Enter maintenance details...")}
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            maxLength={500}
                            error={errors.notes}
                        />
                        {errors.notes && (
                            <p className="mt-1 text-sm text-red-500">{errors.notes}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            {t("Cancel")}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader /> : t("Update")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
} 