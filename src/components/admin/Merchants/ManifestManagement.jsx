import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from '@/components/misc/Select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import axios from '@/axios';
import { toast } from 'react-hot-toast';
import { Package, User, Calendar, Box, Scale, DollarSign } from 'lucide-react';
import { getDrivers } from '@/stores/features/ajaxFeature';
import Loader from '@/components/Loader';
import { formatDecimalValue } from '@/utils/helpers';


export default function ManifestManagement() {
    const { t } = useTranslation();
    const { drivers, loading: driverLoading } = useSelector((store) => store.ajax);
    const { decimalPrecision } = useSelector((state) => state.setting);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [manifest, setManifest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);
    const dispatch = useDispatch();
    
    useEffect(() => {
        if (!drivers) dispatch(getDrivers());
    }, [drivers]);

    const generateManifest = async () => {
        if (!selectedDriver) return;

        setLoading(true);
        try {
            const response = await axios.post('/manifests/generate', {
                driver_id: selectedDriver,
                start_date: format(startDate, 'yyyy-MM-dd'),
                end_date: format(endDate, 'yyyy-MM-dd')
            });

            if (response.data.success) {
                setManifest(response.data.data);
                toast.success(t('Manifest generated successfully'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to generate manifest'));
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (trackingNo) => {
        await navigator.clipboard.writeText(trackingNo);
        setCopiedTrackingNo(trackingNo);

        setTimeout(() => {
            setCopiedTrackingNo(null);
        }, 2000);
    };

    const exportToPDF = async () => {
        if (!manifest?.manifest?.id) return;

        setLoading(true);
        try {
            console.log('Exporting manifest:', manifest?.manifest?.id);
            const response = await axios.get(`/manifests/${manifest?.manifest?.id}/export`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `manifest_${manifest?.manifest?.manifest_serial}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success(t('PDF exported successfully'));
        } catch (error) {
            console.error('Export error:', error);
            toast.error(error.response?.data?.message || t('Failed to export PDF'));
        } finally {
            setLoading(false);
        }
    };
    console.log(manifest,'manifest')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t('Manifest Management')}</h1>
                <Button onClick={exportToPDF} variant="outline" disabled={!manifest?.manifest?.id || loading}>
                    {t('Export PDF')}
                </Button>
            </div>

            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('Select Driver')}</label>
                        <Select
                            value={selectedDriver ? { value: selectedDriver, label: drivers.find(d => d.id === selectedDriver).name } : null}
                            onChange={(selectedOption) => setSelectedDriver(selectedOption?.value)}
                            options={drivers?.map(driver => ({
                                value: driver.id,
                                label: driver.name
                            })) || []}
                            placeholder={t('Select Driver...')}
                            noOptionsMessage={() => t('No drivers available')}
                            isClearable={true}
                            isLoading={driverLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('From Date')}</label>
                        <Input
                            type="date"
                            value={format(startDate, 'yyyy-MM-dd')}
                            onChange={(e) => setStartDate(new Date(e.target.value))}
                            className="rounded-md border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('To Date')}</label>
                        <Input
                            type="date"
                            value={format(endDate, 'yyyy-MM-dd')}
                            onChange={(e) => setEndDate(new Date(e.target.value))}
                            className="rounded-md border"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={generateManifest} disabled={loading}>
                        {loading ? t('Generating...') : t('Generate Manifest')}
                    </Button>
                </div>
            </Card>

            {manifest ? (
                <Card className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 items-start">
                        {loading && (
                            <div className="col-span-2 flex justify-center">
                                <Loader />
                            </div>
                        )}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm dark:shadow-gray-700 h-[220px]">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <Package className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                                    <div>
                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('Manifest Serial')}:</span>
                                        <span className="block font-medium text-gray-900 dark:text-white">{manifest?.manifest?.manifest_serial}</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <User className="w-6 h-6 text-green-500 dark:text-green-400" />
                                    <div>
                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('Driver')}:</span>
                                        <span className="block font-medium text-gray-900 dark:text-white">{drivers.find(driver => driver.id === manifest?.manifest?.driver_id)?.name || t('Unknown Driver')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <Calendar className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                                    <div>
                                        <span className="text-sm text-gray-600 dark:text-gray-300">{t('Period')}:</span>
                                        <span className="block font-medium text-gray-900 dark:text-white">
                                            {manifest?.manifest?.start_date ? format(new Date(manifest.manifest.start_date), 'dd/MM/yyyy') : t('N/A')} -
                                            {manifest?.manifest?.end_date ? format(new Date(manifest.manifest.end_date), 'dd/MM/yyyy') : t('N/A')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm dark:shadow-gray-700 min-h-[220px]">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <Box className="w-6 h-6 text-yellow-500 dark:text-yellow-400 mb-2" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('Total Shipments')}</span>
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{manifest?.manifest?.total_shipments}</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{t('shipments')}</span>
                                </div>
                                <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <Scale className="w-6 h-6 text-red-500 dark:text-red-400 mb-2" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('Total Weight')}</span>
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{manifest?.manifest?.total_weight ? formatDecimalValue(manifest?.manifest?.total_weight, decimalPrecision) : formatDecimalValue(0, decimalPrecision)}</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{t('kg')}</span>
                                </div>
                                <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <DollarSign className="w-6 h-6 text-green-500 dark:text-green-400 mb-2" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('Total Value')}</span>
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{manifest?.manifest?.total_value || '0'}</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{t('EGP')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">{t('Shipments List')}</h3>
                        <Table className="text-xs">
                            <TableHeader>
                                <TableRow>
                                    <TableHead isFixed>{t('Tracking No.')}</TableHead>
                                    <TableHead>{t('Weight (kg)')}</TableHead>
                                    <TableHead>{t('Amount')}</TableHead>
                                    <TableHead>{t('Delivery Fee')}</TableHead>
                                    <TableHead>{t('Payment Type')}</TableHead>
                                    <TableHead>{t('Status')}</TableHead>
                                    <TableHead>{t('Created At')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {manifest?.shipments.map((shipment) => (
                                    <TableRow key={shipment.id}>
                                        <TableCell isFixed className="font-medium !px-2">
                                        <div className="flex justify-center items-start gap-2">
                                            <button
                                                onClick={() => handleCopy(shipment.tracking_no)}
                                                className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                                                aria-label="Copy tracking number"
                                            >
                                                {copiedTrackingNo === shipment.tracking_no ? (
                                                    <Check size={18} className="text-green-500" />
                                                ) : (
                                                    <Copy size={18} />
                                                )}
                                            </button>
                                            <span className="font-bold text-[14px]">{shipment.tracking_no}</span>
                                        </div>
                                    </TableCell>
                                        <TableCell>
                                            {shipment.shipment_information?.weight ?
                                                formatDecimalValue(shipment.shipment_information.weight, decimalPrecision) + ' kg' :
                                                formatDecimalValue(0, decimalPrecision) + ' kg'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {shipment.amount} EGP
                                        </TableCell>
                                        <TableCell>
                                            {shipment.delivery_fee} EGP
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={shipment.payment_type === 'COD' ? 'outline' : 'success'}>
                                                {shipment.payment_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={shipment.status === 'OFD' ? 'success' : 'default'}>
                                                {shipment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {shipment.created_at ? format(new Date(shipment.created_at), 'dd/MM/yyyy HH:mm') : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            ) : null}
        </div>
    );
}