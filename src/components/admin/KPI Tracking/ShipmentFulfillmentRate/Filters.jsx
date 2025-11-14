import PropTypes from 'prop-types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

export default function Filters({ 
    dateRange, 
    setDateRange, 
}) {

Filters.propTypes = {
    dateRange: PropTypes.shape({
        from: PropTypes.string,
        to: PropTypes.string
    }).isRequired,
    setDateRange: PropTypes.func.isRequired,
    selectedType: PropTypes.string.isRequired,
    setSelectedType: PropTypes.func.isRequired
};
    const { t } = useTranslation();
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('Filters')}</CardTitle>
            </CardHeader>
            <CardContent>
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
                </div>
            </CardContent>
        </Card>
    );
}
