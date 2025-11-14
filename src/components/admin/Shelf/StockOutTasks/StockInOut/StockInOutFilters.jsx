import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PropTypes from 'prop-types';
import Select from '@/components/misc/Select';

const StockInOutFilters = ({ dateRange, setDateRange, selectedType, setSelectedType, t }) => {
    const typeOptions = [
        { value: '', label: t('All Types') },
        { value: 'in', label: t('Stock In') },
        { value: 'out', label: t('Stock Out') }
    ];

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block mb-2">{t('From Date')}</label>
                        <Input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block mb-2">{t('To Date')}</label>
                        <Input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block mb-2">{t('Transaction Type')}</label>
                        <Select
                            options={typeOptions}
                            value={typeOptions.find(opt => opt.value === selectedType)}
                            onChange={(opt) => setSelectedType(opt.value)}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

StockInOutFilters.propTypes = {
    dateRange: PropTypes.shape({
        from: PropTypes.string,
        to: PropTypes.string
    }).isRequired,
    setDateRange: PropTypes.func.isRequired,
    selectedType: PropTypes.string,
    setSelectedType: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
};

export default StockInOutFilters;
