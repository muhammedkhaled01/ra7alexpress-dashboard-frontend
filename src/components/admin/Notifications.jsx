import axiosMerchant from "@/axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useNotificationsWebSocket } from "../hooks/useNotificationsWebSocket";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Bell,
  BellOff,
  CheckCheck,
  Eye,
  MoreHorizontal,
  RefreshCw,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Package,
  CreditCard,
  MessageCircle,
  Settings,
} from "lucide-react";
import Echo from "@/utils/echo";
import {useSelector} from "react-redux";

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stats, setStats] = useState({});

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector((store) => store.auth.user);
  const userId = user?.id;

  const canAccess = can("Dashboard access");
  const handleNewNotification = useCallback((notification) => {
    console.log('🎯 Processing new notification from notifications screen:', notification);
    setNotifications(prevNotifications => [
      {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        data: notification.data,
        read_at: notification.read_at,
        created_at: notification.created_at,
        updated_at: notification.updated_at
      },
      ...prevNotifications
    ]);

    // Update unread count in stats
    setStats(prevStats => ({
      ...prevStats,
      unread: (prevStats.unread || 0) + 1,
      total: (prevStats.total || 0) + 1
    }));

  }, []);

  useNotificationsWebSocket(user, handleNewNotification);
  const statusOptions = [
    { value: "all", label: t("All Status") },
    { value: "unread", label: t("Unread") },
    { value: "read", label: t("Read") },
  ];

  const selectedStatusOption = statusOptions.find(
    (option) => option.value === statusFilter
  );

  const handleStatusChange = (selectedOption) => {
    setStatusFilter(selectedOption ? selectedOption.value : "all");
  };

  const fetchNotifications = useCallback(
    async (pageNumber = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pageNumber,
          user_id: userId,
          per_page: itemsPerPage,
          ...(statusFilter !== "all" && { status: statusFilter }),
          ...(searchQuery && { search: searchQuery }),
        });

        const response = await axiosMerchant.get(`notifications?${params}`);
        
        if (response.data.data) {
          setLinks(response.data.data.links || []);
          setNotifications(response.data.data.data || []);
        } else {
          setLinks([]);
          setNotifications([]);
        }
      } catch (error) {
        handleError(error);
        setLinks([]);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, statusFilter, itemsPerPage]
  );

  const fetchStats = useCallback(async () => {
    try {
      const response = await axiosMerchant.get(`notifications/stats?user_id=${userId}`);
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  // Fetch data initially and set up interval for auto-refresh
  useEffect(() => {
    if (!canAccess) {
      return navigate("/unauthorized");
    }

    // Initial fetch
    const   fetchData = async () => {
      await fetchNotifications(currentPage);
      await fetchStats();
    };
    fetchData();

    // Set up interval for auto-refresh every 30 seconds
    // const intervalId = setInterval(() => {
    //   fetchData();
    // }, 30000);

    // Clean up interval on component unmount
    // return () => clearInterval(intervalId);  
  }, [
    currentPage,
    statusFilter,
    canAccess,
    navigate,
    fetchNotifications,
    fetchStats,
  ]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    setRefreshBtn(true);
    fetchNotifications(1);
    fetchStats();
  }, [fetchNotifications]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleRefresh = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setRefreshBtn(false);
    setCurrentPage(1);
    fetchNotifications(1);
    fetchStats();
  }, [fetchNotifications, fetchStats, itemsPerPage]);

  const markAsRead = async (notificationId) => {
    try {
      if (notificationId === 0) return;
      await axiosMerchant.patch(`notifications/${notificationId}/read`);
      toast.success(t("Notification marked as read"));
      fetchNotifications(currentPage);
      fetchStats();
    } catch (error) {
      handleError(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await axiosMerchant.patch("notifications/read-all");
      toast.success(
        `${response.data.data.updated_count} ${t(
          "notifications marked as read"
        )}`
      );
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
      case "ofd_notification":
      case "delivery":
        return <Package className="w-4 h-4" />;
      case "payment":
      case "invoice":
        return <CreditCard className="w-4 h-4" />;
      case "support":
      case "message":
        return <MessageCircle className="w-4 h-4" />;
      case "system":
        return <Settings className="w-4 h-4" />;
      case "alert":
      case "warning":
        return <AlertCircle className="w-4 h-4" />;
      case "success":
        return <CheckCircle className="w-4 h-4" />;
      case "error":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type.toLowerCase()) {
      case "ofd_notification":
      case "delivery":
        return "bg-blue-100 text-blue-800";
      case "payment":
      case "invoice":
        return "bg-green-100 text-green-800";
      case "support":
      case "message":
        return "bg-purple-100 text-purple-800";
      case "system":
        return "bg-gray-100 text-gray-800";
      case "alert":
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "success":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const seenNotifications = useRef(new Set());
  const activeChannelsRef = useRef(new Set());

  useEffect(() => {
    if (!Echo) {
      console.error("Echo is not available");
      return;
    }

    const channel = Echo.channel("notifications-channel");
    channel
      .listen(".notification.created", (event) => {
        const notification = event.notification;
        console.log("New notification received:", notification);

        if (!seenNotifications.current.has(notification.id)) {
          seenNotifications.current.add(notification.id);
          const newNotification = {
            ...notification,
            read_at: null,
            type:
              typeof notification.data === "string"
                ? JSON.parse(notification.data)?.type || "system"
                : notification.data?.type || "system",
          };
          setNotifications((prev) => [newNotification, ...prev]);
          toast.success(
            <div>
              <strong>{notification.title}</strong>
              <br />
              {notification.content}
            </div>,
            {
              duration: 6000,
              position: "top-right",
            }
          );
          fetchStats();
        }
      })
      .error((error) => {
        console.error("Channel subscription error:", error);
      });

    activeChannelsRef.current.add("notifications-channel");

    return () => {
      activeChannelsRef.current.forEach((channelName) => {
        Echo.leaveChannel(channelName);
      });
      activeChannelsRef.current.clear();
    };
  }, [fetchStats]);

  if (!canAccess) {
    return null;
  }

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
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2">
            <Bell className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {t("Total")}
              </p>
              <p className="text-2xl font-bold">{stats.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2">
            <BellOff className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {t("Unread")}
              </p>
              <p className="text-2xl font-bold text-red-600">
                {stats.unread || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {t("Read")}
              </p>
              <p className="text-2xl font-bold text-green-600">
                {stats.read || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center flex-wrap gap-4 mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow border">
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("Search notifications...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48"
            icon={
              refreshBtn && (
                <RefreshCw
                  className="w-4 h-4 cursor-pointer"
                  onClick={handleRefresh}
                />
              )
            }
          />
        </div>

        <Select
          value={selectedStatusOption}
          onChange={handleStatusChange}
          options={statusOptions}
        />

        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            {t("Show")}
          </label>
          <Select
            value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
            onChange={(selectedOption) => {
              setItemsPerPage(Number(selectedOption.value));
              setCurrentPage(1);
            }}
            options={[
              { value: 5, label: '5' },
              { value: 8, label: '8' },
              { value: 15, label: '15' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
              { value: 100, label: '100' }
            ]}
            className="w-20 text-sm"
            isSearchable={false}
          />
        </div>

        <Button onClick={handleRefresh} variant="refresh">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Notifications Table */}
      <div className="shadow-md py-4 mt-4 rounded-lg">
        <Table className="text-sm w-full border-collapse">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-left">#</TableHead>
              <TableHead className="w-[50px] text-center">
                {t("Status")}
              </TableHead>
              <TableHead className="max-w-[250px]">{t("Notification Title")}</TableHead>
              <TableHead>{t("Content")}</TableHead>
              <TableHead className="w-[150px]">{t("Time")}</TableHead>
              <TableHead className="w-[100px] text-right">
                {t("Actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <TableRow
                  key={notification.id}
                  className={`cursor-pointer ${
                    !notification.read_at ? "bg-blue-50 dark:bg-gray-800" : ""
                  }`}
                  onClick={() => openDialog(notification)}
                >
                  <TableCell className="font-medium text-left">
                    {index + 1}
                  </TableCell>
                  <TableCell className="text-center">
                    {notification.read_at ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto"></div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center flex-wrap gap-2 justify-center">
                      {getNotificationIcon(notification.type)}
                      <span
                        className={`font-medium max-w-[250px] ${
                          !notification.read_at
                            ? "text-gray-900"
                            : "text-gray-600"
                        }`}
                      >
                        {notification.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-medium line-clamp-3 ${
                        !notification.read_at
                          ? "text-gray-900"
                          : "text-gray-600"
                        }`}
                    >
                      {notification.content}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-500">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openDialog(notification);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {t("View Details")}
                        </DropdownMenuItem>
                        {!notification.read_at && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
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
                <TableCell colSpan={6} className="text-center py-8">
                  <NoRecordFound />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {links.length > 1 && (
          <Pagination
            links={links}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Notification Details Dialog */}
      {dialogOpen && selectedNotification && (
        <Dialog open={dialogOpen} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getNotificationIcon(selectedNotification.type)}
                {selectedNotification.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge
                  className={`${getNotificationColor(
                    selectedNotification.type
                  )}`}
                >
                  {humanizeText(selectedNotification.type)}
                </Badge>
                <span className="text-sm text-gray-500">
                  {new Date(selectedNotification.created_at).toLocaleString()}
                </span>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-gray-700 dark:text-white leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.content}
                </p>
              </div>

              {selectedNotification.read_at && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  {t("Read on")}{" "}
                  {new Date(selectedNotification.read_at).toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <DialogClose asChild>
                <Button variant="outline">{t("Close")}</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Notifications;