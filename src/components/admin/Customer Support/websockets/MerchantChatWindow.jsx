import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  MessageSquare,
  Send,
  ChevronUp,
  Download,
  FileText,
  Image as ImageIcon,
  Calendar,
  CreditCard,
  Ticket,
  X,
  Package,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { debounce, throttle } from "lodash";
import { formatCurrentCurrency } from "@/utils/helpers";
import { useSelector } from "react-redux";
import { useLanguage } from "@/contexts/LanguageProvider";

export default function MerchantChatWindow({
  selectedMerchant,
  onSendMessage,
  onPickupRequest,
  onSettlementRequest,
  onWaybillRequest,
  onCloseChat,
  isLoading,
  isLoadingOldMessages,
  hasMoreMessages,
  onLoadOlderMessages,
}) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [activeRequestDialog, setActiveRequestDialog] = useState(null);
  const [requestData, setRequestData] = useState({
    pickup: { scheduled_at: "", shipments_count: "" },
    settlement: { amount: "" },
    waybill: { waybills_count: "" },
  });
  const messagesEndRef = useRef(null);
  const messagesStartRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const { currencyEnglishName, currencyArabicName } = useSelector(
    (state) => state.setting
  );
  const { language } = useLanguage();
  // Memoized formatting functions
  const formatTime = useCallback((dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }, []);

  // Memoized attachment renderer
  const renderAttachment = useCallback((attachment, index) => {
    const isImage =
      attachment.mime_type?.startsWith("image/") ||
      attachment.path?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const fileName = attachment.original_name;
    const fileUrl = `${attachment.path}`;

    if (isImage) {
      return (
        <div key={index} className="inline-block mr-2 mb-2">
          <img
            src={fileUrl}
            alt={fileName}
            loading="lazy"
            className="max-w-48 max-h-32 rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-gray-200"
            onClick={() => window.open(fileUrl, "_blank")}
          />
          <p className="text-xs text-gray-500 mt-1 text-center truncate max-w-48">
            {fileName}
          </p>
        </div>
      );
    } else {
      return (
        <div key={index} className="inline-block mr-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-white hover:bg-gray-50"
            onClick={() => window.open(fileUrl, "_blank")}
          >
            <FileText className="w-4 w-4" />
            <span className="truncate max-w-32">{fileName}</span>
            <Download className="w-3 h-3" />
          </Button>
        </div>
      );
    }
  }, []);

  // Memoized request card renderer
  const renderRequestCard = useCallback(
    (request, index) => {
      if (request.message_type !== "CARD") return null;

      try {
        const messageData = JSON.parse(request.message);
        if (messageData.type && messageData.data) {
          return (
            <div
              key={index}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {messageData.type === "pickup_request" && (
                    <Calendar className="h-4 w-4 text-blue-600" />
                  )}
                  {messageData.type === "settlement_request" && (
                    <CreditCard className="h-4 w-4 text-green-600" />
                  )}
                  {messageData.type === "waybill_request" && (
                    <Ticket className="h-4 w-4 text-purple-600" />
                  )}
                  <span className="font-medium text-sm capitalize">
                    {messageData.type.replace("_", " ")}
                  </span>
                </div>
                <Badge
                  variant={
                    messageData.data.status === "pending"
                      ? "secondary"
                      : messageData.data.status === "approved"
                      ? "success"
                      : messageData.data.status === "rejected"
                      ? "destructive"
                      : "default"
                  }
                >
                  {t(messageData.data.status)}
                </Badge>
              </div>

              {messageData.type === "pickup_request" && (
                <div className="text-sm space-y-1">
                  <p>
                    {t("📅 Date:")}{" "}
                    {new Date(
                      messageData.data.scheduled_at
                    ).toLocaleDateString()}
                  </p>
                  <p>
                    {t("📦 Shipments:")} {messageData.data.shipments_count}
                  </p>
                </div>
              )}

              {messageData.type === "settlement_request" && (
                <div className="text-sm">
                  <p>
                    {t(
                      `💰 Amount: ${formatCurrentCurrency(
                        currencyEnglishName,
                        currencyArabicName,
                        language
                      )}`
                    )}{" "}
                    {messageData.data.amount}
                  </p>
                </div>
              )}

              {messageData.type === "waybill_request" && (
                <div className="text-sm">
                  <p>
                    {t("📅 Date:")}{" "}
                    {new Date(
                      messageData.data.scheduled_at
                    ).toLocaleDateString()}
                  </p>
                  <p>
                    {t("🎫 Waybills:")} {messageData.data.shipments_count}
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {formatTime(request.created_at)}
              </p>
            </div>
          );
        }
      } catch (e) {
        console.error(t("Error parsing request card:"), e);
      }
      return null;
    },
    [t, formatTime]
  );

  // Optimized scroll functions
  const scrollToBottom = useCallback(() => {
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isNearBottom]);

  // Throttled scroll handler for better performance
  const handleMessagesScroll = useMemo(
    () =>
      throttle((e) => {
        const { scrollTop, scrollHeight, merchantHeight } = e.target;

        // Check if user is near bottom (within 100px)
        const isAtBottom = scrollHeight - scrollTop - merchantHeight < 100;
        setIsNearBottom(isAtBottom);

        // Load older messages when at top
        if (
          scrollTop === 0 &&
          hasMoreMessages &&
          selectedMerchant &&
          !isLoadingOldMessages
        ) {
          onLoadOlderMessages();
        }
      }, 200),
    [hasMoreMessages, selectedMerchant, isLoadingOldMessages, onLoadOlderMessages]
  );

  // Optimized send message handler
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedMerchant) return;

    const success = await onSendMessage(selectedMerchant?.id, message);
    if (success) {
      setMessage("");
      setIsNearBottom(true); // Auto-scroll after sending
    }
  };

  // Handle request submission
  const handleRequestSubmit = async (type) => {
    if (!selectedMerchant) return;

    let result;
    switch (type) {
      case "pickup":
        result = await onPickupRequest(selectedMerchant?.id, requestData.pickup);
        break;
      case "settlement":
        result = await onSettlementRequest(
          selectedMerchant?.id,
          requestData.settlement
        );
        break;
      case "waybill":
        result = await onWaybillRequest(
          selectedMerchant?.id,
          requestData.waybill
        );
        break;
      default:
        return;
    }

    if (result) {
      setActiveRequestDialog(null);
      setRequestData({
        pickup: { scheduled_at: "", shipments_count: "" },
        settlement: { amount: "" },
        waybill: { waybills_count: "" },
      });
    }
  };

  // Auto-scroll to bottom when new messages arrive and user is near bottom
  useEffect(() => {
    scrollToBottom();
  }, [selectedMerchant?.messages, scrollToBottom]);

  // Cleanup throttled function
  useEffect(() => {
    return () => {
      handleMessagesScroll.cancel();
    };
  }, [handleMessagesScroll]);

  // Memoized merchant info to prevent unnecessary re-renders
  const merchantInfo = useMemo(() => {
    if (!selectedMerchant) return null;

    return {
      name: selectedMerchant?.name,
      email: selectedMerchant?.email,
      id: selectedMerchant?.id,
      phone: selectedMerchant?.phone,
      usedWaybills: selectedMerchant?.used_waybills || 0,
      totalWaybills: selectedMerchant?.total_waybills || 0,
      status: selectedMerchant?.status,
    };
  }, [selectedMerchant]);

  if (!selectedMerchant) {
    return (
      <Card className="md:col-span-2 flex flex-col border-2 shadow-lg">
        <div className="h-full flex items-center justify-center dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center p-8">
            <div className="w-24 h-24 bg-gradient-to-br dark:from-blue-600 dark:to-indigo-600 from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-12 w-12 dark:text-blue-400 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold dark:text-white text-gray-800 mb-2">
              {t("Select a merchant to start chatting")}
            </h3>
            <p className="dark:text-gray-300 text-gray-600 max-w-sm">
              {t("Choose a merchant from the list to view and send messages")}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="col-span-2 flex flex-col border-2 shadow-lg">
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Merchant Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex flex-row flex-wrap space-y-2 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {merchantInfo.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {merchantInfo.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {merchantInfo.email}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                    {t("ID:")} {merchantInfo.id}
                  </span>
                  {merchantInfo.phone && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                      📞 {merchantInfo.phone}
                    </span>
                  )}
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Package className="h-3 w-3" />
                    {t("Waybills:")} {merchantInfo.usedWaybills}/
                    {merchantInfo.totalWaybills}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea
            className="flex-1 messages-scroll"
            onScroll={handleMessagesScroll}
            ref={messagesScrollRef}
          >
            <div className="p-4 space-y-4">
              <div ref={messagesStartRef} />

              {/* Load More Messages Button */}
              {hasMoreMessages && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLoadOlderMessages}
                    disabled={isLoadingOldMessages}
                    className="text-xs"
                  >
                    {isLoadingOldMessages ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900 dark:border-gray-100 mr-2"></div>
                        {t("Loading messages...")}
                      </>
                    ) : (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        {t("Load older messages")}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {selectedMerchant.messages?.map((msg, index) =>
                msg.message_type === "CARD" ? (
                  renderRequestCard(msg, index)
                ) : (
                  <div
                    key={msg.id || `${msg.created_at}-${index}`}
                    className={`flex ${
                      msg.sender_type === "AGENT"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                        msg.sender_type === "AGENT"
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                          : msg.sender_type === "SYSTEM"
                          ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.message}</p>

                      {/* Render attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3">
                          {msg.attachments.map((attachment, attachIndex) =>
                            renderAttachment(attachment, attachIndex)
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <p
                          className={`text-xs font-medium ${
                            msg.sender_type === "AGENT"
                              ? "text-blue-100"
                              : msg.sender_type === "SYSTEM"
                              ? "text-yellow-600 dark:text-yellow-300"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {msg.sender_name}
                        </p>
                        <p
                          className={`text-xs ${
                            msg.sender_type === "AGENT"
                              ? "text-blue-200"
                              : msg.sender_type === "SYSTEM"
                              ? "text-yellow-500 dark:text-yellow-400"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex gap-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={t("Type your message...")}
              className="flex-1 min-h-[50px] resize-none border-2 focus:border-blue-300 dark:focus:border-blue-600 rounded-xl"
              disabled={isLoading || selectedMerchant?.status === "CLOSED"}
            />
            <Button
              onClick={handleSendMessage}
              disabled={
                isLoading ||
                !message.trim() ||
                selectedMerchant?.status === "CLOSED"
              }
              className="self-end bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-6 rounded-xl shadow-sm"
              size="lg"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
