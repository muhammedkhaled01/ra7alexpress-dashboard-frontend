import { Button } from '@/components/ui/button';
import { Download, Plus } from 'lucide-react';
import PropTypes from 'prop-types';

export default function StockActions({ onExport, onAdd, t }) {
    return (
        <div className="flex gap-2">
            <Button variant="outline" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                {t('Export CSV')}
            </Button>
            <Button onClick={onAdd}>
                <Plus className="w-4 h-4 mr-2" />
                {t('Add Item')}
            </Button>
        </div>
    );
}

StockActions.propTypes = {
    onExport: PropTypes.func.isRequired,
    onAdd: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
};
