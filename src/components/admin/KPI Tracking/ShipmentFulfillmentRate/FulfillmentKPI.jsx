import PropTypes from 'prop-types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function FulfillmentKPI({ currentRate }) {

FulfillmentKPI.propTypes = {
    currentRate: PropTypes.string.isRequired
};
    const { t } = useTranslation();

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-4xl font-bold">{currentRate}%</div>
                        <div className="text-sm text-muted-foreground mt-1">{t('Current Fulfillment Rate')}</div>
                        {currentRate < 90 && (
                            <Badge variant="destructive" className="mt-2">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                {t('Below Target')}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
