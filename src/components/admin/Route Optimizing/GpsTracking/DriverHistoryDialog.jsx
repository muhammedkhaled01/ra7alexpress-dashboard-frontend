import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatDecimalValue } from '@/utils/helpers';
import { Clock, MapPin, Truck } from 'lucide-react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

const DriverHistoryDialog = ({ showHistory, setShowHistory, selectedDriver, driverHistory }) => {
    DriverHistoryDialog.propTypes = {
        showHistory: PropTypes.bool.isRequired,
        setShowHistory: PropTypes.func.isRequired,
        selectedDriver: PropTypes.shape({
            id: PropTypes.number,
            name: PropTypes.string
        }).isRequired,
        driverHistory: PropTypes.arrayOf(PropTypes.shape({
            timestamp: PropTypes.string.isRequired,
            status: PropTypes.string.isRequired,
            location: PropTypes.shape({
                lat: PropTypes.number.isRequired,
                lng: PropTypes.number.isRequired
            }).isRequired
        })).isRequired
    };
    const { decimalPrecision } = useSelector((state) => state.setting)

    return (
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {selectedDriver?.name} - Route History
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {driverHistory.map((entry, index) => (
                        <div key={index} className="flex items-start gap-4">
                            <div className="min-w-[100px] text-sm text-gray-500">
                                <Clock className="h-4 w-4 inline-block mr-1" />
                                {entry.timestamp}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    {entry.status === 'Started Route' && (
                                        <Truck className="h-4 w-4 text-green-500" />
                                    )}
                                    {entry.status === 'Delivery Complete' && (
                                        <MapPin className="h-4 w-4 text-blue-500" />
                                    )}
                                    <span className="font-medium">{entry.status}</span>
                                </div>
                                <div className="text-sm text-gray-500">
                                    <MapPin className="h-4 w-4 inline-block mr-1" />
                                    Lat: {formatDecimalValue(entry.location.lat, decimalPrecision)}, Lng: {formatDecimalValue(entry.location.lng, decimalPrecision)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DriverHistoryDialog;
