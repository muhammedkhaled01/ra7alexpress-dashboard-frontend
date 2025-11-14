import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getQuickStats } from '@/stores/features/dashboardFeature';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
    Package,
    CheckCircle,
    AlertTriangle,
    Users,
    RefreshCw
} from 'lucide-react';
import Loader from '../Loader';
import { Button } from '@/components/ui/button';
import { can, isAuthorized } from '@/utils/helpers';

const StatWidget = ({ icon, value, label, route, isWarning = false, color = 'text-primary', disableClick = false }) => {
    const widgetContent = (
        <div className={`
            rounded-lg border bg-muted 
            ${isWarning ? 'border-red-200 bg-red-50/50' : ''}
            p-6 shadow hover:shadow-md transition-all 
            flex flex-col justify-between gap-2
            ${disableClick ? 'opacity-50 cursor-not-allowed' : ''}
        `}>
            <div className="flex flex-col items-start gap-3">
                <div className="bg-white dark:bg-gray-900 p-2 rounded-full">
                    {icon}
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
            </div>
            <div className={`text-3xl font-bold ${color}`}>
                {value}
            </div>
        </div>
    );

    return disableClick ? (
        <div className="block">{widgetContent}</div>
    ) : (
        <Link to={route} className="block">{widgetContent}</Link>
    );
};

export default function QuickStats() {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { quickStats, loading } = useSelector((state) => state.dashboard);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const navigate = useNavigate()

    const canAccess = can("Analytics access")

    useEffect(() => {
        dispatch(getQuickStats());
        if (!canAccess) {
            return navigate("/unauthorized");
        }

    }, [dispatch]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        dispatch(getQuickStats());
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    if (loading || !quickStats) {
        return <div className="text-center py-10"><Loader /></div>;
    }

    StatWidget.propTypes = {
        icon: PropTypes.element.isRequired,
        value: PropTypes.number.isRequired,
        label: PropTypes.string.isRequired,
        route: PropTypes.string.isRequired,
        isWarning: PropTypes.bool,
        color: PropTypes.string,
        disableClick: PropTypes.bool
    }

    const statsData = [
        {
            icon: <Package className="w-8 h-8 text-blue-500" />,
            value: Number(quickStats?.shipments_in_progress),
            label: t('Shipments in Progress'),
            route: '/shipments?status=OFD',
            color: Number(quickStats?.shipments_in_progress) > 10 ? 'text-red-500' : 'text-green-500'
        },
        {
            icon: <CheckCircle className="w-8 h-8 text-green-500" />,
            value: Number(quickStats?.delivered_today),
            label: t('Delivered Today'),
            route: '/shipments?status=DELIVERED',
            color: Number(quickStats?.delivered_today) > 50 ? 'text-green-600 font-extrabold' : 'text-yellow-500'
        },
        {
            icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
            value: Number(quickStats?.pending_issues),
            label: t('Pending Issues'),
            route: '/shipments?status=in_exception',
            isWarning: Number(quickStats?.pending_issues) > 0,
            color: Number(quickStats?.pending_issues) > 5 ? "text-red-600 font-extrabold" : "text-yellow-500"
        },
        {
            icon: <Users className="w-8 h-8 text-purple-500" />,
            value: Number(quickStats?.active_drivers),
            label: t('Active Drivers'),
            route: '/drivers',
            color: Number(quickStats?.active_drivers) < 3 ? 'text-red-500' : 'text-green-500'
        }
    ];

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow p-2 md:p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('Operational Quick Stats')}</h2>
                <Button
                    variant="refresh"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className=""
                >
                    <RefreshCw />
                </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, index) => (
                    <StatWidget
                        key={index}
                        icon={stat.icon}
                        value={stat.value}
                        label={stat.label}
                        route={stat.route}
                        isWarning={stat.isWarning}
                        color={stat.color}
                        disableClick={stat.disableClick}
                    />
                ))}
            </div>
        </div>
    );
}
