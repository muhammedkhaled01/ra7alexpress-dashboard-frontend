import PropTypes from 'prop-types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDecimalValue } from '@/utils/helpers';
import { useSelector } from 'react-redux';

export default function FulfillmentTable({
    data,
    onDateClick
}) {
    const { decimalPrecision } = useSelector((state) => state.setting);

    FulfillmentTable.propTypes = {
        data: PropTypes.arrayOf(
            PropTypes.shape({
                date: PropTypes.string.isRequired,
                totalShipments: PropTypes.number.isRequired,
                fulfilledShipments: PropTypes.number.isRequired,
                failedShipments: PropTypes.number.isRequired,
                fulfillmentRate: PropTypes.number.isRequired
            })
        ).isRequired,
        onDateClick: PropTypes.func.isRequired
    };
    const { t } = useTranslation();

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('Fulfillment Performance')}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead isFixed>{t('Date')}</TableHead>
                            <TableHead className="text-right">{t('Total Shipments')}</TableHead>
                            <TableHead className="text-right">{t('Fulfilled')}</TableHead>
                            <TableHead className="text-right">{t('Failed')}</TableHead>
                            <TableHead className="text-right">{t('Fulfillment Rate')}</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.date}>
                                <TableCell isFixed>{new Date(row.date).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">{row.total_shipments}</TableCell>
                                <TableCell className="text-right">{row.fulfilled_shipments}</TableCell>
                                <TableCell className="text-right">{row.failed_shipments}</TableCell>
                                <TableCell className="text-right">
                                    <Badge
                                        variant={row.fulfillmentRate >= 90 ? 'success' : 'destructive'}
                                    >
                                        {formatDecimalValue(Number(row.fulfillmentRate ?? 0), decimalPrecision)}%
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {row.failedShipments > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDateClick(row.date)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
