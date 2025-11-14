import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from '@/components/misc/Select';
import PropTypes from 'prop-types';
import { useState } from 'react';

const WhatsAppSettingsModal = ({ open, onClose, onSubmit, formData, setFormData, t }) => {
    const [errors, setErrors] = useState({
        provider: '',
        api_key: '',
        sender_number: '',
        business_account_id: '',
        template_language: ''
    });

    const validateForm = () => {
        const newErrors = {
            provider: formData.provider ? '' : t('Provider is required'),
            api_key: formData.api_key ? '' : t('API Key is required'),
            sender_number: formData.sender_number ? '' : t('Sender number is required'),
            business_account_id: formData.business_account_id ? '' : t('Business Account ID is required'),
            template_language: formData.template_language ? '' : t('Template language is required')
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

    const providerOptions = [
        { value: 'twilio', label: 'Twilio' },
        { value: 'gupshup', label: 'Gupshup' }
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('Configure WhatsApp Settings')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="input-container">
                            <label className="block mb-2">{t('Provider')}</label>
                            <Select
                                options={providerOptions}
                                value={providerOptions.find(opt => opt.value === formData.provider)}
                                onChange={(opt) => setFormData(prev => ({ ...prev, provider: opt.value }))}
                                error={errors.provider}
                            />
                            {errors.provider && (
                                <p className="mt-1 text-sm text-red-500">{errors.provider}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('API Key')}</label>
                            <Input
                                type="password"
                                value={formData.api_key}
                                onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                                error={errors.api_key}
                            />
                            {errors.api_key && (
                                <p className="mt-1 text-sm text-red-500">{errors.api_key}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Sender Number')}</label>
                            <Input
                                value={formData.sender_number}
                                onChange={(e) => setFormData(prev => ({ ...prev, sender_number: e.target.value }))}
                                error={errors.sender_number}
                            />
                            {errors.sender_number && (
                                <p className="mt-1 text-sm text-red-500">{errors.sender_number}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Business Account ID')}</label>
                            <Input
                                value={formData.business_account_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, business_account_id: e.target.value }))}
                                error={errors.business_account_id}
                            />
                            {errors.business_account_id && (
                                <p className="mt-1 text-sm text-red-500">{errors.business_account_id}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Template Language')}</label>
                            <Input
                                value={formData.template_language}
                                onChange={(e) => setFormData(prev => ({ ...prev, template_language: e.target.value }))}
                                error={errors.template_language}
                            />
                            {errors.template_language && (
                                <p className="mt-1 text-sm text-red-500">{errors.template_language}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">
                            {t('Save Settings')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

WhatsAppSettingsModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    formData: PropTypes.shape({
        provider: PropTypes.string,
        api_key: PropTypes.string,
        sender_number: PropTypes.string,
        business_account_id: PropTypes.string,
        template_language: PropTypes.string
    }).isRequired,
    setFormData: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
};

export default WhatsAppSettingsModal;
