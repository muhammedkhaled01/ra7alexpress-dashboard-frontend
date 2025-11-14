import React, { useEffect, useState, useCallback } from "react";
import axiosMerchant from "@/axios";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useTranslation } from "react-i18next";
import Pagination from "@/components/Pagination";
import ShipmentDetailsDialog from "./ShipmentDetailsDialog";
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  RefreshCcw,
  Copy,
  Check,
  Phone,
  MessageCircle,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  PrinterIcon,
  LucideLoader,
  User,
} from "lucide-react";
import { can, formatCurrentCurrency, printLabel } from "@/utils/helpers";
import { toast } from "react-toastify";
import moment from "@/utils/moment";
import Select from "@/components/misc/Select";
import { useSelector } from "react-redux";
import { useLanguage } from "@/contexts/LanguageProvider";
import { DateTimeRangePicker } from "../misc/DateTimeRangePicker";

function CustomerCreatedShipments() {
  const today = moment().format("YYYY-MM-DD");
  const [loading, setLoading] = useState(true);
  const [fetchingData, setFetchingData] = useState(false);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [shipments, setShipments] = useState([]);
  const [shipmentCount, setShipmentCount] = useState(0);
  const [btnLoading, setBtnLoading] = useState(false);
  const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [filters, setFilters] = useState({
    search: "",
    from: today,
    to: today,
    from_time: "00:00",
    to_time: "23:59",
    per_page: 15,
  });

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const { currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting)
  const { language } = useLanguage();
  const [actionType, setActionType] = useState("accept"); // accept or reject
  const [notes, setNotes] = useState("");
  const [isPrinting, setIsPrinting] = useState({});
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewShipment, setViewShipment] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    if (!loading && shipments && shipments.length === 0) {
      setLoading(false);
    }
  }, [shipments, loading]);

  const handleCopy = async (text, type = "tracking") => {
    await navigator.clipboard.writeText(text);
    if (type === "tracking") {
      setCopiedTrackingNo(text);
      setTimeout(() => setCopiedTrackingNo(null), 2000);
    } else if (type === "phone") {
      setCopiedPhone(text);
      setTimeout(() => setCopiedPhone(null), 2000);
    }
  };
  const openViewDialog = async (shipment) => {
    setViewDialogOpen(true);
    setViewLoading(true);
    setViewShipment(null);
    try {
      const res = await axiosMerchant.get(`shipments/show/${shipment.id}`);
      setViewShipment(res.data?.data?.shipment ?? null);
    } catch (e) {
      console.error(e);
      toast.error(t("Failed to load shipment details"));
      setViewDialogOpen(false);
    } finally {
      setViewLoading(false);
    }
  };
  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchingData(true);
    try {
      const activeFilters = Object.entries(filters)
        .filter(([_, value]) => value !== null && value !== "")
        .reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: value,
          }),
          {}
        );

      const response = await axiosMerchant.get("customer-shipments", {
        params: {
          per_page: itemsPerPage,
          page: currentPage,
          from: `${filters?.from} ${filters?.from_time}`,
          to: `${filters?.to} ${filters?.to_time}`,
        },
      });

      setShipments(response.data.data.shipments.data);
      setLinks(response.data.data.shipments.links);
      setShipmentCount(
        response.data.data.total_pending || response.data.data.shipments.total
      );
      setLoading(false);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) {
        setShipments([]);
        setLinks([]);
        setShipmentCount(0);
      } else {
        toast.error(t("Failed to fetch pending shipments"));
      }
      setLoading(false);
    } finally {
      setFetchingData(false);
    }
  }, [filters, t, itemsPerPage, currentPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (selectedOption) => {
    const newItemsPerPage = Number(selectedOption.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    setFilters(prev => ({
      ...prev,
      per_page: newItemsPerPage
    }));
  };

  const handleRefresh = async () => {
    setFilters({
      search: "",
      from: today,
      to: today,
      from_time: "00:00",
      to_time: "23:59",
      per_page: itemsPerPage,
    });
    setCurrentPage(1);
    await fetchData();
  };

  const openActionDialog = (shipment, action) => {
    setSelectedShipment(shipment);
    setActionType(action);
    setNotes("");
    setDialogOpen(true);
  };

  const handleAssignShipment = async (shipment) => {
    if (!shipment) return;

    setBtnLoading(true);
    try {
      await axiosMerchant.post("customer-shipments/assign", {
        tracking_no: shipment.tracking_no,
        driver_id: shipment.instant_delivery_assignment.driver_id,
      });
      await fetchData();
      toast.success(t("Shipment assigned successfully"));
    } catch (error) {
      console.error(error);
      toast.error(t("Failed to assign shipment"));
    } finally {
      setBtnLoading(false);
    }
  };

  const handleShipmentAction = async () => {
    if (!selectedShipment) return;

    setBtnLoading(true);
    try {
      await axiosMerchant.post("customer-shipments/accept", {
        shipment_id: selectedShipment.id,
        action: actionType,
        notes: notes,
      });

      toast.success(
        actionType === "accept"
          ? t("Shipment accepted successfully")
          : t("Shipment rejected successfully")
      );

      setDialogOpen(false);
      setSelectedShipment(null);
      setNotes("");
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error(t("Failed to process shipment"));
    } finally {
      setBtnLoading(false);
    }
  };

  const handlePrint = async (shipment) => {
    try {
      setIsPrinting((prev) => ({ ...prev, [shipment.id]: true }));
      const response = await axiosMerchant.get("/shipments/printShipment", {
        params: { tracking_no: shipment.tracking_no },
      });
      printLabel(response.data.html);
    } catch (error) {
      console.error("Error fetching airway bill for printing:", error);
      toast.error(t("Failed to print airway bill"));
    } finally {
      setIsPrinting((prev) => ({ ...prev, [shipment.id]: false }));
    }
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  // Permissions
  const canAccess = can("Customer Created Shipments access");
  const canPrint = can("Customer Created Shipments print");
  const canUpdate = can("Customer Created Shipments update");
  // DEBUGGERS
  console.log('canAccess : '+canAccess)
  console.log('canPrint : '+canPrint)
  console.log('canUpdate : '+canUpdate)

  if (!canAccess) {
    return navigate("/unauthorized");
  }
  const handleDateRangeChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  return (
    <div>
      <Card className="">
        <CardHeader>
          <div className="flex flex-row justify-between items-end">
            <CardTitle>
              {t("Customer Created Shipments")}{" "}
              {shipmentCount ? `- ${shipmentCount}` : ``}
            </CardTitle>
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-[250px]">
                <label htmlFor="">{t("Search")}</label>
                <Input
                  name="search"
                  placeholder={t("Tracking no, customer name, phone")}
                  type="text"
                  value={filters.search}
                  onChange={(e) => {
                    if (!fetchingData) {
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }));
                    }
                  }}
                />
              </div>
              <div className="w-[250px]">
                <label htmlFor="">{t("Date")}</label>
                <DateTimeRangePicker
                  filters={{
                    from: filters.from,
                    to: filters.to,
                    from_time: filters.from_time,
                    to_time: filters.to_time,
                  }}
                  onChange={handleDateRangeChange}
                  t={t}
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">
                    {t("Show")}
                  </label>
                  <div className="relative">
                    <Select
                      value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
                      onChange={(selectedOption) => handleItemsPerPageChange(selectedOption)}
                      options={[
                        { value: 5, label: '5' },
                        { value: 10, label: '10' },
                        { value: 15, label: '15' },
                        { value: 25, label: '25' },
                        { value: 50, label: '50' },
                        { value: 100, label: '100' }
                      ]}
                      className="w-20 text-sm"
                      isSearchable={false}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="refresh"
                  onClick={handleRefresh}
                  disabled={fetchingData}
                >
                  <RefreshCcw className={`w-4 h-4 ${fetchingData ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>{t("Tracking No")}</TableHead>
                  <TableHead>{t("Sender Info")}</TableHead>
                  <TableHead>{t("Customer Info")}</TableHead>
                  {/* <TableHead>{t("Delivery Address")}</TableHead> */}
                  <TableHead>{t("Shipment Details")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Created")}</TableHead>
                  <TableHead>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading || fetchingData ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : shipments && shipments.length > 0 ? (
                  shipments.map((shipment, index) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-x-2">
                          <button
                            onClick={() =>
                              handleCopy(shipment.tracking_no, "tracking")
                            }
                            className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                            aria-label="Copy tracking number"
                          >
                            {copiedTrackingNo === shipment.tracking_no ? (
                              <Check size={16} className="text-green-500" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                          <span className="font-medium text-blue-600">
                            {shipment.tracking_no}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {shipment.customer_name}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone size={14} />
                            <button
                              onClick={() =>
                                handleCopy(shipment.customer_phone, "phone")
                              }
                              className="hover:text-blue-600 transition-colors"
                            >
                              {copiedPhone === shipment.customer_phone ? (
                                <Check
                                  size={14}
                                  className="text-green-500 inline mr-1"
                                />
                              ) : (
                                <Copy size={14} className="inline mr-1" />
                              )}
                              {shipment.customer_phone}
                            </button>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {shipment.consignee?.name}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone size={14} />
                            <button
                              onClick={() =>
                                handleCopy(shipment.consignee?.cellphone, "phone")
                              }
                              className="hover:text-blue-600 transition-colors"
                            >
                              {copiedPhone === shipment.consignee?.cellphone ? (
                                <Check
                                  size={14}
                                  className="text-green-500 inline mr-1"
                                />
                              ) : (
                                <Copy size={14} className="inline mr-1" />
                              )}
                              {shipment.consignee?.cellphone}
                            </button>
                          </div>

                          {shipment.consignee?.alternatePhone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MessageCircle size={14} />
                              <button
                                onClick={() =>
                                  handleCopy(
                                    shipment.consignee?.alternatePhone,
                                    "phone"
                                  )
                                }
                                className="hover:text-blue-600 transition-colors"
                              >
                                {copiedPhone ===
                                  shipment.consignee?.alternatePhone ? (
                                  <Check
                                    size={14}
                                    className="text-green-500 inline mr-1"
                                  />
                                ) : (
                                  <Copy size={14} className="inline mr-1" />
                                )}
                                {shipment.consignee?.alternatePhone}
                              </button>
                            </div>
                          )
                            ? ""
                            : null}
                        </div>
                      </TableCell>

                      {/* <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span>{shipment.consignee?.streetAddress}</span>
                          </div>
                          <div className="text-gray-600">
                            {shipment.consignee?.state?.en_name},{" "}
                            {shipment.consignee?.country?.name}
                          </div>
                          {shipment.consignee?.zipcode && (
                            <div className="text-gray-500">
                              {t("ZIP")}: {shipment.consignee?.zipcode}
                            </div>
                          )}
                        </div>
                      </TableCell> */}

                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="text-gray-600">
                            {shipment.payment_type}
                          </div>
                          <div className="text-gray-600">{shipment.fee_payer}</div>
                          <div className="text-gray-600">
                            {shipment.delivery_fee}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            shipment.instant_delivery_assignment?.status ===
                              "DISPATCH"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {shipment.instant_delivery_assignment?.status ||
                            "PENDING"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar size={14} />
                          <span>{formatDate(shipment.created_at)}</span>
                        </div>
                      </TableCell>

                      <TableCell className="space-x-2">
                        <Button
                          onClick={() => openViewDialog(shipment)}
                          size="sm"
                          variant="outline"
                          title={t("View")}
                        >
                          <Eye size={16} />
                        </Button>
                        {(canPrint && 
                        <Button
                          onClick={() => handlePrint(shipment)}
                          size="sm"
                          variant="print"
                          disabled={isPrinting[shipment.id]}
                        >
                          {isPrinting[shipment.id] ? (
                            <LucideLoader className="h-4 w-4 animate-spin inline-block" />
                          ) : (
                            <PrinterIcon />
                          )}
                        </Button>
                        )}
                        {(canUpdate && 
                        <Button
                          onClick={() => openActionDialog(shipment, "accept")}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={shipment.facility_id && shipment.facility_type}
                        >
                          <CheckCircle size={16} className="mr-1" />
                          {t("Accept")}
                        </Button>
                        )}
                        {shipment.facility_id &&
                          shipment.facility_type &&
                          shipment.in_warehouse &&
                          shipment.instant_delivery_assignment && (
                            <Button
                              onClick={() => handleAssignShipment(shipment)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              disabled={
                                shipment.instant_delivery_assignment.status ===
                                "DISPATCH"
                              }
                            >
                              <User size={16} className="mr-1" />
                              {t("Assign Shipment")}
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center">
                      <NoRecordFound />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {links.length > 0 && (
              <div className="mt-4">
                <Pagination
                  links={links}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Accept/Reject Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionType === "accept" ? t("Accept Shipment") : t("Reject Shipment")}
            </DialogTitle>
          </DialogHeader>

          {selectedShipment && (
            <div className="space-y-6">
              {/* Shipment Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">{t("Shipment Information")}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">{t("Tracking No")}:</span>
                    <span className="ml-2 text-blue-600">
                      {selectedShipment.tracking_no}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">{t("Amount")}:</span>
                    <span className="ml-2">
                      {selectedShipment.amount} {formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">{t("Payment Type")}:</span>
                    <span className="ml-2">{selectedShipment.payment_type}</span>
                  </div>
                  <div>
                    <span className="font-medium">{t("Items")}:</span>
                    <span className="ml-2">
                      {selectedShipment.shipment_items?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Contact Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-blue-800">
                  {t("Customer Contact Information")}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{t("Name")}:</span>
                      <span className="ml-2">
                        {selectedShipment.consignee?.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Phone size={16} className="mr-2 text-blue-600" />
                      <span className="font-medium">{t("Primary Phone")}:</span>
                      <span className="ml-2">
                        {selectedShipment.consignee?.cellphone}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCopy(selectedShipment.consignee?.cellphone, "phone")
                      }
                    >
                      {copiedPhone === selectedShipment.consignee?.cellphone ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </Button>
                  </div>

                  {selectedShipment.consignee?.alternatePhone && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageCircle
                          size={16}
                          className="mr-2 text-blue-600"
                        />
                        <span className="font-medium">
                          {t("Alternate Phone")}:
                        </span>
                        <span className="ml-2">
                          {selectedShipment.consignee?.alternatePhone}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleCopy(
                            selectedShipment.consignee?.alternatePhone,
                            "phone"
                          )
                        }
                      >
                        {copiedPhone ===
                          selectedShipment.consignee?.alternatePhone ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">{t("Delivery Address")}</h3>
                <div className="text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 text-gray-600" />
                    <div>
                      <div>{selectedShipment.consignee?.streetAddress}</div>
                      <div className="text-gray-600 mt-1">
                        {selectedShipment.consignee?.state?.en_name},{" "}
                        {selectedShipment.consignee?.country?.name}
                        {selectedShipment.consignee?.zipcode &&
                          ` - ${selectedShipment.consignee?.zipcode}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {actionType === "accept"
                    ? t("Acceptance Notes (Optional)")
                    : t("Rejection Reason")}
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    actionType === "accept"
                      ? t("Add any notes for this shipment acceptance...")
                      : t("Please provide a reason for rejecting this shipment...")
                  }
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={btnLoading}
                >
                  {t("Cancel")}
                </Button>
                <Button
                  onClick={handleShipmentAction}
                  disabled={btnLoading}
                  className={
                    actionType === "accept"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }
                >
                  {btnLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t("Processing...")}
                    </div>
                  ) : (
                    <>
                      {actionType === "accept" ? (
                        <>
                          <CheckCircle size={16} className="mr-2" />
                          {t("Accept Shipment")}
                        </>
                      ) : (
                        <>
                          <XCircle size={16} className="mr-2" />
                          {t("Reject Shipment")}
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ShipmentDetailsDialog
        viewDialogOpen={viewDialogOpen}
        setViewDialogOpen={setViewDialogOpen}
        viewLoading={viewLoading}
        viewShipment={viewShipment}
        copiedTrackingNo={copiedTrackingNo}
        handleCopy={handleCopy}
        formatDate={formatDate}
        isPrinting={isPrinting}
        handlePrint={handlePrint}
      />
    </div>
  );
}

export default CustomerCreatedShipments;
