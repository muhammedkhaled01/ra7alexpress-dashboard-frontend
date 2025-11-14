import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import PropTypes from 'prop-types';

export default function RuleActions({ onCreate, t }) {
    return (
        <Button
            onClick={onCreate}
            title={t('Create New Rule')}
        >
            <Plus className="w-4 h-4 mr-2" />
            {t('Create Rule')}
        </Button>
    );
}

RuleActions.propTypes = {
    onCreate: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
};
