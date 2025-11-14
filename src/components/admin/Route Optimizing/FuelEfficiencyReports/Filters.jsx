import { useState } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export default function Filters({ onDateChange, onDriverChange, loading = false }) {
    const { t } = useTranslation();

    Filters.propTypes = {
        onDateChange: PropTypes.func.isRequired,
        onDriverChange: PropTypes.func.isRequired,
        loading: PropTypes.bool,
    };

    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 7); // Last 7 days by default
        return format(date, 'yyyy-MM-dd');
    });
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedDriver, setSelectedDriver] = useState('all');
    const handleDriverChange = (value) => {
        setSelectedDriver(value);
        onDriverChange(value);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('Filters')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
                <div className="grid gap-2">
                    <Label>{t('Start Date')}</Label>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                            setStartDate(e.target.value);
                            onDateChange(e.target.value, endDate);
                        }}
                    />
                </div>
                <div className="grid gap-2">
                    <Label>{t('End Date')}</Label>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                            setEndDate(e.target.value);
                            onDateChange(startDate, e.target.value);
                        }}
                    />
                </div>
                <div className="grid gap-2">
                    <Label>{t('Driver')}</Label>
                    <Select
                        value={selectedDriver}
                        onValueChange={(value) => handleDriverChange(value)}
                        disabled={loading}
                        placeholder={t('Select driver...')}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('Select a driver')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('All Drivers')}</SelectItem>
                            {/* Add actual driver options from API */}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}
