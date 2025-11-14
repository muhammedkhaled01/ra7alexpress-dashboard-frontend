import { useTranslation } from "react-i18next";

export default function DeliveryTimeLabel({ futureDateString }) {
    const { t } = useTranslation();
    const futureDate = new Date(futureDateString);
    const today = new Date();

    const todayNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const futureNoTime = new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate());

    const diffTime = futureNoTime.getTime() - todayNoTime.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let label = '';
    let colorClass = '';

    if (diffDays === 0) {
        label = t('DELIVERY TODAY');
        colorClass = 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100';
    } else if (diffDays === 1) {
        label = t('DELIVERY TOMORROW');
        colorClass = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100';
    } else if (diffDays > 1 && diffDays <= 7) {
        label = t('IN {{count}} DAYS', { count: diffDays }); // استخدام الترجمة لتوافق الأرقام
        colorClass = 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100';
    } else if (diffDays > 7) {
        label = t('FUTURE DELIVERY');
        colorClass = 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100';
    } else {
        return null;
    }

    return (
        <span
            className={`mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${colorClass} transition-colors duration-300 shadow-sm`}
        >
            {label.toLowerCase()}
        </span>
    );
}