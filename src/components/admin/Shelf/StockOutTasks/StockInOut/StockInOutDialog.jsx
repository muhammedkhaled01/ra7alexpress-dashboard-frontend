import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import PropTypes from 'prop-types';
import { Input } from '@/components/ui/input';
import Select from '@/components/misc/Select';
import RequiredField from "@/components/misc/RequiredField";
import { useState } from 'react';

const StockInOutDialog = ({ open, onClose, t, formData, setFormData, typeOptions, items, onSubmit, loading }) => {
    const [errors, setErrors] = useState({
        inventory_item_id: '',
        type: '',
        quantity: ''
    });

    const validateForm = () => {
        console.log(formData.inventory_item_id, 'formData.inventory_item_id')
        const newErrors = {
            inventory_item_id: formData.inventory_item_id ? '' : t('Item name is required'),
            type: formData.type ? '' : t('Transaction type is required'),
            quantity: formData.quantity ? '' : t('Quantity is required')
        };

        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(validateForm())
        if (validateForm()) {
            onSubmit(e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('Record Stock Transaction')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="input-container">
                            <label className="block mb-2">{t('Item Name')} <RequiredField /></label>
                            <Select
                                options={items}
                                value={items.find(item => item.value === formData.inventory_item_id)}
                                onChange={(opt) => setFormData(prev => ({ ...prev, inventory_item_id: opt.value }))}
                                error={errors.inventory_item_id}
                                placeholder={t('Select Item...')}
                            />
                            {errors.inventory_item_id && (
                                <p className="mt-1 text-sm text-red-500">{errors.inventory_item_id}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Transaction Type')} <RequiredField /></label>
                            <Select
                                options={typeOptions.filter(opt => opt.value !== '')}
                                value={typeOptions.find(opt => opt.value === formData.type)}
                                onChange={(opt) => setFormData(prev => ({ ...prev, type: opt.value }))}
                                error={errors.type}
                                placeholder={t('Select Transaction Type...')}
                            />
                            {errors.type && (
                                <p className="mt-1 text-sm text-red-500">{errors.type}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Quantity')} <RequiredField /></label>
                            <Input
                                type="number"
                                min="1"
                                value={formData.quantity}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                                error={errors.quantity}
                                placeholder={t('Enter Quantity...')}
                            />
                            {errors.quantity && (
                                <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Notes')}</label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder={t('Enter any additional notes...')}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button disabled={loading} type="submit">{t('Record Transaction')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

StockInOutDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    formData: PropTypes.shape({
        inventory_item_id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        quantity: PropTypes.string.isRequired,
        inventory_itemName: PropTypes.string.isRequired,
        notes: PropTypes.string
    }).isRequired,
    setFormData: PropTypes.func.isRequired,
    typeOptions: PropTypes.array.isRequired,
    items: PropTypes.array.isRequired,
    onSubmit: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired
};

export default StockInOutDialog;
