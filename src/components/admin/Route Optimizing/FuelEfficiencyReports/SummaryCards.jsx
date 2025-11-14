import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatDecimalValue } from '@/utils/helpers';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

export default function SummaryCards({ data }) {
    const { t } = useTranslation();
    const {decimalPrecision} = useSelector((state) => state.setting)

    SummaryCards.propTypes = {
    data: PropTypes.shape({
        totalDistance: PropTypes.number,
    }).isRequired,
};
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>{t('Total Distance')}</CardTitle>
                    <CardDescription>{t('Kilometers traveled')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">
                        {(data?.totalDistance) ?? 0} {t('km')}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>{t('Total Fuel')}</CardTitle>
                    <CardDescription>{t('Liters consumed')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">
                        {data?.totalFuel ?? 0} {t('L')}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>{t('Average Efficiency')}</CardTitle>
                    <CardDescription>{t('Kilometers per liter')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">
                        {formatDecimalValue(Number(data?.averageEfficiency ?? 0), decimalPrecision)} {t('km/L')}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
