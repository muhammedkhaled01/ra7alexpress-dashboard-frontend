import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import PropTypes from 'prop-types';

export default function SlotActions({ onCreate, t }) {
    return (
        <Button 
            onClick={onCreate}
            title={t('Create New Slot')}
        >
            <PlusCircle className="mr-2" /> {t('Create Slot')}
        </Button>
    );
}

SlotActions.propTypes = {
    onCreate: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
};
