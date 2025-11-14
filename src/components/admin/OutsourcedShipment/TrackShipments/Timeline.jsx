import PropTypes from 'prop-types';
import { useTranslation } from "react-i18next";

const statusColors = {
    "Shipment Placed": "bg-blue-500",
    "Processing": "bg-yellow-500",
    "In Transit": "bg-green-500",
    "Delivered": "bg-green-500",
    "Cancelled": "bg-red-500",
    "DELIVERY_EXCEPTION": "bg-red-500"
};

function Timeline({ shipmentData }) {
    const { t } = useTranslation();

    return (
        <div className="relative overflow-hidden">
            <div className="absolute left-4 top-0 h-full w-0.5 bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
            <div className="space-y-8">
                {shipmentData.timeline.map((item, index) => (
                    <div key={index} className="relative group">
                        <div className="absolute left-0 h-6 w-6 -ml-3 flex items-center justify-center">
                            <div className="relative">
                                <div className={`h-4 w-4 rounded-full ${statusColors[item.type]} border-2 border-white dark:border-gray-800`} />
                                <div className="absolute inset-0 rounded-full bg-white dark:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        </div>
                        <div className="ml-8 flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 transform group-hover:translate-x-2 transition-transform duration-300">
                            <div className="flex items-center gap-3">
                                <div className={`h-3 w-3 rounded-full ${statusColors[item.type]} border-2 border-white dark:border-gray-800`} />
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                    {item.type}
                                </h3>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{t("Time")}:</span> {item.time}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-400">
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{t("Details")}:</span> {item.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

Timeline.propTypes = {
    shipmentData: PropTypes.shape({
        timeline: PropTypes.arrayOf(PropTypes.shape({
            type: PropTypes.string.isRequired,
            time: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired
        })).isRequired
    }).isRequired
};

export default Timeline;
