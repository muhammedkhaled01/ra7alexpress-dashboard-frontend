import PropTypes from 'prop-types';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from '@/components/ui/card';
import BarChartComponent from '@/components/charts/BarChartComponent';
import LineChartComponent from '@/components/charts/LineChartComponent';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { formatDecimalValue } from '@/utils/helpers';

function Charts({ efficiencyByDriver = [], efficiencyTrend = [] }) {
    const { t } = useTranslation();
    const {decimalPrecision} = useSelector((state) => state.setting)

    const driverData = efficiencyByDriver?.map(driver => ({
        title: driver.driver_name,
        value: formatDecimalValue(driver.efficiency, decimalPrecision)
    })) || [];

    const trendData = efficiencyTrend?.map(day => ({
        title: day.date,
        value: formatDecimalValue(day.avg_efficiency, decimalPrecision)
    })) || [];

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>{t('Efficiency by Driver')}</CardTitle>
                    <CardDescription>{t('Compare performance across drivers')}</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <BarChartComponent data={driverData} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>{t('Efficiency Trend')}</CardTitle>
                    <CardDescription>{t('View patterns over time')}</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <LineChartComponent data={trendData} />
                </CardContent>
            </Card>
        </div>
    );
}

Charts.propTypes = {
    efficiencyByDriver: PropTypes.arrayOf(PropTypes.shape({
        driver_name: PropTypes.string.isRequired,
        efficiency: PropTypes.number.isRequired
    })).isRequired,
    efficiencyTrend: PropTypes.arrayOf(PropTypes.shape({
        date: PropTypes.string.isRequired,
        avg_efficiency: PropTypes.number.isRequired
    })).isRequired
};

export default Charts;
