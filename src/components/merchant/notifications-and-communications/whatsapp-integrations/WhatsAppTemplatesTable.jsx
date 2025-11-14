import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import PropTypes from 'prop-types';

const WhatsAppTemplatesTable = ({ templates, onTest, t }) => {
    const events = [
        { value: 'created', label: t('Shipment Created') },
        { value: 'delivered', label: t('Shipment Delivered') },
        { value: 'in_transit', label: t('In Transit') },
        { value: 'delayed', label: t('Delayed') },
        { value: 'cancelled', label: t('Cancelled') }
    ];

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('Event')}</TableHead>
                    <TableHead>{t('Template Used')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {events.map((event) => (
                    <TableRow key={event.value}>
                        <TableCell>{event.label}</TableCell>
                        <TableCell>
                            {templates[event.value] || t('Not configured')}
                        </TableCell>
                        <TableCell>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onTest(event.value)}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                {t('Test')}
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

WhatsAppTemplatesTable.propTypes = {
    templates: PropTypes.object.isRequired,
    onTest: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
};

export default WhatsAppTemplatesTable;
