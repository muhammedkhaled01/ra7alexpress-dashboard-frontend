import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";
import PageTitle from "./Layouts/PageTitle";
import NoRecordFound from "../NoRecordFound";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Select from "../misc/Select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "../ui/badge";
import Pagination from "@/components/Pagination";
import { can, handleError, humanizeText } from "@/utils/helpers";
import Loader from "../Loader";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
    Bell,
    BellOff,
    CheckCheck,
    Eye,
    Filter,
    MoreHorizontal,
    Search,
    RefreshCw,
    AlertCircle,
    Info,
    CheckCircle,
    XCircle,
    Package,
    CreditCard,
    MessageCircle,
    Settings
} from "lucide-react";

const MerchantNotifications = () => {
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [notifications, setNotifications] = useState([]);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [stats, setStats] = useState({});

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshBtn, setRefreshBtn] = useState(false);

    const { t } = useTranslation();
    const navigate = useNavigate();

    const statusOptions = [
        { value: 'all', label: t("All Status") },
        { value: 'unread', label: t("Unread") },
        { value: 'read', label: t("Read") },
    ];

    const selectedStatusOption = statusOptions.find(option => option.value === statusFilter);

    const handleStatusChange = (selectedOption) => {
        setStatusFilter(selectedOption ? selectedOption.value : 'all');
    };

    useEffect(() => {
        fetchNotifications(currentPage);
        fetchStats();
    }, [currentPage, statusFilter, searchQuery]);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const fetchNotifications = async (pageNumber) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pageNumber.toString(),
                ...(statusFilter !== 'all' && { status: statusFilter }),
                ...(searchQuery && { search: searchQuery })
            });

            const response = await axiosMerchant.get(`merchant/notifications?${params}`);
            setLinks(response.data.data.links);
            setNotifications(response.data.data.data);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axiosMerchant.get('merchant/notifications/stats');
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        setRefreshBtn(true);
        fetchNotifications(1);
    };

    const handleRefresh = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setRefreshBtn(false);
        setCurrentPage(1);
        fetchNotifications(1);
        fetchStats();
    };

    const markAsRead = async (notificationId) => {
        try {
            await axiosMerchant.post(`merchant/notifications/${notificationId}/read`);
            toast.success(t("Notification marked as read"));
            fetchNotifications(currentPage);
            fetchStats();
        } catch (error) {
            handleError(error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await axiosMerchant.post('merchant/notifications/read-all');
            toast.success(`${response.data.data.updated_count} ${t("notifications marked as read")}`);
            fetchNotifications(currentPage);
            fetchStats();
        } catch (error) {
            handleError(error);
        }
    };

    const openDialog = (notification) => {
        setSelectedNotification(notification);
        setDialogOpen(true);
        if (!notification.read_at) {
            markAsRead(notification.id);
        }
    };

    const closeDialog = () => {
        setSelectedNotification(null);
        setDialogOpen(false);
    };

    const getNotificationIcon = (type) => {
        switch (type.toLowerCase()) {
            case 'ofd_notification':
            case 'delivery':
                return <Package className="w-4 h-4" />;
            case 'payment':
            case 'invoice':
                return <CreditCard className="w-4 h-4" />;
            case 'support':
            case 'message':
                return <MessageCircle className="w-4 h-4" />;
            case 'system':
                return <Settings className="w-4 h-4" />;
            case 'alert':
            case 'warning':
                return <AlertCircle className="w-4 h-4" />;
            case 'success':
                return <CheckCircle className="w-4 h-4" />;
            case 'error':
                return <XCircle className="w-4 h-4" />;
            default:
                return <Info className="w-4 h-4" />;
        }
    };

    const getNotificationColor = (type) => {
        switch (type.toLowerCase()) {
            case 'ofd_notification':
            case 'delivery':
                return 'bg-blue-100 text-blue-800';
            case 'payment':
            case 'invoice':
                return 'bg-green-100 text-green-800';
            case 'support':
            case 'message':
                return 'bg-purple-100 text-purple-800';
            case 'system':
                return 'bg-gray-100 text-gray-800';
            case 'alert':
            case 'warning':
                return 'bg-yellow-100 text-yellow-800';
            case 'success':
                return 'bg-green-100 text-green-800';
            case 'error':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };

    const formatTimeAgo = (date) => {
        const now = new Date();
        const notificationDate = new Date(date);
        const diffInSeconds = Math.floor((now - notificationDate) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <div>
            <div className="flex justify-between items-center mt-2">
                <PageTitle title={t("Notifications")} />
                <div className="flex gap-2">
                    {stats.unread > 0 && (
                        <Button onClick={markAllAsRead} variant="outline" size="sm">
                            <CheckCheck className="w-4 h-4 mr-2" />
                            {t("Mark All Read")} ({stats.unread})
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 rounded-lg shadow border dark:bg-gray-800/50">
                    <div className="flex items-center">
                        <Bell className="w-8 h-8 dark:text-blue-400 text-blue-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium dark:text-gray-400 text-gray-600">{t("Total")}</p>
                            <p className="text-2xl font-bold dark:text-white">{stats.total || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-lg shadow border dark:bg-gray-800/50">
                    <div className="flex items-center">
                        <BellOff className="w-8 h-8 dark:text-red-400 text-red-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium dark:text-gray-400 text-gray-600">{t("Unread")}</p>
                            <p className="text-2xl font-bold dark:text-red-400 text-red-600">{stats.unread || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 rounded-lg shadow border dark:bg-gray-800/50">
                    <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 dark:text-green-400 text-green-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium dark:text-gray-400 text-gray-600">{t("Read")}</p>
                            <p className="text-2xl font-bold dark:text-green-400 text-green-600">{stats.read || 0}</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mt-4 p-4 rounded-lg shadow border dark:bg-gray-800/50">
                <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                    <Input
                        placeholder={t("Search notifications...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-48"
                    />
                </div>

                <Select
                    value={selectedStatusOption}
                    onChange={handleStatusChange}
                    options={statusOptions}
                />

                <Button onClick={handleSearch} size="sm" className="dark:bg-blue-600 dark:hover:bg-blue-700">
                    <Search className="w-4 h-4 mr-2" />
                    {t("Search")}
                </Button>

                <Button onClick={handleRefresh} variant="refresh" >
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>

            {/* Notifications Table */}
            <div className="shadow-md py-4 mt-4 rounded-lg">
                <Table className="text-sm">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60px]">#</TableHead>
                            <TableHead className="w-[50px]">{t("Status")}</TableHead>
                            <TableHead>{t("Title")}</TableHead>

                            <TableHead className="w-[150px]">{t("Time")}</TableHead>
                            <TableHead className="w-[100px] text-right">{t("Actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <Loader />
                                </TableCell>
                            </TableRow>
                        ) : notifications && notifications.length > 0 ? (
                            notifications.map((notification, index) => (
                                <TableRow
                                    key={notification.id}
                                    className={`cursor-pointer ${!notification.read_at ? 'bg-blue-50' : ''}`}
                                    onClick={() => openDialog(notification)}
                                >
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>
                                        {notification.read_at ? (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getNotificationIcon(notification.type)}
                                            <span className={`font-medium ${!notification.read_at ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {notification.title}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-gray-500">
                                        {formatTimeAgo(notification.created_at)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDialog(notification);
                                                }}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    {t("View Details")}
                                                </DropdownMenuItem>
                                                {!notification.read_at && (
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}>
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        {t("Mark as Read")}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <NoRecordFound />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <Pagination
                    links={links}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                />
            </div>

            {/* Notification Details Dialog */}
            {dialogOpen && selectedNotification && (
                <Dialog open={dialogOpen} onOpenChange={closeDialog}>
                    <DialogContent className="sm:max-w-[600px] dark:bg-gray-800/50">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 dark:text-white">
                                {getNotificationIcon(selectedNotification.type)}
                                {selectedNotification.title}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Badge className={`${getNotificationColor(selectedNotification.type)}`}>
                                    {humanizeText(selectedNotification.type)}
                                </Badge>
                                <span className="text-sm dark:text-gray-400">
                                    {new Date(selectedNotification.created_at).toLocaleString()}
                                </span>
                            </div>

                            <div className="p-4 rounded-lg dark:bg-gray-800/20">
                                <p className="leading-relaxed whitespace-pre-wrap dark:text-gray-300">
                                    {selectedNotification.content}
                                </p>
                            </div>

                            {selectedNotification.read_at && (
                                <div className="flex items-center gap-2 text-sm dark:text-green-400">
                                    <CheckCircle className="w-4 h-4 dark:text-green-400" />
                                    {t("Read on")} {new Date(selectedNotification.read_at).toLocaleString()}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end mt-6">
                            <DialogClose asChild>
                                <Button variant="outline" className="dark:text-gray-400 dark:border-gray-600">
                                    {t("Close")}
                                </Button>
                            </DialogClose>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default MerchantNotifications;
