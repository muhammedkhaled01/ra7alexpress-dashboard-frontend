import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Truck, Clock, AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const DriverLocationsTable = ({ drivers, handleViewHistory }) => {
DriverLocationsTable.propTypes = {
    drivers: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        location: PropTypes.shape({
            lat: PropTypes.number.isRequired,
            lng: PropTypes.number.isRequired
        }).isRequired,
        status: PropTypes.string.isRequired,
        isOffRoute: PropTypes.bool.isRequired,
        idleTime: PropTypes.number.isRequired,
        lastUpdated: PropTypes.string.isRequired
    })).isRequired,
    handleViewHistory: PropTypes.func.isRequired
};
    const { t } = useTranslation();
    return (
        <Card className="w-96 border-l">
            <CardHeader>
                <CardTitle>{t('Driver Locations')}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead isFixed>{t('Driver')}</TableHead>
                            <TableHead>{t('Status')}</TableHead>
                            <TableHead>{t('Last Updated')}</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {drivers.map(driver => (
                            <TableRow key={driver.id}>
                                <TableCell isFixed>{driver.name}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {driver.status === 'on_route' && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Truck className="h-4 w-4 text-green-500" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{t('On Route')}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        {driver.status === 'idle' && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Clock className="h-4 w-4 text-yellow-500" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Idle for {driver.idleTime} minutes</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        {driver.isOffRoute && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Driver is off route</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{driver.lastUpdated}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewHistory(driver)}
                                    >
                                        History
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default DriverLocationsTable;
