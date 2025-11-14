import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropTypes from 'prop-types';
import Loader from '@/components/Loader';

const getStatusBadge = (isActive) => {
    return {
        label: isActive ? 'Active' : 'Inactive',
        variant: isActive ? 'success' : 'default'
    };
};

const formatCondition = (condition) => {
    if (!condition || !condition.type) return '-';
    
    const operators = {
        '===': '=',
        '>': '>',
        '<': '<',
        '!==': '!=',
        '&&': 'AND',
        '||': 'OR'
    };
    
    return `${condition.type} ${operators[condition.operator] || condition.operator} ${condition.value}`;
};

const formatAction = (action) => {
    if (!action || !action.type) return '-';
    
    return `${action.type} ${action.value || ''}`;
};

const ShipmentRulesTable = ({ rules, onEdit, onDelete, t, loading }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('Rule Name')}</TableHead>
                    <TableHead>{t('Condition')}</TableHead>
                    <TableHead>{t('Action')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">
                            <Loader />
                        </TableCell>
                    </TableRow>
                )}
                {!loading &&
                    rules.map((rule) => {
                        const status = getStatusBadge(rule.is_active);
                        return (
                            <TableRow key={rule.id}>
                                <TableCell>{rule.name}</TableCell>
                                <TableCell>{formatCondition(rule.condition_json)}</TableCell>
                                <TableCell>{formatAction(rule.action_json)}</TableCell>
                                <TableCell>
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(rule)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete(rule.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })
                }
            </TableBody>
        </Table>
    );
};

ShipmentRulesTable.propTypes = {
    rules: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            condition_json: PropTypes.object.isRequired,
            action_json: PropTypes.object.isRequired,
            is_active: PropTypes.bool.isRequired
        })
    ).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
};

export default ShipmentRulesTable;
