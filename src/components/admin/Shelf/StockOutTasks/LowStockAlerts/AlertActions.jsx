import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

export default function AlertActions({ onAddAlert }) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
            <h1 className="text-2xl font-bold">{t('Low Stock Alerts')}</h1>
            <Button onClick={onAddAlert}>
                <Plus className="w-4 h-4 mr-2" />
                {t('Set Up Alert')}
            </Button>
        </div>
    );
}

AlertActions.propTypes = {
    onAddAlert: PropTypes.func.isRequired
};
