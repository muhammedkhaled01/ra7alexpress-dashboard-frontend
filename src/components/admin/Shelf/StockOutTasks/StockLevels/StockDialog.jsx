import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from '@/components/misc/Select';
import RequiredField from "@/components/misc/RequiredField";
import PropTypes from 'prop-types';
import { useState } from 'react';

const StockDialog = ({ open, onClose, onSubmit, formData, setFormData, t, isEdit, loading }) => {
    const [errors, setErrors] = useState({
        item_name: '',
        category: '',
        current_stock: '',
        minimum_stock: ''
    });
    const validateForm = () => {
        const newErrors = {
            item_name: formData.item_name ? '' : t('Item name is required'),
            category: formData.category ? '' : t('Category is required'),
            current_stock: formData.current_stock ? '' : t('Current stock is required'),
            minimum_stock: formData.minimum_stock ? '' : t('Minimum stock is required')
        };
        
        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit();
        }
    };

    const categoryOptions = [
        { value: '', label: t('Select Category') },
        { value: 'Packaging', label: t('Packaging') },
        { value: 'Labels', label: t('Labels') },
        { value: 'Tape', label: t('Tape') },
        { value: 'Other', label: t('Other') }
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? t('Edit Item') : t('Add New Item')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className='input-container'>
                            <label className="block mb-2">{t('Item Name')} <RequiredField /></label>
                            <Input
                                value={formData.item_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                                error={errors.item_name}
                                placeholder={t("Enter Item Name...")}
                            />
                            {errors.item_name && (
                                <p className="mt-1 text-sm text-red-500">{errors.item_name}</p>
                            )}
                        </div>
                        <div className='input-container'>
                            <label className="block mb-2">{t('Category')} <RequiredField /></label>
                            <Select
                                options={categoryOptions.filter(opt => opt.value !== '')}
                                value={categoryOptions.find(opt => opt.value === formData.category)}
                                onChange={(opt) => setFormData(prev => ({ ...prev, category: opt.value }))}
                                error={errors.category}
                                placeholder={t("Select Category")}
                            />
                            {errors.category && (
                                <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                            )}
                        </div>
                        <div className='input-container'>
                            <label className="block mb-2">{t('Current Stock')} <RequiredField /></label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.current_stock}
                                onChange={(e) => setFormData(prev => ({ ...prev, current_stock: e.target.value }))}
                                error={errors.current_stock}
                                placeholder={t("Enter Current Stock")}
                            />
                            {errors.current_stock && (
                                <p className="mt-1 text-sm text-red-500">{errors.current_stock}</p>
                            )}
                        </div>
                        <div className='input-container'>
                            <label className="block mb-2">{t('Minimum Stock Level')} <RequiredField /></label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.minimum_stock}
                                onChange={(e) => setFormData(prev => ({ ...prev, minimum_stock: e.target.value }))}
                                error={errors.minimum_stock}
                                placeholder={t("Enter Minimum Stock Level")}
                            />
                            {errors.minimum_stock && (
                                <p className="mt-1 text-sm text-red-500">{errors.minimum_stock}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {isEdit ? t('Save Changes') : t('Add Item')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

StockDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    formData: PropTypes.shape({
        item_name: PropTypes.string,
        category: PropTypes.string,
        current_stock: PropTypes.string,
        minimum_stock: PropTypes.string
    }).isRequired,
    setFormData: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    isEdit: PropTypes.bool.isRequired,
    loading: PropTypes.bool.isRequired
};

export default StockDialog;
