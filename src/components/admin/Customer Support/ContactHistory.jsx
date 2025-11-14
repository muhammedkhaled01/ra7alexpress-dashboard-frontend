import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { CalendarIcon, Search, FileDown, Eye } from 'lucide-react';
import Select from '@/components/misc/Select';
import ExportDialog from '@/components/misc/ExportDialog';
import { useTranslation } from 'react-i18next';

export default function ContactHistory() {
    const { t } = useTranslation();
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);

    // Test data
    const contacts = [
        { 
            id: 'CNT001', 
            customerName: 'John Doe', 
            method: 'Chat',
            date: '2025-05-15 10:30 AM',
            agentName: 'Agent Smith',
            summary: 'Package delivery inquiry',
            transcript: 'Customer: Where is my package?\nAgent: Let me check that for you...'
        },
        { 
            id: 'CNT002', 
            customerName: 'Jane Smith', 
            method: 'Email',
            date: '2025-05-15 11:15 AM',
            agentName: 'Agent Johnson',
            summary: 'Refund request',
            transcript: 'Customer requested refund for damaged package...'
        },
    ];

    const contactMethods = [
        { value: 'all', label: t('All Methods') },
        { value: 'chat', label: t('Chat') },
        { value: 'email', label: t('Email') },
        { value: 'phone', label: t('Phone') },
    ];

    const handleExport = () => {
        setShowExportDialog(true);
    };

    const handleViewDetails = (contact) => {
        setSelectedContact(contact);
    };

    return (
        <div className="p-4 space-y-4">
            <Card className="p-4">
                <div className="flex flex-wrap gap-4 mb-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("Search by customer name or contact ID...")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, 'PPP') : <span>{t("Start date")}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, 'PPP') : <span>{t("End date")}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={setEndDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Contact Method Filter */}
                    <Select
                        options={contactMethods}
                        value={selectedMethod}
                        onChange={setSelectedMethod}
                        placeholder={t("Contact Method")}
                        className="w-[200px]"
                    />

                    {/* Export Button */}
                    <Button variant="outline" onClick={handleExport}>
                        <FileDown className="mr-2 h-4 w-4" />
                        {t("Export")}
                    </Button>
                </div>

                {/* Contact History Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead isFixed>{t("Contact ID")}</TableHead>
                                <TableHead>{t("Customer Name")}</TableHead>
                                <TableHead>{t("Method")}</TableHead>
                                <TableHead>{t("Date")}</TableHead>
                                <TableHead>{t("Agent")}</TableHead>
                                <TableHead>{t("Summary")}</TableHead>
                                <TableHead>{t("Actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contacts.map((contact) => (
                                <TableRow key={contact.id}>
                                    <TableCell isFixed>{contact.id}</TableCell>
                                    <TableCell>{contact.customerName}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{contact.method}</Badge>
                                    </TableCell>
                                    <TableCell>{contact.date}</TableCell>
                                    <TableCell>{contact.agentName}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{contact.summary}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleViewDetails(contact)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Export Dialog */}
            {showExportDialog && (
                <ExportDialog
                    model="contacts"
                    endpoint="/api/contacts/export"
                    onClose={() => setShowExportDialog(false)}
                    title="Export Contact History"
                    fields={[
                        { id: 'id', label: 'Contact ID' },
                        { id: 'customerName', label: 'Customer Name' },
                        { id: 'method', label: 'Contact Method' },
                        { id: 'date', label: 'Date' },
                        { id: 'agentName', label: 'Agent Name' },
                        { id: 'summary', label: 'Summary' },
                        { id: 'transcript', label: 'Full Transcript' },
                    ]}
                    filters={[
                        { id: 'startDate', value: startDate },
                        { id: 'endDate', value: endDate },
                        { id: 'method', value: selectedMethod?.value },
                        { id: 'search', value: searchTerm },
                    ]}
                />
            )}

            {/* View Details Dialog */}
            {selectedContact && (
                <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{t("Contact Details")} - {selectedContact.id}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium">{t("Customer Name")}</p>
                                    <p className="text-sm text-muted-foreground">{selectedContact.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{t("Contact Method")}</p>
                                    <Badge variant="outline">{selectedContact.method}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{t("Date")}</p>
                                    <p className="text-sm text-muted-foreground">{selectedContact.date}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{t("Agent")}</p>
                                    <p className="text-sm text-muted-foreground">{selectedContact.agentName}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-2">{t("Transcript")}</p>
                                <Card className="p-4 whitespace-pre-wrap text-sm text-muted-foreground">
                                    {selectedContact.transcript}
                                </Card>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
