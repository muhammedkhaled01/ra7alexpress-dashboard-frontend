import { CalendarDays } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import Select from '@/components/misc/Select';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

const DeliveryScheduleFilters = ({
    dateRange,
    setDateRange,
    availableSlots,
    selectedSlot,
    setSelectedSlot,
    selectedStatus,
    setSelectedStatus,
    t
}) => {
    const slotOptions = availableSlots.map(slot => ({
        value: slot.id,
        label: `${format(new Date(slot.date), 'PP')} ${slot.timeRange}`
    }));

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
                <CalendarDays className="h-5 w-5" />
                <Calendar
                    selected={dateRange}
                    onSelect={setDateRange}
                    mode="range"
                    className="md:rounded-md md:border"
                />
            </div>
            <Select
                options={slotOptions}
                value={slotOptions.find(opt => opt.value === selectedSlot)}
                onChange={(opt) => setSelectedSlot(opt?.value)}
                placeholder={t('Select Slot')}
            />
            <Select
                options={[
                    { value: '', label: t('All Statuses') },
                    { value: 'Scheduled', label: t('Scheduled') },
                    { value: 'In Progress', label: t('In Progress') },
                    { value: 'Delivered', label: t('Delivered') }
                ]}
                value={[
                    { value: '', label: t('All Statuses') },
                    { value: 'Scheduled', label: t('Scheduled') },
                    { value: 'In Progress', label: t('In Progress') },
                    { value: 'Delivered', label: t('Delivered') }
                ].find(opt => opt.value === selectedStatus)}
                onChange={(opt) => setSelectedStatus(opt?.value)}
                placeholder={t('Filter Status')}
            />
        </div>
    );
};

DeliveryScheduleFilters.propTypes = {
    dateRange: PropTypes.object.isRequired,
    setDateRange: PropTypes.func.isRequired,
    availableSlots: PropTypes.array.isRequired,
    selectedSlot: PropTypes.string,
    setSelectedSlot: PropTypes.func.isRequired,
    selectedStatus: PropTypes.string,
    setSelectedStatus: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
};

export default DeliveryScheduleFilters;
