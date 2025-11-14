import { Input } from '@/components/ui/input';
import Select from '@/components/misc/Select';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import PropTypes from 'prop-types';

const RuleFilters = ({ 
    searchTerm, 
    onSearchChange, 
    status, 
    onStatusChange, 
    t 
}) => {
    const statusOptions = [
        { value: '', label: t('All Statuses') },
        { value: 'active', label: t('Active') },
        { value: 'inactive', label: t('Inactive') }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
                <Label>{t('Search Rules')}</Label>
                <div className="relative">
                    <Input
                        placeholder={t('Search by rule name...')}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
            </div>
            <div className="flex flex-col space-y-2">
                <Label>{t('Status')}</Label>
                <Select
                    options={statusOptions}
                    value={statusOptions.find(opt => opt.value === status)}
                    onChange={(opt) => onStatusChange(opt.value)}
                />
            </div>
        </div>
    );
};

RuleFilters.propTypes = {
    searchTerm: PropTypes.string.isRequired,
    onSearchChange: PropTypes.func.isRequired,
    status: PropTypes.string.isRequired,
    onStatusChange: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
};

export default RuleFilters;
