import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, FileDown, ClipboardList } from 'lucide-react';
import Select from '@/components/misc/Select';
import { toast } from 'react-hot-toast';
import { Textarea } from '@/components/ui/textarea';

// Mock data generator
const generateMockIncidents = () => [
    {
        id: 'INC001',
        date: '2025-05-15T10:30:00',
        location: 'Warehouse A',
        description: 'Near miss: Forklift operation incident',
        reportedBy: 'John Doe',
        assignedTo: 'Safety Officer 1',
        status: 'Under Investigation',
        severity: 'Medium',
        attachments: ['photo1.jpg'],
        notes: 'Investigation in progress'
    },
    {
        id: 'INC002',
        date: '2025-05-14T15:45:00',
        location: 'Loading Bay 2',
        description: 'Minor injury during package handling',
        reportedBy: 'Jane Smith',
        assignedTo: 'Safety Officer 2',
        status: 'Open',
        severity: 'Low',
        attachments: [],
        notes: ''
    },
    {
        id: 'INC003',
        date: '2025-05-13T09:15:00',
        location: 'Sorting Area',
        description: 'Equipment malfunction',
        reportedBy: 'Mike Johnson',
        assignedTo: 'Safety Officer 1',
        status: 'Resolved',
        severity: 'High',
        attachments: ['report.pdf', 'photo2.jpg'],
        notes: 'Equipment replaced and new safety protocols implemented'
    }
];

// Safety officers for assignment
const safetyOfficers = [
    { value: 'officer1', label: 'Safety Officer 1' },
    { value: 'officer2', label: 'Safety Officer 2' },
    { value: 'officer3', label: 'Safety Officer 3' }
];

// Status options
const statusOptions = [
    { value: 'Open', label: 'Open' },
    { value: 'Under Investigation', label: 'Under Investigation' },
    { value: 'Resolved', label: 'Resolved' }
];

// Severity options
const severityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' }
];

export default function SafetyIncidents() {
    const { t } = useTranslation();
    const [incidents, setIncidents] = useState(generateMockIncidents());
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [formData, setFormData] = useState({
        date: '',
        location: '',
        description: '',
        severity: '',
        assignedTo: '',
        attachments: [],
        notes: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const newIncident = {
            id: `INC${String(incidents.length + 1).padStart(3, '0')}`,
            date: formData.date,
            location: formData.location,
            description: formData.description,
            reportedBy: 'Current User', // This would come from auth context
            assignedTo: safetyOfficers.find(officer => officer.value === formData.assignedTo)?.label,
            status: 'Open',
            severity: formData.severity,
            attachments: Array.from(formData.attachments).map(file => file.name),
            notes: ''
        };
        setIncidents(prev => [...prev, newIncident]);
        toast.success(t('Incident reported successfully'));
        handleCloseDialog();
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        if (!selectedIncident) return;

        setIncidents(prev => prev.map(incident => {
            if (incident.id === selectedIncident.id) {
                return {
                    ...incident,
                    status: formData.status || incident.status,
                    assignedTo: formData.assignedTo ?
                        safetyOfficers.find(officer => officer.value === formData.assignedTo)?.label :
                        incident.assignedTo,
                    notes: formData.notes || incident.notes
                };
            }
            return incident;
        }));

        toast.success(t('Incident updated successfully'));
        handleCloseDialog();
    };

    const handleCloseDialog = () => {
        setShowReportDialog(false);
        setShowUpdateDialog(false);
        setSelectedIncident(null);
        setFormData({
            date: '',
            location: '',
            description: '',
            severity: '',
            assignedTo: '',
            attachments: [],
            notes: ''
        });
    };

    const handleInvestigate = (incident) => {
        setSelectedIncident(incident);
        setFormData({
            status: incident.status,
            assignedTo: safetyOfficers.find(officer => officer.label === incident.assignedTo)?.value || '',
            notes: incident.notes
        });
        setShowUpdateDialog(true);
    };

    const exportToCSV = () => {
        const headers = ['Incident ID', 'Date', 'Location', 'Description', 'Reported By', 'Assigned To', 'Status', 'Severity', 'Notes'];
        const data = incidents.map(incident => [
            incident.id,
            new Date(incident.date).toLocaleString(),
            incident.location,
            incident.description,
            incident.reportedBy,
            incident.assignedTo,
            incident.status,
            incident.severity,
            incident.notes
        ]);

        const csvContent = [
            headers.join(','),
            ...data.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'safety_incidents.csv';
        link.click();
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{t('Safety Incidents')}</h1>
                <div className="flex space-x-2">
                    <Button onClick={exportToCSV} variant="outline">
                        <FileDown className="w-4 h-4 mr-2" />
                        {t('Export CSV')}
                    </Button>
                    <Button onClick={() => setShowReportDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('Report Incident')}
                    </Button>
                </div>
            </div>

            {/* Incidents Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('Incident List')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Incident ID')}</TableHead>
                                <TableHead isFixed>{t('Date')}</TableHead>
                                <TableHead>{t('Location')}</TableHead>
                                <TableHead>{t('Description')}</TableHead>
                                <TableHead>{t('Reported By')}</TableHead>
                                <TableHead>{t('Status')}</TableHead>
                                <TableHead>{t('Severity')}</TableHead>
                                <TableHead>{t('Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {incidents.map((incident) => (
                                <TableRow key={incident.id}>
                                    <TableCell>{incident.id}</TableCell>
                                    <TableCell isFixed>{new Date(incident.date).toLocaleString()}</TableCell>
                                    <TableCell>{incident.location}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{incident.description}</TableCell>
                                    <TableCell>{incident.reportedBy}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={{
                                                'Open': 'default',
                                                'Under Investigation': 'warning',
                                                'Resolved': 'success'
                                            }[incident.status]}
                                        >
                                            {incident.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={{
                                                'Low': 'default',
                                                'Medium': 'warning',
                                                'High': 'destructive'
                                            }[incident.severity]}
                                        >
                                            {incident.severity}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleInvestigate(incident)}
                                        >
                                            <ClipboardList className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Report Incident Dialog */}
            <Dialog open={showReportDialog} onOpenChange={handleCloseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Report Safety Incident')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div>
                                <label className="block mb-2">{t('Date and Time')}</label>
                                <Input
                                    type="datetime-local"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2">{t('Location')}</label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2">{t('Description')}</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2">{t('Severity')}</label>
                                <Select
                                    options={severityOptions}
                                    value={severityOptions.find(opt => opt.value === formData.severity)}
                                    onChange={(opt) => setFormData(prev => ({ ...prev, severity: opt.value }))}
                                />
                            </div>
                            <div>
                                <label className="block mb-2">{t('Assign To')}</label>
                                <Select
                                    options={safetyOfficers}
                                    value={safetyOfficers.find(officer => officer.value === formData.assignedTo)}
                                    onChange={(opt) => setFormData(prev => ({ ...prev, assignedTo: opt.value }))}
                                />
                            </div>
                            <div>
                                <label className="block mb-2">{t('Attachments')}</label>
                                <Input
                                    type="file"
                                    multiple
                                    onChange={(e) => setFormData(prev => ({ ...prev, attachments: e.target.files }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">{t('Submit Report')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Update Incident Dialog */}
            <Dialog open={showUpdateDialog} onOpenChange={handleCloseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('Update Incident')} - {selectedIncident?.id}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate}>
                        <div className="grid gap-4 py-4">
                            <div>
                                <label className="block mb-2">{t('Status')}</label>
                                <Select
                                    options={statusOptions}
                                    value={statusOptions.find(opt => opt.value === formData.status)}
                                    onChange={(opt) => setFormData(prev => ({ ...prev, status: opt.value }))}
                                />
                            </div>
                            <div>
                                <label className="block mb-2">{t('Assign To')}</label>
                                <Select
                                    options={safetyOfficers}
                                    value={safetyOfficers.find(officer => officer.value === formData.assignedTo)}
                                    onChange={(opt) => setFormData(prev => ({ ...prev, assignedTo: opt.value }))}
                                />
                            </div>
                            <div>
                                <label className="block mb-2">{t('Investigation Notes')}</label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder={t('Add investigation findings and recommendations...')}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">{t('Update Incident')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
