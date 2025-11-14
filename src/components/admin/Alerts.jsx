import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosMerchant from '@/axios';
import Loader from '../Loader';
import { can, isAuthorized } from '@/utils/helpers';

export default function Alerts() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState({
        delayedDeliveries: 0,
        urgentIssues: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchAlerts = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await axiosMerchant.get('alerts');
            if (response.data.success) {
                setAlerts(response.data.data);
            }
        } catch (error) {
            console.error(t('errors.fetchAlertsFailed'), error);
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    const handleAlertClick = (type) => {
        switch (type) {
            case 'delayedDeliveries':
                navigate('/shipments?status=delayed');
                break;
            case 'urgentIssues':
                navigate('/shipments?status=urgent');
                break;
            default:
                break;
        }
    };

    const handleDismissAlert = async (type) => {
        try {
            await axiosMerchant.post('dismiss-alert', { type });
            fetchAlerts();
        } catch (error) {
            console.error(t('errors.dismissAlertFailed'), error);
        }
    };

    const canAccess = can("Analytics access")

    if (!canAccess) {
        return navigate("/unauthorized");
    }

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow p-2 md:p-6 space-y-6">
            <div className="flex items-center gap-x-4 mb-4">
                <div className="bg-white dark:bg-gray-900 p-2 rounded-full mr-3">
                    <Bell className="w-6 h-6 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold">{t('Shipment Alerts & Warnings')}</h2>
            </div>

            {(alerts.delayedDeliveries > 0 || alerts.urgentIssues > 0) ? (
                <div className="space-y-4">
                    {alerts.delayedDeliveries > 0 && (
                        <div className={`
                            rounded-lg border 
                            ${alerts.delayedDeliveries > 5 ? 'border-red-200 bg-red-50/50' : 'border-yellow-200 bg-yellow-50/50'}
                            p-4 flex justify-between items-center
                            hover:shadow-md transition-all
                        `}>
                            <div className="flex items-center space-x-4">
                                <div className="bg-white dark:bg-gray-900 p-2 rounded-full">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">{t('Overdue Shipments')}</h3>
                                    <p className={`
                                        text-3xl font-bold 
                                        ${alerts.delayedDeliveries > 5 ? 'text-red-600' : 'text-yellow-500'}
                                    `}>
                                        {alerts.delayedDeliveries}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {t('You have {{count}} shipment behind schedule', { count: alerts.delayedDeliveries })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <button
                                    onClick={() => handleAlertClick('delayedDeliveries')}
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    {t('common.viewDetails')}
                                </button>
                                <button
                                    onClick={() => handleDismissAlert('delayedDeliveries')}
                                    className="text-red-600 hover:underline text-sm"
                                >
                                    {t('common.dismiss')}
                                </button>
                            </div>
                        </div>
                    )}

                    {alerts.urgentIssues > 0 && (
                        <div className={`
                            rounded-lg border 
                            ${alerts.urgentIssues > 5 ? 'border-red-200 bg-red-50/50' : 'border-orange-200 bg-orange-50/50'}
                            p-4 flex justify-between items-center
                            hover:shadow-md transition-all
                        `}>
                            <div className="flex items-center space-x-4">
                                <div className="bg-white dark:bg-gray-900 p-2 rounded-full">
                                    <XCircle className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">{t('Critical Logistics Problems')}</h3>
                                    <p className={`
                                        text-3xl font-bold 
                                        ${alerts.urgentIssues > 5 ? 'text-red-600' : 'text-orange-500'}
                                    `}>
                                        {alerts.urgentIssues}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {t('{{count}} critical logistics issue requires immediate attention', { count: alerts.urgentIssues })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <button
                                    onClick={() => handleAlertClick('urgentIssues')}
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    {t('common.viewDetails')}
                                </button>
                                <button
                                    onClick={() => handleDismissAlert('urgentIssues')}
                                    className="text-red-600 hover:underline text-sm"
                                >
                                    {t('common.dismiss')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="rounded-lg border bg-muted p-6 shadow hover:shadow-md transition-all flex flex-col justify-between gap-2 text-center">
                    <div className="bg-white dark:bg-gray-900 p-2 rounded-full self-center mb-2">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t('Shipment Alerts & Warnings')}</h3>
                    <div className="text-3xl font-bold text-green-500">
                        0
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {t('All shipments are on track. No urgent issues detected.')}
                    </p>
                </div>
            )}
        </div>
    );
}
