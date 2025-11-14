import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Plus, MessageSquare, ExternalLink, RefreshCcw } from 'lucide-react';
import { hasRole, handleError, authUser } from '@/utils/helpers';
import axiosMerchant from '@/axios';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import Loader from '@/components/Loader';
import { useSelector } from 'react-redux';
import Pagination from "@/components/Pagination";

export default function Tickets() {
    const { t } = useTranslation();
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [showUpdateTicket, setShowUpdateTicket] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [tickets, setTickets] = useState({ data: [], total: 0, current_page: 1, last_page: 1 });
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(10);
    const [refreshBtn, setRefreshBtn] = useState(false);
    const [links, setLinks] = useState([]);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const user = useSelector(state => state.auth.user);

    const isCustomerService = hasRole('Customer Service');
    const isAdmin = hasRole(['Admin', 'Super Admin']);
    // Fetch tickets from API
    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                per_page: perPage,
            });

            if (searchQuery) {
                params.append('query', searchQuery);
            }

            const response = await axiosMerchant.get(`/tickets?${params.toString()}&page=${currentPage}&per_page=${itemsPerPage}`);
            setTickets(response.data.data);
            setLinks(response.data.data.links || []);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch customer service agents
    const fetchAgents = async () => {
        try {
            const response = await axiosMerchant.get('/tickets/agents');
            setAgents(response.data.data);
        } catch (error) {
            handleError(error);
        }
    };

    // Create new ticket
    const handleCreateTicket = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            await axiosMerchant.post('/tickets/store', {
                customer_name: formData.get('customerName'),
                customer_email: formData.get('customerEmail'),
                subject: formData.get('subject'),
                description: formData.get('description'),
                priority: formData.get('priority'),
                category: 'General'
            });

            setShowNewTicket(false);
            toast.success(t('Ticket created successfully'));
            fetchTickets();
        } catch (error) {
            handleError(error);
        }
    };

    // Assign ticket to agent
    const handleAssign = async (ticketId, agentId) => {
        try {
            await axiosMerchant.post('/tickets/update', {
                id: ticketId,
                assigned_agent_id: agentId,
                status: 'IN_PROGRESS'
            });

            const agent = agents.find(a => a.id == agentId);
            toast.success(t('Ticket assigned to {{agent}}', { agent: agent?.name }));
            fetchTickets();
        } catch (error) {
            handleError(error);
        }
    };

    // Update ticket status
    const handleUpdateStatus = async (ticketId, status) => {
        try {
            await axiosMerchant.post('/tickets/update', {
                id: ticketId,
                status: status
            });

            toast.success(t('Ticket status updated'));
            fetchTickets();
        } catch (error) {
            handleError(error);
        }
    };

    // Add comment to ticket
    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            await axiosMerchant.post(`/tickets/${selectedTicket.id}/comments`, {
                comment: newComment
            });

            setNewComment('');
            toast.success(t('Comment added'));

            // Refresh ticket details
            const response = await axiosMerchant.get(`/tickets/show/${selectedTicket.id}`);
            setSelectedTicket(response.data.data || []);
        } catch (error) {
            handleError(error);
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Open chat session for ticket
    const handleOpenChat = async (ticketId) => {
        try {
            const response = await axiosMerchant.get(`/tickets/${ticketId}/chat`);
            const { chat_session_id } = response.data.data;

            // Navigate to chat page - you'll need to implement this route
            window.location.href = `/admin/chat/${chat_session_id}`;
        } catch (error) {
            handleError(error);
        }
    };

    // Load data on component mount
    useEffect(() => {
        fetchTickets();
        if (isAdmin) {
            fetchAgents();
        }
    }, [currentPage, itemsPerPage]);

    // Search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setCurrentPage(1);
            fetchTickets();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const getStatusBadge = (status) => {
        const colors = {
            'OPEN': 'bg-red-500',
            'IN_PROGRESS': 'bg-yellow-500',
            'PENDING': 'bg-blue-500',
            'RESOLVED': 'bg-green-500',
            'CLOSED': 'bg-gray-500'
        };
        return <Badge className={colors[status] || 'bg-gray-500'}>{t(status)}</Badge>;
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            'LOW': 'bg-green-100 text-green-800',
            'MEDIUM': 'bg-yellow-100 text-yellow-800',
            'HIGH': 'bg-orange-100 text-orange-800',
            'URGENT': 'bg-red-100 text-red-800'
        };
        return <Badge className={colors[priority] || 'bg-gray-100 text-gray-800'}>{t(priority)}</Badge>;
    };
    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('Support Tickets')} {isCustomerService && `- (${user.name})`}</h2>
                    <p className="text-muted-foreground">
                        {isCustomerService
                            ? t('Manage tickets assigned to you')
                            : t('Manage customer support tickets')
                        }
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-col md:flex-row">

                    <div className="flex md:items-center flex-col md:flex-row gap-2">
                        {/* Search Input */}
                        <Input
                            placeholder={t('Search tickets...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64"
                        />

                        {/* Create Ticket Button - Only for admins */}
                        {isAdmin && (
                            <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
                                {/* <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('Create Ticket')}
                                    </Button>
                                </DialogTrigger> */}
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{t('Create New Ticket')}</DialogTitle>
                                        <DialogDescription>
                                            {t('Fill in the details to create a new support ticket')}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateTicket} className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="customerName">{t('Customer Name')}</Label>
                                            <Input id="customerName" name="customerName" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="customerEmail">{t('Customer Email')}</Label>
                                            <Input id="customerEmail" name="customerEmail" type="email" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="subject">{t('Subject')}</Label>
                                            <Input id="subject" name="subject" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="priority">{t('Priority')}</Label>
                                            <Select name="priority" required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('Select priority')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="LOW">{t('Low')}</SelectItem>
                                                    <SelectItem value="MEDIUM">{t('Medium')}</SelectItem>
                                                    <SelectItem value="HIGH">{t('High')}</SelectItem>
                                                    <SelectItem value="URGENT">{t('Urgent')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="description">{t('Description')}</Label>
                                            <Textarea id="description" name="description" required />
                                        </div>
                                        <Button type="submit">{t('Create Ticket')}</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600 dark:text-gray-300">
                            {t("Show")}
                        </label>
                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(selectedOption) => {
                                setItemsPerPage(Number(selectedOption));
                            }}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder={t("Show")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem key={'5'} value={'5'}>5</SelectItem>
                                <SelectItem key={'8'} value={'8'}>8</SelectItem>
                                <SelectItem key={'15'} value={'15'}>15</SelectItem>
                                <SelectItem key={'50'} value={'50'}>50</SelectItem>
                                <SelectItem key={'100'} value={'100'}>100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{t('All Tickets')}</CardTitle>
                        <Button type="button" variant="refresh" onClick={() => {
                            setRefreshBtn(true);
                            fetchTickets();
                            fetchAgents();
                        }}>
                            <RefreshCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Loader />
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead isFixed>{t('Ticket Number')}</TableHead>
                                        <TableHead>{t('Customer')}</TableHead>
                                        <TableHead>{t('Email')}</TableHead>
                                        <TableHead>{t('Subject')}</TableHead>
                                        <TableHead>{t('Priority')}</TableHead>
                                        <TableHead>{t('Status')}</TableHead>
                                        <TableHead>{t('Created')}</TableHead>
                                        <TableHead>{t('Assigned To')}</TableHead>
                                        <TableHead>{t('Actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.data && tickets.data.map(ticket => (
                                        <TableRow key={ticket.id}>
                                            <TableCell isFixed className="font-medium">{ticket.ticket_number}</TableCell>
                                            <TableCell>{ticket.customer_name}</TableCell>
                                            <TableCell>{ticket.customer_email}</TableCell>
                                            <TableCell>{ticket.subject}</TableCell>
                                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                            <TableCell>{format(new Date(ticket.created_at), 'PPp')}</TableCell>
                                            <TableCell>{ticket.assigned_agent?.name || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {/* Chat Button */}
                                                    {(ticket.chat_session_id || ticket.ticket_id) && (
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => handleOpenChat(ticket.id)}
                                                            title={t('Open Chat')}
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    {/* Assign Dropdown - Only for admins */}
                                                    {isAdmin && (
                                                        <Select
                                                            value={ticket.assigned_agent_id?.toString() || ''}
                                                            onValueChange={(agentId) => handleAssign(ticket.id, agentId)}
                                                        >
                                                            <SelectTrigger className="w-[140px]">
                                                                <SelectValue placeholder={t("Assign to")} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {agents.map(agent => (
                                                                    <SelectItem key={agent.id} value={agent.id.toString()}>
                                                                        {agent.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}

                                                    {/* Status Update - Only for assigned agents or admins */}
                                                    {(isAdmin || (isCustomerService && ticket.assigned_agent_id === user.id)) && (
                                                        <Select
                                                            value={ticket.status}
                                                            onValueChange={(status) => handleUpdateStatus(ticket.id, status)}
                                                        >
                                                            <SelectTrigger className="w-[140px]">
                                                                <SelectValue placeholder={t("Update status")} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="OPEN">{t('Open')}</SelectItem>
                                                                <SelectItem value="IN_PROGRESS">{t('In Progress')}</SelectItem>
                                                                <SelectItem value="PENDING">{t('Pending')}</SelectItem>
                                                                <SelectItem value="RESOLVED">{t('Resolved')}</SelectItem>
                                                                <SelectItem value="CLOSED">{t('Closed')}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}

                                                    {/* Comments Button
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedTicket(ticket);
                                                            setShowUpdateTicket(true);
                                                        }}
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                    </Button> */}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Pagination
                                links={links}
                                currentPage={currentPage}
                                onPageChange={handlePageChange}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Ticket Details Dialog */}
            <Dialog open={showUpdateTicket} onOpenChange={setShowUpdateTicket}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('Ticket Details')} - {selectedTicket?.ticket_number}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedTicket && (
                        <div className="space-y-6">
                            <div className="grid gap-4">
                                <div>
                                    <h4 className="font-semibold">{t('Description')}</h4>
                                    <p className="text-muted-foreground">{selectedTicket.description}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">{t('Comments')}</h4>
                                    <div className="space-y-4">
                                        {selectedTicket.comments && selectedTicket.comments.map((comment, index) => (
                                            <div key={index} className="bg-muted p-3 rounded-lg">
                                                <div className="flex justify-between text-sm text-muted-foreground">
                                                    <span>{comment.user?.name || 'System'}</span>
                                                    <span>{format(new Date(comment.created_at), 'PPp')}</span>
                                                </div>
                                                <p className="mt-1">{comment.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Add Comment - Only for assigned agents or admins */}
                                {(isAdmin || (isCustomerService && selectedTicket.assigned_agent_id === authUser()?.id)) && (
                                    <div className="space-y-2">
                                        <Label htmlFor="newComment">{t('Add Comment')}</Label>
                                        <Textarea
                                            id="newComment"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder={t('Type your comment here...')}
                                        />
                                        <Button onClick={handleAddComment}>
                                            {t('Add Comment')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
