import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Plus, RefreshCcw } from 'lucide-react';
import axios from '@/axios';
import CustomsDeclarationsTable from './CustomsDeclarationsTable';
import AddEditDeclarationModal from './AddEditDeclarationModal';
import DeleteAlert from '@/components/misc/DeleteAlert';
import { formatDecimalValue } from '@/utils/helpers';
import { useSelector } from 'react-redux';

export default function CustomsDeclarations() {
    const { t } = useTranslation();
    const [declarations, setDeclarations] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentDeclaration, setCurrentDeclaration] = useState(null);
    const {decimalPrecision} = useSelector((state) => state.setting)
    const [formData, setFormData] = useState({
        description: '',
        declared_value: '',
        hs_code: '',
        origin_country: '',
        export_reason: '',
        invoice_path: null
    });
    const [loading, setLoading] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [refreshBtn, setRefreshBtn] = useState(false);

    const fetchDeclarations = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/customs');
            setDeclarations(response.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to fetch declarations'));
        } finally {
            setLoading(false);
        }
    }, [setDeclarations, setLoading, t]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const url = currentDeclaration ? `/customs/update/${currentDeclaration.id}` : '/customs';
            const method = currentDeclaration ? 'post' : 'post';

            // Create a plain object to hold the data with proper types
            const data = {
                description: formData.description,
                declared_value: Number(formData.declared_value),
                hs_code: formData.hs_code,
                origin_country: formData.origin_country,
                export_reason: formData.export_reason
            };

            // Create FormData
            const formDataToSend = new FormData();
            
            // Append each field
            formDataToSend.append('description', data.description);
            formDataToSend.append('declared_value', data.declared_value);
            formDataToSend.append('hs_code', data.hs_code);
            formDataToSend.append('origin_country', data.origin_country);
            formDataToSend.append('export_reason', data.export_reason);

            // Handle file upload
            if (formData.invoice_path) {
                formDataToSend.append('invoice', formData.invoice_path);
            }

            await axios[method](url, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success(currentDeclaration ? t('Declaration updated successfully') : t('Declaration created successfully'));
            handleCloseModal();
            await fetchDeclarations();
        } catch (error) {
            toast.error(error.response?.data?.message || (currentDeclaration ? t('Failed to update declaration') : t('Failed to create declaration')));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (declaration) => {
        setCurrentDeclaration(declaration);
        // Convert declared_value to a number with 2 decimal places
        const declaredValue = formatDecimalValue(declaration.declared_value, decimalPrecision);
        
        setFormData({
            description: declaration.description,
            declared_value: declaredValue,
            hs_code: declaration.hs_code,
            origin_country: declaration.origin_country,
            export_reason: declaration.export_reason,
            invoice_path: declaration.invoice_path
        });
        setShowModal(true);
    };

    const handleDelete = async (declarationId) => {
        setSelectedRecord({ id: declarationId });
        setDeleteAlert(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentDeclaration(null);
        setFormData({
            description: '',
            declared_value: '',
            hs_code: '',
            origin_country: '',
            export_reason: '',
            invoice_path: null
        });
    };

    const handleExportPDF = async (declarationId) => {
        try {
            const response = await axios.get(`/customs/${declarationId}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `declaration_${declarationId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error(t('Failed to export PDF'));
        }
    };

    const handleDeleteConfirm = async () => {
        setLoading(true);
        await fetchDeclarations();
        setLoading(false);
    };

    useEffect(() => {
        fetchDeclarations();
    }, [fetchDeclarations]);

    return (
        <div className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-2 justify-between md:items-center">
                <h1 className="text-2xl font-bold">{t('Customs Declarations')}</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setShowModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('Add New Declaration')}
                    </Button>
                    <Button type="button" variant="refresh" onClick={() => {
                        setRefreshBtn(true);
                        fetchDeclarations();
                    }}>
                        <RefreshCcw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('Customs Declarations')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <CustomsDeclarationsTable
                        declarations={declarations}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onExportPDF={handleExportPDF}
                        loading={loading}
                        t={t}
                    />
                </CardContent>
            </Card>

            <AddEditDeclarationModal
                open={showModal}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
                t={t}
                isEdit={currentDeclaration !== null}
                loading={loading}
            />

            {deleteAlert && (
                <DeleteAlert
                    onSubmitSuccess={handleDeleteConfirm}
                    record={selectedRecord}
                    onClose={() => {
                        setDeleteAlert(false);
                        setSelectedRecord(null);
                    }}
                    api="customs/delete"
                />
            )}
        </div>
    );
}
