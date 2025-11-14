import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from '@/axios';
import AlertTable from './RuleTable';
import AlertFilters from './RuleFilters';
import AlertModal from './RuleModal';
import AlertActions from './RuleActions';
import DeleteAlert from '@/components/misc/DeleteAlert';

export default function RulesEngine() {
    const { t } = useTranslation();
    const [rules, setRules] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentRule, setCurrentRule] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        condition_type: '',
        condition_value: '',
        action_type: '',
        action_payload: {},
        status: 'active'
    });
    const [loading, setLoading] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [refreshBtn, setRefreshBtn] = useState(false);

    const handleDeleteConfirm = async () => {
        setLoading(true);
        await fetchRules();
        setLoading(false);
        setDeleteAlert(false);
        setSelectedRecord(null);
    };

    const fetchRules = useCallback(async (search = '', status = '') => {
        try {
            setLoading(true);
            const params = {
                search: search.trim(),
                status: status.trim()
            };
            const response = await axios.get('/rules', { params });
            setRules(response.data.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to fetch rules'));
        } finally {
            setLoading(false);
        }
    }, [setRules, setLoading, t]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const ruleData = {
                name: formData.name,
                condition_type: formData.condition_type,
                condition_value: formData.condition_value,
                action_type: formData.action_type,
                action_payload: typeof formData.action_payload === 'object' ? JSON.stringify(formData.action_payload) : formData.action_payload,
                status: formData.status
            };

            if (isEditModalOpen && currentRule) {
                // Update existing rule
                await axios.post('/rules/update', {
                    id: currentRule.id,
                    ...ruleData
                });
                toast.success(t('Rule updated successfully'));
            } else {
                // Create new rule
                await axios.post('/rules/store', ruleData);
                toast.success(t('Rule created successfully'));
            }
            handleCloseModal();
            await fetchRules();
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to save rule'));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (rule) => {
        setCurrentRule(rule);
        try {
            const parsedPayload = rule.action_payload ? JSON.parse(rule.action_payload) : {};
            setFormData({
                name: rule.name,
                condition_type: rule.condition_type,
                condition_value: rule.condition_value,
                action_type: rule.action_type,
                action_payload: parsedPayload,
                status: rule.status
            });
        } catch (error) {
            console.error('Failed to parse action_payload:', error);
            setFormData({
                name: rule.name,
                condition_type: rule.condition_type,
                condition_value: rule.condition_value,
                action_type: rule.action_type,
                action_payload: {},
                status: rule.status
            });
        }
        setIsEditModalOpen(true);
    };

    const handleDelete = (ruleId) => {
        setSelectedRecord({ id: ruleId });
        setDeleteAlert(true);
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setCurrentRule(null);
        setFormData({
            name: '',
            condition_type: '',
            condition_value: '',
            action_type: '',
            action_payload: {},
            status: 'active'
        });
    };

    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms debounce delay
        return () => clearTimeout(timer);
    }, [searchTerm]);
    useEffect(() => {
        fetchRules(debouncedSearchTerm, statusFilter);
    }, [debouncedSearchTerm, statusFilter, fetchRules]);

    return (
        <div className="p-4 space-y-4">
            <>
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">{t('Rules Engine')}</h1>
                    <AlertActions onCreate={() => setIsCreateModalOpen(true)} t={t} />
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <AlertFilters
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            status={statusFilter}
                            onStatusChange={setStatusFilter}
                            t={t}
                        />
                    </CardContent>
                </Card>

                {/* Rules Table */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                        <CardTitle>{t('Rules')}</CardTitle>
                        <Button type="button" variant="refresh" onClick={() => {
                            setRefreshBtn(true);
                            fetchRules();
                        }}>
                            <RefreshCcw className="w-4 h-4" />
                        </Button>
                    </div>
                    </CardHeader>
                    <CardContent>
                        <AlertTable
                            rules={rules}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            loading={loading}
                            t={t}
                        />
                    </CardContent>
                </Card>
            </>

            {/* Create/Edit Rule Modal */}
            <AlertModal
                open={isCreateModalOpen || isEditModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
                t={t}
                isEdit={isEditModalOpen}
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
                    api="rules/delete"
                />
            )}
        </div>
    );
}
