import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import Select from '@/components/misc/Select';
import RequiredField from "@/components/misc/RequiredField";
import { Input } from '@/components/ui/input';
import PropTypes from 'prop-types';
import { useState } from 'react';

export default function AlertDialog({ open, onClose, onSubmit, formData, setFormData, t, transactions, loading }) {
    const [errors, setErrors] = useState({
        inventory_item_id: '',
        minimum_stock_level: '',
        notification_methods: ''
    });

    // Notification method options
    const notificationOptions = [
        { value: 'email', label: t('Email') },
        { value: 'sms', label: t('SMS') },
        { value: 'in_system', label: t('In-System') }
    ];

    const validateForm = () => {
        const newErrors = {
            inventory_item_id: formData.inventory_item_id ? '' : t('Item is required'),
            minimum_stock_level: formData.minimum_stock_level ? '' : t('Minimum stock level is required'),
            notification_methods: formData.notification_methods.length > 0 ? '' : t('At least one notification method is required')
        };

        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(e);
        }
    };
    console.log(transactions, 'transactions')
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('Set Up Low Stock Alert')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="input-container">
                            <label className="block mb-2">{t('Item Name')} <RequiredField /></label>
                            <Select
                                options={transactions}
                                value={transactions.find(item => item.id === formData.inventory_item_id)}
                                onChange={(opt) => setFormData(prev => ({
                                    ...prev,
                                    inventory_item_id: opt.value
                                }))}
                                error={errors.inventory_item_id}
                                placeholder={t('Select Item...')}
                            />
                            {errors.inventory_item_id && (
                                <p className="mt-1 text-sm text-red-500">{errors.inventory_item_id}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Minimum Stock Level')} <RequiredField /></label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.minimum_stock_level}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    minimum_stock_level: e.target.value
                                }))}
                                error={errors.minimum_stock_level}
                                placeholder={t('Enter Minimum Stock Level...')}
                            />
                            {errors.minimum_stock_level && (
                                <p className="mt-1 text-sm text-red-500">{errors.minimum_stock_level}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Notification Methods')} <RequiredField /></label>
                            <Select
                                options={notificationOptions}
                                value={notificationOptions.filter(opt =>
                                    formData.notification_methods.includes(opt.value)
                                )}
                                onChange={(opts) => setFormData(prev => ({
                                    ...prev,
                                    notification_methods: opts.map(opt => opt.value)
                                }))}
                                isMulti
                                error={errors.notification_methods}
                                placeholder={t('Select Notification Methods...')}
                            />
                            {errors.notification_methods && (
                                <p className="mt-1 text-sm text-red-500">{errors.notification_methods}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button disabled={loading} type="submit">
                            <Bell className="w-4 h-4 mr-2" />
                            {t('Create Alert')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

AlertDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    formData: PropTypes.shape({
        inventory_item_id: PropTypes.string,
        minimum_stock_level: PropTypes.string,
        notification_methods: PropTypes.arrayOf(PropTypes.string)
    }).isRequired,
    setFormData: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        item_name: PropTypes.string.isRequired
    })).isRequired
};
