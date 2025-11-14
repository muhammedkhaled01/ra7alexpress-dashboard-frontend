import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import WhatsAppSettingsModal from './WhatsAppSettingsModal';
import WhatsAppTemplatesTable from './WhatsAppTemplatesTable';

// Mock data
const mockSettings = {
    provider: 'twilio',
    is_connected: true,
    sender_number: '+1234567890',
    template_language: 'en'
};

const mockTemplates = {
    created: 'Your shipment has been created successfully! Tracking number: {{tracking_number}}',
    delivered: 'Your shipment has been delivered! Thank you for choosing our service.',
    in_transit: 'Your shipment is currently in transit. Expected delivery: {{expected_date}}',
    delayed: 'Your shipment has been delayed. New expected delivery: {{new_date}}',
    cancelled: 'Your shipment has been cancelled. Reason: {{reason}}'
};

export default function WhatsappIntegrations() {
    const { t } = useTranslation();
    const [settings, setSettings] = useState(mockSettings);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [formData, setFormData] = useState({
        provider: mockSettings.provider,
        api_key: 'mock_api_key_123',
        sender_number: mockSettings.sender_number,
        business_account_id: 'mock_account_123',
        template_language: mockSettings.template_language
    });
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState(mockTemplates);

    const handleSubmit = () => {
        toast.success(t('WhatsApp settings updated successfully'));
        setShowSettingsModal(false);
        setSettings({ ...mockSettings, ...formData });
    };

    const handleTestMessage = (event) => {
        toast.success(t('Test message sent successfully'));
    };

    useEffect(() => {
        setSettings(mockSettings);
        setTemplates(mockTemplates);
    }, []);

    return (
        <div className="p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>{t('WhatsApp Integration')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <Button onClick={() => setShowSettingsModal(true)}>
                            {t('Configure WhatsApp Settings')}
                        </Button>
                        
                        {settings && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{t('Connection Status:')}</span>
                                    <span className={`px-2 py-1 rounded-full text-sm ${
                                        settings.is_connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {settings.is_connected ? t('Connected') : t('Disconnected')}
                                    </span>
                                </div>
                                {settings.is_connected && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSettings({ ...settings, is_connected: false });
                                            toast.success(t('WhatsApp connection disconnected'));
                                        }}
                                    >
                                        {t('Disconnect')}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('Message Templates')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <WhatsAppTemplatesTable
                        templates={templates}
                        onTest={handleTestMessage}
                        t={t}
                        loading={loading}
                    />
                </CardContent>
            </Card>

            <WhatsAppSettingsModal
                open={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
                t={t}
                isEdit={settings !== null}
                loading={loading}
            />
        </div>
    );
}
