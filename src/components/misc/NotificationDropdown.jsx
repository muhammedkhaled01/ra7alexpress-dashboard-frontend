import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Bell, ChevronRight, CheckCheck, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useNotificationsWebSocket } from "../hooks/useNotificationsWebSocket";
import {hasRole, humanizeText} from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import useNotificationDropdown from "@/contexts/useNotificationDropdown";

const NotificationDropdown = () => {
  const user = useSelector((store) => store.auth.user);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    unreadCount,
    isDropdownOpen,
    setIsDropdownOpen,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNewNotification
  } = useNotificationDropdown();

  // معالجة الإشعارات الجديدة من WebSocket
  const handleNewNotification = useCallback((notification) => {
    console.log('🎯 Processing new notification:', notification);
    addNewNotification(notification);
  }, [addNewNotification]);

  // استخدام WebSocket hook
  useNotificationsWebSocket(user, handleNewNotification);

  // جلب الإشعارات عند فتح القائمة
  useEffect(() => {
    if (isDropdownOpen) {
      fetchNotifications();
    }
  }, [isDropdownOpen, fetchNotifications]);
    const isMerchant = hasRole("Merchant")
  const notificationRoutes = new Map([
    ["App\\Models\\User", '/drivers'],
    ["User", '/users'],
    ["App\\Notifications\\ShipmentCreatedNotification", '/shipments'],
    ["shipment_created", '/shipments'],
    ["RTO_LOADED", '/shipments'],
    ["future_delivery_scheduled", '/shipments'],
    ["App\\Notifications\\PickupTaskAssignedNotification", '/pickup-tasks'],
    ["App\\Notifications\\PickupTaskCompletedNotification", '/pickup-tasks'],
    ["App\\Notifications\\WaybillRequestedNotification", '/merchant/waybills'],
    ["waybill_requested", '/merchant/waybills'],
    ["new_chat_session", '/live-chat'],
    ["new_merchant_message", '/merchant-chat'],
    ["admin_merchant_message", '/request-support'],
    ["waybill_request", '/merchant-chat'],
    ["settlement_request", '/merchant-chat'],
    ["pickup_request", '/merchant-chat'],
    ["unassigned_chat", '/live-chat'],
    ["driver_account_created", '/drivers'],
    ["support", '/tickets']
  ]);

  const handleRouteNotification = (type, data = null) => {
    if (!type) return;
    if (type === "new_chat_session" || type === "unassigned_chat" || type === "assigned_chat") {
      const chatId = data?.chat_session_id || data?.chat_id;
      if (chatId) {
        navigate(`/live-chat?chat_id=${chatId}`);
      } else {
        navigate('/live-chat');
      }
      return;
    }
    if (type === "new_merchant_message") {
      const chatId = data?.chat_session_id;
      if (chatId) {
        navigate(`/merchant-chat?chat_id=${chatId}`);
      } else {
        navigate('/merchant-chat');
      }
      return;
    }
    if (notificationRoutes.has(type)) {
      navigate(notificationRoutes.get(type));
    } else {
      console.warn(`Unknown notification type: ${type}`);
    }
  };

  // هيكل التحميل
  const LoadingSkeleton = () => (
    <div className="space-y-3 p-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-start space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <DropdownMenu onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="max-w-[500px] md:max-w-auto w-96 md:w-[500px] p-0 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
      >
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{t("Notifications")}</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    {t("Mark all")}
                  </Button>
                  <Badge variant="outline" className="text-xs">
                    {unreadCount} {t("unread")}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <LoadingSkeleton />
          ) : notifications.length > 0 ? (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                markAsRead={markAsRead}
                handleRouteNotification={handleRouteNotification}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                {t("No new notifications")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("We'll notify you when something arrives")}
              </p>
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
          <DropdownMenuItem className="cursor-pointer hover:bg-transparent">
            <Link
              to="/notifications"
              className="w-full flex items-center justify-between text-sm font-medium"
            >
              {t("View all notifications")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// مكون عنصر الإشعار
const NotificationItem = ({ notification, markAsRead, handleRouteNotification }) => {
  const isUnread = !notification.read_at;

  const handleClick = (e) => {
    if (isUnread) {
      e.preventDefault();
      markAsRead(notification.id);
    }
    handleRouteNotification(notification?.type, notification.data);
  };

  return (
    <div className="relative group">
      <DropdownMenuItem
        className={cn(
          "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
          isUnread ? "bg-blue-50 dark:bg-blue-900/20" : ""
        )}
        onClick={handleClick}
      >
        <div className="w-full">
          <div className="flex items-start gap-3 p-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">
                  {notification.title}
                </p>
                {isUnread && (
                  <Badge variant="dot" className="bg-blue-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {notification.content}
              </p>
              <div className="flex justify-between items-center mt-2">
                <Badge variant="outline" className="text-xs">
                  {humanizeText(notification.type)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DropdownMenuItem>

      {isUnread && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            markAsRead(notification.id);
          }}
          title="Mark as read"
        >
          <CheckCircle className="h-4 w-4 text-blue-500" />
        </Button>
      )}
    </div>
  );
};

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    read_at: PropTypes.string,
    created_at: PropTypes.string.isRequired
  }).isRequired,
  markAsRead: PropTypes.func.isRequired,
  handleRouteNotification: PropTypes.func.isRequired
};

export default NotificationDropdown;