import { Button } from '@/components/ui/button';
import PropTypes from 'prop-types';

export default function ReminderActions({ onCreate, t }) {
    return (
        <Button 
            onClick={onCreate}
            title={t('Create New Reminder')}
        >
            {t('Create Reminder')}
        </Button>
    );
}

ReminderActions.propTypes = {
    onCreate: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
};
