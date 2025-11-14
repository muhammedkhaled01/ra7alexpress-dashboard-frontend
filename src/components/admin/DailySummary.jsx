import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import PropTypes from 'prop-types';
import { getDailySummary } from '@/stores/features/dashboardFeature';
import Loader from '../Loader';
import { can, isAuthorized } from '@/utils/helpers';

const StatWidget = ({ icon, value, label, route, isWarning = false, color = 'text-primary' }) => {
    StatWidget.propTypes = {
        icon: PropTypes.element.isRequired,
        value: PropTypes.number.isRequired,
        label: PropTypes.string.isRequired,
        route: PropTypes.string.isRequired,
        isWarning: PropTypes.bool,
        color: PropTypes.string
    };
    return (
        <Link to={route} className='block'>
            <div className={`
                rounded-lg border bg-muted 
                ${isWarning ? 'border-red-200 bg-red-50/50' : ''}
                p-6 shadow hover:shadow-md transition-all 
                flex flex-col justify-between gap-2
            `}>
                <div className='flex flex-col items-start gap-3'>
                    <div className='bg-white dark:bg-gray-900 p-2 rounded-full'>
                        {icon}
                    </div>
                    <h3 className='text-sm font-medium text-muted-foreground'>{label}</h3>
                </div>
                <div className={`text-3xl font-bold ${color}`}>
                    {value}
                </div>
            </div>
        </Link>
    );
};

export default function DailySummary() {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { dailySummary, loading } = useSelector((state) => state.dashboard);
    const navigate = useNavigate();
    
    // State for selected date (default to today)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const canAccess = can("Dashboard access");

    useEffect(() => {
        if (!canAccess) {
            return navigate("/unauthorized");
        }
        // Fetch data for the selected date
        dispatch(getDailySummary(selectedDate));
    }, [selectedDate]);

    // Handle date change
    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
    };

    if (loading || !dailySummary) {
        return <div className='text-center py-10'><Loader /></div>;
    }

    // Format date for URL parameters
    const formatDateForUrl = (date) => {
        return date; // Date is already in YYYY-MM-DD format
    };

    const summaryData = [
        {
            icon: <CheckCircle className='w-8 h-8 text-green-500' />,
            value: Number(dailySummary?.completed_shipments),
            label: t('Completed Shipments'),
            route: `/shipments?status=DELIVERED&date=${formatDateForUrl(selectedDate)}`,
            color: Number(dailySummary?.completed_shipments) > 50 ? 'text-green-600 font-extrabold' : 'text-green-500'
        },
        {
            icon: <AlertTriangle className='w-8 h-8 text-yellow-500' />,
            value: Number(dailySummary?.pending_shipments),
            label: t('Pending Shipments'),
            route: `/shipments?status=OFD&date=${formatDateForUrl(selectedDate)}`,
            isWarning: Number(dailySummary?.pending_shipments) > 0,
            color: Number(dailySummary?.pending_shipments) > 10 ? 'text-red-600 font-extrabold' : 'text-yellow-500'
        }
    ];

    return (
        <div className='space-y-6'>
            {/* Date Filter Section */}
            <div className='bg-white dark:bg-gray-800 rounded-lg border p-4'>
                <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-2'>
                        <Calendar className='w-5 h-5 text-muted-foreground' />
                        <label htmlFor="summary-date" className='text-sm font-medium text-muted-foreground'>
                            {t('Select Date')}:
                        </label>
                    </div>
                    <div className='relative'>
                        <input
                            id="summary-date"
                            type="date"
                            value={selectedDate}
                            onChange={handleDateChange}
                            className='px-3 py-2 border dark:bg-gray-900 dark:border-gray-900 dark:text-gray-100 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer'
                            max={new Date().toISOString().split('T')[0]} // Prevent future dates
                        />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                {summaryData.map((stat, index) => (
                    <StatWidget
                        key={index}
                        icon={stat.icon}
                        value={stat.value}
                        label={stat.label}
                        route={stat.route}
                        isWarning={stat.isWarning}
                        color={stat.color}
                    />
                ))}
            </div>
        </div>
    );
}
