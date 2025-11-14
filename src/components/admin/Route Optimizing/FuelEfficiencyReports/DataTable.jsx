import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import PropTypes from 'prop-types';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/components/ui/table';
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDecimalValue } from '@/utils/helpers';
import { useSelector } from 'react-redux';

export default function DataTable({ data }) {
    const { t } = useTranslation();
    const {decimalPrecision} = useSelector((state) => state.setting)

    DataTable.propTypes = {
        data: PropTypes.arrayOf(PropTypes.shape({
            driverName: PropTypes.string.isRequired,
            distance: PropTypes.number.isRequired,
            fuelConsumed: PropTypes.number.isRequired,
            efficiency: PropTypes.number.isRequired
        })).isRequired
    };

    const getEfficiencyRecommendation = (efficiency) => {
        if (efficiency >= 3.0) return t('Excellent efficiency');
        if (efficiency >= 2.0) return t('Good efficiency');
        return t('Consider vehicle maintenance');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('Detailed Report')}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead isFixed>{t('Driver')}</TableHead>
                            <TableHead>{t('Distance (km)')}</TableHead>
                            <TableHead>{t('Fuel (L)')}</TableHead>
                            <TableHead>{t('Efficiency (km/L)')}</TableHead>
                            <TableHead>{t('Recommendation')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.map((row, index) => (
                            <TableRow key={index}>
                                <TableCell isFixed>{row.driverName}</TableCell>
                                <TableCell>{row.distance}</TableCell>
                                <TableCell>{row.fuelConsumed}</TableCell>
                                <TableCell>{formatDecimalValue(Number(row.efficiency), decimalPrecision)}</TableCell>
                                <TableCell className="max-w-md">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{getEfficiencyRecommendation(row.efficiency)}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
