import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from '@/components/misc/Select';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import RequiredField from '@/components/misc/RequiredField';

const AddEditDeclarationModal = ({ open, onClose, onSubmit, formData, setFormData, t, isEdit, loading }) => {
    const [errors, setErrors] = useState({
        description: '',
        declared_value: '',
        hs_code: '',
        origin_country: '',
        export_reason: '',
        invoice_path: ''
    });
    console.log(formData, 'formData')
    const validateForm = () => {
        const newErrors = {
            description: formData.description ? '' : t('Description is required'),
            declared_value: formData.declared_value ? '' : t('Declared value is required'),
            hs_code: formData.hs_code ? '' : t('HS Code is required'),
            origin_country: formData.origin_country ? '' : t('Origin country is required'),
            export_reason: formData.export_reason ? '' : t('Export reason is required'),
            // invoice_path: isEdit ? '' : (formData.invoice_path ? '' : t('invoice_path is required'))
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

    const hsCodeOptions = [
        { value: '', label: t('Select HS Code') },
        // Add common HS codes here
        { value: '847130', label: 'Printed Circuit Boards' },
        { value: '851762', label: 'Mobile Phones' },
        { value: '847150', label: 'Laptops' }
    ];

    const exportReasonOptions = [
        { value: '', label: t('Select Reason') },
        { value: 'sale', label: t('Sale') },
        { value: 'gift', label: t('Gift') },
        { value: 'return', label: t('Return') }
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? t('Edit Declaration') : t('Add New Declaration')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="input-container">
                            <label className="block mb-2">{t('Description of Goods')} <RequiredField /></label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                error={errors.description}
                                placeholder={t("Enter Description of Goods...")}
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Declared Value')} <RequiredField /></label>
                            <Input
                                type="number"
                                value={formData.declared_value}
                                onChange={(e) => setFormData(prev => ({ ...prev, declared_value: e.target.value }))}
                                error={errors.declared_value}
                                placeholder={t("Enter Declared Value...")}
                            />
                            {errors.declared_value && (
                                <p className="mt-1 text-sm text-red-500">{errors.declared_value}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('HS Code')} <RequiredField /></label>
                            <Select
                                options={hsCodeOptions}
                                value={hsCodeOptions.find(opt => opt.value === formData.hs_code)}
                                onChange={(opt) => setFormData(prev => ({ ...prev, hs_code: opt.value }))}
                                error={errors.hs_code}
                                placeholder={t("Enter HS Code...")}
                            />
                            {errors.hs_code && (
                                <p className="mt-1 text-sm text-red-500">{errors.hs_code}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Origin Country')} <RequiredField /></label>
                            <Input
                                value={formData.origin_country}
                                onChange={(e) => setFormData(prev => ({ ...prev, origin_country: e.target.value }))}
                                error={errors.origin_country}
                                placeholder={t("Enter Origin Country...")}
                            />
                            {errors.origin_country && (
                                <p className="mt-1 text-sm text-red-500">{errors.origin_country}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Export Reason')} <RequiredField /></label>
                            <Select
                                options={exportReasonOptions}
                                value={exportReasonOptions.find(opt => opt.value === formData.export_reason)}
                                onChange={(opt) => setFormData(prev => ({ ...prev, export_reason: opt.value }))}
                                error={errors.export_reason}
                                placeholder={t("Export Reason...")}
                            />
                            {errors.export_reason && (
                                <p className="mt-1 text-sm text-red-500">{errors.export_reason}</p>
                            )}
                        </div>
                        <div>
                            <div className="file-upload">
                                <label className="block mb-2">{t('Attach Invoice')} <RequiredField /></label>
                                <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setFormData(prev => ({ ...prev, invoice_path: file }));
                                        } else {
                                            setFormData(prev => ({ ...prev, invoice_path: null }));
                                        }
                                    }}
                                    className="block w-full text-sm text-slate-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            hover:file:bg-violet-100"
                                />
                                {errors.invoice_path && (
                                    <p className="mt-1 text-sm text-red-500">{errors.invoice_path}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {isEdit ? t('Save Changes') : t('Add Declaration')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

AddEditDeclarationModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    formData: PropTypes.shape({
        description: PropTypes.string,
        declared_value: PropTypes.number,
        hs_code: PropTypes.string,
        origin_country: PropTypes.string,
        export_reason: PropTypes.string,
        invoice_path: PropTypes.object
    }).isRequired,
    setFormData: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    isEdit: PropTypes.bool.isRequired,
    loading: PropTypes.bool.isRequired
};

export default AddEditDeclarationModal;
