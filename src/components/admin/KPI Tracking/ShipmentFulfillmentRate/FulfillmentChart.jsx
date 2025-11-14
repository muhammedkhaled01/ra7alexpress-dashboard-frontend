import PropTypes from 'prop-types';
import { Card, CardContent } from '@/components/ui/card';
import LineChartComponent from '@/components/charts/LineChartComponent';

export default function FulfillmentChart({ chartData }) {

FulfillmentChart.propTypes = {
    chartData: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
            value: PropTypes.number.isRequired
        })
    ).isRequired
};
    return (
        <Card>
            <CardContent>
                <div className="h-[300px]">
                    <LineChartComponent data={chartData} />
                </div>
            </CardContent>
        </Card>
    );
}
