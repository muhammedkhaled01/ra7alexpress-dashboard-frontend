import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropTypes from 'prop-types';
import Loader from '@/components/Loader';

const getStatusColor = (slot) => {
    if (slot.used_count >= slot.capacity) return 'destructive';
    if (slot.used_count >= slot.capacity * 0.8) return 'warning';
    return 'success';
};

const formatTimeRange = (startTime, endTime) => {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    
    const formatTime = (time) => {
        const hours = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    return `${formatTime(start)} - ${formatTime(end)}`;
};

const SlotTable = ({ slots, onEdit, onDelete, t, loading }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('Slot ID')}</TableHead>
                    <TableHead isFixed>{t('Date')}</TableHead>
                    <TableHead>{t('Time Range')}</TableHead>
                    <TableHead>{t('Capacity')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">
                            <Loader />
                        </TableCell>
                    </TableRow>
                )}
                {!loading && slots.map(slot => (
                    <TableRow key={slot.id}>
                        <TableCell>{slot.id}</TableCell>
                        <TableCell isFixed>{new Date(slot.date).toLocaleDateString()}</TableCell>
                        <TableCell>{formatTimeRange(slot.start_time, slot.end_time)}</TableCell>
                        <TableCell>{slot.used_count} / {slot.capacity}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusColor(slot)}>
                                {slot.status === 'full' ? t('Full') : t('Available')}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => onEdit(slot)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="icon"
                                    onClick={() => onDelete(slot.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

SlotTable.propTypes = {
    slots: PropTypes.array.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired
};

export default SlotTable;
