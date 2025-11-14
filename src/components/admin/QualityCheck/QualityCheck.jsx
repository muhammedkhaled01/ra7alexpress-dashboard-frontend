import React, { useEffect, useState, useCallback } from "react";
import axiosMerchant from "@/axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast"; // تم استبدال react-toastify بـ react-hot-toast

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Shield,
} from "lucide-react";
import ImagePreview from "@/components/misc/ImagePreview";
import { Button } from "@/components/ui/button";
import FineDialog from "./FineDialog";
import Select from "@/components/misc/Select";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useDispatch, useSelector } from "react-redux";
import {
  getDrivers,
  getSystemDeliveryExceptions,
} from "@/stores/features/ajaxFeature";
import { DateTimeRangePicker } from "@/components/misc/DateTimeRangePicker";
import moment from "@/utils/moment";
import { Input } from "@/components/ui/input";
import {
  RefreshCcw,
  Copy,
  Check,
  Bell,
  BellOff,
  CheckCircle,
} from "lucide-react";
import { can } from "@/utils/helpers";
import { useLanguage } from "@/contexts/LanguageProvider";

function QualityCheck() {
  const [loading, setLoading] = useState(true);
  const [fetchingData, setFetchingData] = useState(false);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState({});
  const [shipmentCount, setShipmentCount] = useState(0);
  const [driverValue, setDriverValue] = useState(null);
  const [exceptionValue, setExceptionValue] = useState(null);
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);
  const today = moment().format("YYYY-MM-DD");
  const [filters, setFilters] = useState({
    trackingNo: "",
    driver: null,
    delivery_exception: null,
    from: today,
    to: today,
    from_time: "00:00",
    to_time: "23:59",
  });
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  const [expandedShipmentId, setExpandedShipmentId] = useState(null);
  const toggleRowExpansion = (shipmentId) => {
    setExpandedShipmentId((prev) => (prev === shipmentId ? null : shipmentId));
  };

  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { language } = useLanguage();

  const drivers = useSelector((store) => store.ajax.drivers);
  const systemDeliveryExceptions = useSelector(
    (store) => store.ajax.systemDeliveryExceptions
  );

  useEffect(() => {
    if (!drivers) dispatch(getDrivers());
    if (!systemDeliveryExceptions) dispatch(getSystemDeliveryExceptions());
  }, [dispatch, drivers, systemDeliveryExceptions]);

  useEffect(() => {
    fetchData();
  }, [filters, itemsPerPage, currentPage]);

  useEffect(() => {
    if (!loading && shipments && shipments.length === 0) {
      setLoading(false);
    }
  }, [shipments, loading]);

  const handleCopy = async (trackingNo) => {
    await navigator.clipboard.writeText(trackingNo);
    setCopiedTrackingNo(trackingNo);

    setTimeout(() => {
      setCopiedTrackingNo(null);
    }, 2000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Create a new object with only non-null values
      //   const activeFilters = Object.entries(filters)
      //     .filter(([_, value]) => value !== null)
      //     .reduce(
      //       (acc, [key, value]) => ({
      //         ...acc,
      //         [key]: value,
      //       }),
      //       {}
      //     );
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== null && v !== undefined)
      );

      // Add pagination parameters
      const params = new URLSearchParams({
        page: currentPage,
        per_page: itemsPerPage,
        ...activeFilters,
      });

      const response = await axiosMerchant.get(
        `quality_check?${params.toString()}`
      );
      setShipments(response.data.data.shipments.data);
      setStats(response.data.data.stats);
      setLinks(response.data.data.shipments.links);
      console.log(links, "links");
      setShipmentCount(response.data.success.count);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error(t("Failed to fetch data"));
      setLoading(false);
    } finally {
      setFetchingData(false);
    }
  }, [
    filters,
    currentPage,
    itemsPerPage,
    setShipments,
    setLinks,
    setShipmentCount,
    t,
    setStats,
  ]);
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  const handleSubmitSuccess = () => {
    fetchData();
  };

  console.log(stats);
  const [sendingWarnings, setSendingWarnings] = useState({});

  const sendWarning = async (shipment) => {
    setSendingWarnings((prev) => ({
      ...prev,
      [shipment.id]: true,
    }));

    try {
      await axiosMerchant.post("quality_check/send_warning", {
        shipment_tracking_no: shipment?.tracking_no,
        driver_id: shipment?.current_assignment?.driver_id,
      });
      toast.success(t("Warning sent successfully"));
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(t("Failed to send warning"));
    } finally {
      setSendingWarnings((prev) => ({
        ...prev,
        [shipment.id]: false,
      }));
    }
  };
  //   const handleRefresh = async () => {
  //     if (
  //       filters?.driver === null &&
  //       filters.trackingNo === "" &&
  //       filters.trackingNo === null
  //     ) {
  //       await fetchData();
  //       return;
  //     }
  //     setRefreshBtn(false);
  //     setCurrentPage(1);
  //     setFilters({
  //       driver: null,
  //       delivery_exception: null,
  //       trackingNo: "",
  //     });
  //     setDriverValue("");
  //     setExceptionValue("");
  //   };
  const handleRefresh = async () => {
    setRefreshBtn(false);
    setCurrentPage(1);
    setFilters({
      trackingNo: "",
      driver: null,
      delivery_exception: null,
      from: today,
      to: today,
      from_time: "00:00",
      to_time: "23:59",
    });
    setDriverValue("");
    setExceptionValue("");
    await fetchData();
  };
  const navigate = useNavigate();

  const canAccess = can("Quality Check access");
  const canSendWarning = can("Quality Check send warning");
  const canCreateFine = can("Fine create");

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <Card className="">
        <CardHeader>
          <div className="flex flex-row justify-between align-center">
            <CardTitle>
              {t("Quality Check")} {shipmentCount ? `- ${shipmentCount}` : ``}
            </CardTitle>
          </div>

          {/* Stats Cards */}
          <br />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {t("Verified with OTP")}
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.otp_verified || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <br />

          <div className="flex flex-wrap items-end gap-4 mt-2">
            <div className="w-[250px]">
              <label htmlFor="">{t("Tracking no")}</label>
              <Input
                name="tracking_no"
                placeholder={t("Tracking no")}
                type="text"
                value={filters.trackingNo}
                onChange={(e) => {
                  if (!fetchingData) {
                    setFilters((prev) => ({
                      ...prev,
                      trackingNo: e.target.value,
                    }));
                  }
                }}
              />
            </div>
            <div className="w-[250px]">
              <label htmlFor="">{t("Driver")}</label>
              <Select
                name="driver"
                placeholder={t("Driver")}
                options={drivers?.map((driver) => ({
                  label: driver.name,
                  value: driver.id,
                }))}
                value={driverValue}
                onChange={(e) => {
                  if (!fetchingData) {
                    setDriverValue(e);
                    setFilters((prev) => ({
                      ...prev,
                      driver: e.value,
                    }));
                  }
                }}
              />
            </div>

            <div className="w-[250px]">
              <label htmlFor="">{t("Delivery Exceptions")}</label>
              <Select
                name="systemDeliveryException"
                placeholder={t("Delivery Exceptions")}
                options={systemDeliveryExceptions?.map((sysExc) => ({
                  label: sysExc.label,
                  value: sysExc.name,
                }))}
                value={exceptionValue}
                onChange={(e) => {
                  if (!fetchingData) {
                    setExceptionValue(e);
                    setFilters((prev) => ({
                      ...prev,
                      delivery_exception: e.value,
                    }));
                  }
                }}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1">{t("Date & Time Range")}</label>
              <DateTimeRangePicker
                filters={filters}
                onChange={handleFilterChange}
                t={t}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  {t("Show")}
                </label>
                <Select
                  value={{
                    value: itemsPerPage,
                    label: itemsPerPage.toString(),
                  }}
                  onChange={(selectedOption) => {
                    setItemsPerPage(Number(selectedOption.value));
                  }}
                  options={[
                    { value: 5, label: "5" },
                    { value: 8, label: "8" },
                    { value: 15, label: "15" },
                    { value: 25, label: "25" },
                    { value: 50, label: "50" },
                    { value: 100, label: "100" },
                  ]}
                  className="w-20 text-sm"
                  isSearchable={false}
                />
              </div>
              <div className="space-x-2">
                <Button type="button" variant="refresh" onClick={handleRefresh}>
                  <RefreshCcw className="w-4 h-4" />
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
                  {/* <TableHead className="w-[100px]">#</TableHead> */}
                  <TableHead isFixed>{t("Tracking no")}</TableHead>
                  <TableHead>{t("Driver")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Warnings")}</TableHead>
                  <TableHead>{t("Delivery Exception")}</TableHead>
                  <TableHead>{t("Proof")}</TableHead>
                  <TableHead>{t("Action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading || fetchingData ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : shipments && shipments.length > 0 ? (
                  shipments.map((shipment, index) => {
                    const history = shipment.in_exception
                      ? shipment.core_exception
                      : shipment.shipment_histories[0];
                    return (
                      <React.Fragment key={index}>
                        <TableRow
                          key={index}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => toggleRowExpansion(shipment.id)}
                        >
                          {/* <TableCell className="font-medium">{index + 1}</TableCell> */}
                          <TableCell className="font-medium" isFixed>
                            <div className="flex items-center gap-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(shipment.tracking_no);
                                }}
                                className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                                aria-label="Copy tracking number"
                              >
                                {copiedTrackingNo === shipment.tracking_no ? (
                                  <Check size={18} className="text-green-500" />
                                ) : (
                                  <Copy size={18} />
                                )}
                              </button>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {shipment.tracking_no}
                                </span>
                                {expandedShipmentId === shipment.id ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : language === "en" ? (
                                  <ChevronRight className="h-4 w-4" />
                                ) : (
                                  <ChevronLeft className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {shipment.current_assignment?.driver?.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                shipment.status === "DELIVERED"
                                  ? "success"
                                  : "destructive"
                              }
                            >
                              {shipment.in_exception
                                ? shipment.core_exception?.name
                                : shipment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {shipment.warnings_count > 0 ? (
                              <div className="flex items-center gap-1">
                                <Badge
                                  variant="destructive"
                                  className="animate-pulse"
                                >
                                  {shipment.warnings_count} {t("Warning(s)")}
                                </Badge>
                                <Bell className="h-4 w-4 text-rose-500" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className="border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                >
                                  {t("No Warnings")}
                                </Badge>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {shipment.in_exception ? history?.type : shipment.status}
                          </TableCell>
                          <TableCell>
                            {shipment.in_exception ? (
                              <>
                                {history?.proof ? (
                                  <ImagePreview
                                    style={{ width: "100px", height: "100px" }}
                                    src={history?.proof}
                                  />
                                ) : (
                                  t("No Proof")
                                )}
                              </>
                            ) : (
                              ""
                            )}
                          </TableCell>
                          <TableCell className="space-x-2">
                            {shipment.in_exception ? (
                              <>
                                {canCreateFine && (
                                  <FineDialog
                                    shipment={shipment}
                                    onSubmitSuccess={handleSubmitSuccess}
                                  />
                                )}
                                {canSendWarning && (
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sendWarning(shipment);
                                    }}
                                    variant="outline"
                                    disabled={sendingWarnings[shipment.id]}
                                  >
                                    {sendingWarnings[shipment.id] ? (
                                      <>
                                        <svg
                                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                        >
                                          <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                          ></circle>
                                          <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                          ></path>
                                        </svg>
                                        {t("Sending...")}
                                      </>
                                    ) : (
                                      t("Send Warning")
                                    )}
                                  </Button>
                                )}
                              </>
                            ) : (
                              ""
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={7} className="p-0">
                            <Collapsible
                              open={expandedShipmentId === shipment.id}
                              onOpenChange={() => toggleRowExpansion(shipment.id)}
                            >
                              <CollapsibleContent>
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t text-[13px]">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Exception Details */}
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-[14px]">
                                        {t("Exception Details")}
                                      </h4>
                                      <div className="space-y-1">
                                        <p>
                                          <span className="font-bold">
                                            {t("Type")}:{" "}
                                          </span>
                                          <Badge
                                            variant="outline"
                                            className="ml-1"
                                          >
                                            {history?.name || t("No Type")}
                                          </Badge>
                                        </p>
                                        <p>
                                          <span className="font-bold">
                                            {t("Description")}:{" "}
                                          </span>
                                          {history?.description ||
                                            t("No description available")}
                                        </p>
                                        <p>
                                          <span className="font-bold">
                                            {t("Time")}:{" "}
                                          </span>
                                          {history?.time
                                            ? new Date(
                                                history?.time
                                              ).toLocaleString()
                                            : t("Not available")}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Operator Details */}
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-[14px]">
                                        {t("Operator Details")}
                                      </h4>
                                      <div className="space-y-1">
                                        <p>
                                          <span className="font-bold">
                                            {t("Operator")}:{" "}
                                          </span>
                                          {history?.operatorInfo ||
                                            t("Not assigned")}
                                        </p>
                                        <p>
                                          {shipment.shipment_delivery?.delivery_lat &&
                                            shipment.shipment_delivery
                                              ?.delivery_lng && (
                                              <>
                                                <span className="font-bold">
                                                  {t("Location")}:{" "}
                                                </span>

                                                <a
                                                  href={`https://www.google.com/maps/search/?api=1&query=${shipment.shipment_delivery?.delivery_lat},${shipment.shipment_delivery?.delivery_lng}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  <span className="text-sm text-blue-500">
                                                    {
                                                      shipment.shipment_delivery
                                                        ?.delivery_lat
                                                    }
                                                    ,{" "}
                                                    {
                                                      shipment.shipment_delivery
                                                        ?.delivery_lng
                                                    }
                                                  </span>
                                                </a>
                                              </>
                                            )}
                                        </p>
                                        {(() => {
                                          const w = shipment.warehouse; // { id, name, type } أو null
                                          const label = w?.type
                                            ? t(
                                                w.type.charAt(0).toUpperCase() +
                                                  w.type.slice(1)
                                              ) // Hub / Station / Branch...
                                            : t("Hub"); // fallback

                                          return (
                                            <p>
                                              <span className="font-bold">
                                                {label}:{" "}
                                              </span>
                                              {w?.name || t("No hub assigned")}
                                            </p>
                                          );
                                        })()}

                                        <p>
                                          <span className="font-bold">
                                            {t("OTP Verified")}:{" "}
                                          </span>
                                          {shipment?.shipment_delivery?.otp_verified
                                            ? t("Yes")
                                            : t("No")}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Proof Details */}
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-[14px]">
                                        {t("Proof Details")}
                                      </h4>
                                      <div className="space-y-1">
                                        {history?.proof ? (
                                          <div className="mt-2">
                                            <ImagePreview
                                              style={{
                                                width: "150px",
                                                height: "150px",
                                                objectFit: "cover",
                                              }}
                                              className="rounded-lg border border-gray-200 dark:border-gray-700"
                                              src={history?.proof}
                                            />
                                          </div>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="text-yellow-600 bg-yellow-50"
                                          >
                                            {t("No Proof Available")}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
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
        </CardContent>
      </Card>
    </div>
  );
}

export default QualityCheck;
