import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Plus, RefreshCcw } from 'lucide-react';
import axios from '@/axios';
import ShipmentRulesTable from './ShipmentRulesTable';
import RuleEditorModal from './RuleEditorModal';
import DeleteAlert from '@/components/misc/DeleteAlert';

export default function ShipmentRulesEngine() {
    const { t } = useTranslation();
    const [rules, setRules] = useState([]);
    const [showEditorModal, setShowEditorModal] = useState(false);
    const [currentRule, setCurrentRule] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        condition_json: {},
        action_json: {},
        is_active: true
    });
    const [loading, setLoading] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [refreshBtn, setRefreshBtn] = useState(false);

    const fetchRules = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/shipment-rules');
            setRules(response.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to fetch rules'));
        } finally {
            setLoading(false);
        }
    }, [setRules, setLoading, t]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const url = currentRule ? '/shipment-rules/update' : '/shipment-rules';
            const method = 'post';
            
            await axios[method](url, {
                name: formData.name,
                condition_json: formData.condition_json,
                action_json: formData.action_json,
                is_active: formData.is_active,
                id: currentRule?.id
            });
            
            toast.success(currentRule ? t('Rule updated successfully') : t('Rule created successfully'));
            handleCloseModal();
            await fetchRules();
        } catch (error) {
            toast.error(error.response?.data?.message || (currentRule ? t('Failed to update rule') : t('Failed to create rule')));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (rule) => {
        setCurrentRule(rule);
        setFormData({
            name: rule.name,
            condition_json: rule.condition_json,
            action_json: rule.action_json,
            is_active: rule.is_active
        });
        setShowEditorModal(true);
    };

    const handleDelete = async (ruleId) => {
        setSelectedRecord({ id: ruleId });
        setDeleteAlert(true);
    };

    const handleCloseModal = () => {
        setShowEditorModal(false);
        setCurrentRule(null);
        setFormData({
            name: '',
            condition_json: {},
            action_json: {},
            is_active: true
        });
    };

    const handleDeleteConfirm = async () => {
        setLoading(true);
        await fetchRules();
        setLoading(false);
    };

    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    return (
        <div className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-2 justify-between md:items-center">
                <h1 className="text-2xl font-bold">{t('Shipment Rules')}</h1>
                <Button onClick={() => setShowEditorModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('Add New Rule')}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                    <CardTitle>{t('Shipment Rules')}</CardTitle>
                    <Button type="button" variant="refresh" onClick={() => {
                        setRefreshBtn(true);
                        fetchRules();
                    }}>
                        <RefreshCcw className="w-4 h-4" />
                    </Button>
                </div>
                </CardHeader>
                <CardContent>
                    <ShipmentRulesTable
                        rules={rules}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        loading={loading}
                        t={t}
                    />
                </CardContent>
            </Card>

            <RuleEditorModal
                open={showEditorModal}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
                t={t}
                isEdit={currentRule !== null}
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
                    api="shipment-rules/delete"
                />
            )}
        </div>
    );
}
