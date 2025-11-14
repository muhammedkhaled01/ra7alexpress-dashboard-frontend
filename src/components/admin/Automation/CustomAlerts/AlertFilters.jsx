import { Input } from '@/components/ui/input';
import Select from '@/components/misc/Select';
import PropTypes from 'prop-types';

export default function AlertFilters({ 
    searchTerm, 
    onSearchChange, 
    status, 
    onStatusChange, 
    t 
}) {
    const statusOptions = [
        { value: '', label: t('All Statuses') },
        { value: 'active', label: t('Active') },
        { value: 'inactive', label: t('Inactive') }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
                <Input
                    placeholder={t('Search alerts...')}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            <Select
                options={statusOptions}
                value={statusOptions.find(option => option.value === status)}
                onChange={(opt) => onStatusChange(opt.value)}
                placeholder={t('Select Status')}
            />
        </div>
    );
}

AlertFilters.propTypes = {
    searchTerm: PropTypes.string.isRequired,
    onSearchChange: PropTypes.func.isRequired,
    status: PropTypes.string.isRequired,
    onStatusChange: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
};
