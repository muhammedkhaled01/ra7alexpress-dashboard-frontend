import axiosMerchant from "@/axios";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "../../NoRecordFound";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";
import {
  Check,
  Copy,
  Eye,
  Loader2,
  LucideLoader,
  PrinterIcon,
  RefreshCcw,
  User,
  PhoneCall,
  Phone,
  Trash2,
} from "lucide-react";
import {
  can,
  formatDecimalValue,
  handleError,
  printLabel,
} from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import ExportDialog from "@/components/misc/ExportDialog";
import ShipmentViewNew from "./ShipmentViewNew";
import TaskEditNew from "./EditNew";
import { useDispatch, useSelector } from "react-redux";
import { getFacilities } from "@/stores/features/ajaxFeature";
import { useLanguage } from "@/contexts/LanguageProvider";
import { clearShipmentFilters } from "@/stores/features/shipmentFiltersFeature";
import { DateTimeRangePicker } from "@/components/misc/DateTimeRangePicker";
import moment from '@/utils/moment';
import DeliveryTimeLabel from "./DeliveryTimeLabel";

const today = moment().format('YYYY-MM-DD');
const twoDaysLater = moment().add(2, 'days').format('YYYY-MM-DD');
const ShipmentIndexCondensed = () => {
  const [filters, setFilters] = useState({
    from: today,
    to: today,
    from_time: "00:00",
    to_time: "23:59",
    from_future: twoDaysLater,
    to_future: twoDaysLater,
    from_time_future: "00:00",
    to_time_future: "23:59",
    warehouse: '',
    warehouse_type: '',
    shelf_barcode: '',
    search: ''
  });
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [links, setLinks] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [search, setSearch] = useState("");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [individualPrinting, setIndividualPrinting] = useState({});
  const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const { language } = useLanguage();

  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const facilities = useSelector((state) => state.ajax.facilities);
  const { decimalPrecision } = useSelector((state) => state.setting);
  const authUser = useSelector((store) => store.auth.user);

  // Permissions
  const accessAbility = can("Shipment Future access");
  const deleteAbility = can("Shipment Future delete");
  const printAbility = can("Shipment Future print");
// Debugging
  useEffect(() => {
    console.log('printAbility', printAbility);
    console.log('deleteAbility', deleteAbility);
    console.log('accessAbility', accessAbility);
  }, [printAbility, deleteAbility, accessAbility]);

  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  useEffect(() => {
    const fetchWarehouses = async () => {
      setWarehousesLoading(true);
      try {
        const workspaceData = authUser?.workspaces || [];
        setWarehouses(workspaceData || []);
      } catch (error) {
        console.error('Error fetching warehouses:', error);
        handleError(error);
      } finally {
        setWarehousesLoading(false);
      }
    };

    fetchWarehouses();
  }, []);


  const mapToOptions = (arr) =>
    arr?.map((item) => ({
      value: item.id,
      label: item.name,
      type: item.type,
    })) || [];
  const facilityGroups = [
    { label: t("Hubs"), options: mapToOptions(facilities?.hubs) },
    { label: t("Stations"), options: mapToOptions(facilities?.stations) },
    { label: t("Branches"), options: mapToOptions(facilities?.branches) },
  ];

  const openDeleteAlert = (record) => {
    if (Array.isArray(record)) {
      setselectedRecord(Array.from(record));
    } else {
      setselectedRecord(record);
    }
    setDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  const closeEditDialog = () => {
    setSelectedShipment(null);
    setEditDialogOpen(false);
  };

  const handlePageChange = (pageNumber) => {
    if (isFetching || pageNumber === filters.currentPage) return;
    setFilters(prev => ({ ...prev, currentPage: pageNumber }));
  };

  const handlePrint = async (shipment) => {
    try {
      setIndividualPrinting((prev) => ({ ...prev, [shipment.id]: true }));
      const response = await axiosMerchant.get(`/shipments/printShipment`, {
        params: { tracking_no: shipment.tracking_no },
      });
      const printResult = await printLabel(response.data.html);
      if (printResult.success && printResult.printed) {
        try {
          await axiosMerchant.post(`/shipments/printCompleted`, null, {
            params: { tracking_no: shipment.tracking_no },
          });
        } catch (historyError) {
          console.error("Failed to create print history:", historyError);
        }
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIndividualPrinting((prev) => ({ ...prev, [shipment.id]: false }));
    }
  };

  const handleBulkPrint = async () => {
    if (selectedRows.size === 0) return;
    setIsPrinting(true);
    try {
      const selectedShipments = shipments.filter((shipment) => selectedRows.has(shipment.id));
      const trackingNumbers = selectedShipments.map((shipment) => shipment.tracking_no);
      const response = await axiosMerchant.post(`/shipments/printMultipleShipments`, {
        tracking_numbers: trackingNumbers,
      });
      const printResult = await printLabel(response.data.html);
      if (printResult.success && printResult.printed) {
        for (const shipment of selectedShipments) {
          try {
            await axiosMerchant.post(`/shipments/printCompleted`, null, {
              params: { tracking_no: shipment.tracking_no },
            });
          } catch (historyError) {
            console.error("Failed to create print history:", historyError);
          }
        }
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsPrinting(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!accessAbility) {
      navigate("/unauthorized");
      return;
    }

    if (!facilities) {
      await dispatch(getFacilities());
    }

    setLoading(true);
    try {
      const params = {
        page: filters.currentPage || 1,
        per_page: itemsPerPage,
        ...(filters.from && { created_from: `${filters.from} ${filters.from_time}` }),
        ...(filters.to && { created_to: `${filters.to} ${filters.to_time}` }),
        ...(filters.from_future && { from_future: `${filters.from_future} ${filters.from_time_future}` }),
        ...(filters.to_future && { to_future: `${filters.to_future} ${filters.to_time_future}` }),
        ...(filters.warehouse && { facility_id: filters.warehouse }),
        ...(filters.warehouse_type && { facility_type: filters.warehouse_type }),
        ...(filters.shelf_barcode && { shelf_barcode: filters.shelf_barcode }),
        ...(search && { query: search }),
        is_outsourced: 0,
      };

      const response = await axiosMerchant.get("shipments/future-shipments", { params });

      if (response.data.data) {
        setShipments(response.data?.data?.shipments?.data || []);
        setLinks(response.data?.data?.shipments?.links || []);
      } else {
        setShipments([]);
        setLinks([]);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [accessAbility, facilities, dispatch, itemsPerPage, filters, search, navigate]);
  const debouncedFetchData = useCallback(() => {
    if (isFetching) return () => { };
    setIsFetching(true);
    const timer = setTimeout(() => {
      fetchData().finally(() => setIsFetching(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    debouncedFetchData();
  }, [filters, itemsPerPage, search, debouncedFetchData]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    fetchData();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      search.trim() !== "" ? setRefreshBtn(true) : setRefreshBtn(false);
      handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.from === "/shipments/create") {
      window.history.replaceState({}, document.title);
      handleRefresh();
    }
  }, [location.state, dispatch]);

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    dispatch(clearShipmentFilters());
    setLoading(true);
    setFilters((prev) => ({
      ...prev,
      shelf_barcode: "",
    }))
    fetchData();
  };

  const toggleRowSelection = useCallback((id) => {
    setSelectedRows((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const allIds = shipments.map((shipment) => shipment.id);
      setSelectedRows(new Set(allIds));
    }
    setSelectAll(!selectAll);
  }, [selectAll, shipments]);

  useEffect(() => {
    setSelectedRows(new Set());
    setSelectAll(false);
  }, [shipments]);

  const handleBulkDelete = useCallback(() => {
    if (selectedRows.size > 0) {
      openDeleteAlert(Array.from(selectedRows));
    }
  }, [selectedRows]);

  const handleSubmitSuccess = () => {
    setLoading(true);
    fetchData();
  };

  const handleCopy = async (idToMark, valueToCopy) => {
    if (!valueToCopy) return;
    await navigator.clipboard.writeText(valueToCopy);
    setCopiedTrackingNo(idToMark);
    setTimeout(() => {
      setCopiedTrackingNo(null);
    }, 2000);
  };

  const handleView = (shipment) => {
    setSelectedShipment(shipment);
    setIsViewModalOpen(true);
  };
  const handleCreationDateChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const handleFutureDeliveryDateChange = (key, value) => {
    let newKey = key;
    if (key === 'from') newKey = 'from_future';
    else if (key === 'to') newKey = 'to_future';
    else if (key === 'from_time') newKey = 'from_time_future';
    else if (key === 'to_time') newKey = 'to_time_future';

    setFilters((prev) => ({
      ...prev,
      [newKey]: value
    }));
  };
  const handleFilterChange = (key, value) => {
    if (key === 'warehouse' && value) {
      setFilters((prev) => ({
        ...prev,
        warehouse: value.value,
        warehouse_type: value.type || ''
      }));
    } else if (key === 'warehouse') {
      setFilters((prev) => ({
        ...prev,
        warehouse: '',
        warehouse_type: ''
      }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  }
  return (
    <div>
      <PageTitle title={t("Future Deliveries")} />

      {selectedRows.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 p-3 mt-3 rounded-lg flex justify-between items-center">
          <div className="text-sm text-blue-700 dark:text-blue-200">
            {selectedRows.size} {selectedRows.size === 1 ? "item" : "items"} selected
          </div>
          <div className="flex items-center gap-2">
            {printAbility && (
            <Button
              onClick={handleBulkPrint}
              variant="default"
              size="sm"
              className="flex items-center gap-2"
              disabled={isPrinting}
            >
              {isPrinting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PrinterIcon className="h-4 w-4" />
              )}
              {t("Print Selected")}
            </Button>
            )}
            {deleteAbility && (
            <Button
              onClick={handleBulkDelete}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t("Delete Selected")}
            </Button>
            )}
          </div>
        </div>
      )}

      <div className={`flex flex-col md:flex-row md:justify-between md:items-end mt-2 gap-2 space-y-4 md:space-y-0 p-4 bg-white flex-wrap dark:bg-gray-800 shadow rounded ${selectedRows.size > 0 ? "rounded-t-none" : ""}`}>
        <div>
          <form className="flex md:items-center flex-col md:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col md:flex-row items-center gap-2 w-full">
              <div className="w-full md:w-auto input-container">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  {t("Creation Date")}
                </label>
                <DateTimeRangePicker
                  filters={{
                    from: filters.from,
                    to: filters.to,
                    from_time: filters.from_time,
                    to_time: filters.to_time,
                  }}
                  onChange={handleCreationDateChange}
                  t={t}
                />
              </div>
              <div className="w-full md:w-auto input-container">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  {t("Future Delivery Date")}
                </label>
                <DateTimeRangePicker
                  filters={{
                    from: filters.from_future,
                    to: filters.to_future,
                    from_time: filters.from_time_future,
                    to_time: filters.to_time_future,
                  }}
                  onChange={handleFutureDeliveryDateChange}
                  t={t}
                />
              </div>

              <div className="w-full md:w-[220px] input-container">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  {t("Warehouse")}
                </label>
                <Select
                  value={
                    filters.warehouse
                      ? facilityGroups
                        .flatMap((group) => group.options)
                        .find((option) => option.value === filters.warehouse)
                      : null
                  }
                  onChange={(selected) => handleFilterChange("warehouse", selected || null)}
                  options={facilityGroups}
                  placeholder={t("Filter by warehouse")}
                  className="text-sm w-full"
                  isClearable
                  isLoading={warehousesLoading}
                  isDisabled={warehousesLoading}
                />
              </div>

              <div className="w-full md:w-[220px] input-container">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  {t("Shelf Barcode")}
                </label>
                <Input
                  name="search"
                  type="text"
                  className="w-full md:w-[200px]"
                  value={filters?.shelf_barcode}
                  id="search"
                  placeholder={t("e.g. PE70276")}
                  onChange={(selected) => handleFilterChange("shelf_barcode", selected?.target?.value || null)}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-full md:w-[200px]"
              value={search}
              id="search"
              placeholder={t("e.g. PE040525590507")}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                refreshBtn && (
                  <RefreshCcw
                    className="size-4 cursor-pointer"
                    onClick={handleRefresh}
                  />
                )
              }
            />
          </div>
          <div className="flex justify-between gap-2">
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="size-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                {t("Show")}
              </label>
              <Select
                value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
                onChange={(selectedOption) => {
                  setItemsPerPage(Number(selectedOption.value));
                  setFilters(prev => ({ ...prev, currentPage: 1 }));
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
          </div>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <Table className={`text-xs ${shipments && shipments.length > 0 ? "" : "!p-2"}`}>
            <TableBody>
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : shipments && shipments.length > 0 ? (
          <Table className={`text-xs ${shipments && shipments.length > 0 ? "" : "!p-2"}`}>
            <TableHeader>
              <TableRow>
                <TableHead isFixed>
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={toggleSelectAll}
                      className="h-4 w-4"
                      aria-label="Select all shipments"
                    />
                    <span className="ml-2">{t("Shipment Number")}</span>
                  </div>
                </TableHead>
                <TableHead>{t("Expected Delivery Date")}</TableHead>
                <TableHead>{t("notifications")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("Amount")}</TableHead>
                <TableHead>{t("shelves")}</TableHead>
                <TableHead>{t("Source")}</TableHead>
                <TableHead>{t("Destination")}</TableHead>
                <TableHead>{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.length > 0 &&
                shipments?.map((shipment, index) => (
                  <TableRow key={index}>
                    <TableCell isFixed hasCheckbox className="font-medium !p-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 flex items-start gap-1">
                          <Checkbox
                            checked={selectedRows.has(shipment.id)}
                            onCheckedChange={() => toggleRowSelection(shipment.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 mt-1"
                            aria-label={`Select shipment ${shipment.tracking_no}`}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(shipment?.tracking_no, shipment?.tracking_no);
                            }}
                            className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors mt-1"
                            aria-label="Copy tracking number"
                          >
                            {copiedTrackingNo === shipment?.tracking_no ? (
                              <Check size={16} className="text-green-500" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-x-2 mb-2">
                            <span className="font-bold text-sm truncate">
                              {shipment?.tracking_no}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      {shipment?.shipment_delivery?.future_delivery_date ? (
                        <div className="flex flex-col items-center">
                          <div className="font-semibold text-gray-800 dark:text-gray-200">
                            {shipment?.shipment_delivery?.future_delivery_date.split(' ')[0]}
                          </div>
                          <DeliveryTimeLabel
                            futureDateString={shipment?.shipment_delivery?.future_delivery_date.split(' ')[0]}
                          />
                        </div>
                      ) : (
                        <div className="text-gray-500">-</div>
                      )}
                    </TableCell>

                    <TableCell className="text-center">

                      {Number(shipment?.is_alert) === 1 ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">
                          No
                        </span>
                      )}


                    </TableCell>
                    <TableCell className="text-center">
                      <div className="grid [grid-template-columns:auto_auto] w-max mx-auto gap-x-4 items-center space-y-2">
                        <User className="size-4 inline-block mr-1 dark:text-gray-400 text-gray-800 fill-current" />
                        {shipment?.consignee?.name}
                        <b>
                          <PhoneCall className="size-4 inline-block mr-1 dark:text-gray-300 text-gray-800 fill-current" />
                        </b>
                        <span className="[direction:ltr]">{`${shipment?.consignee?.country_key_cellphone}${shipment?.consignee?.cellphone}`}</span>
                        {shipment?.consignee?.alternatePhone &&
                          shipment?.consignee?.country_key_alternatePhone && (
                            <>
                              <Phone className="size-4 inline-block mr-1 dark:text-gray-400 text-gray-600 stroke-[1.5]" />
                              <span className="[direction:ltr]">
                                {`${shipment?.consignee?.country_key_alternatePhone ?? ""}${shipment?.consignee?.alternatePhone}`}
                              </span>
                            </>
                          )}
                      </div>
                    </TableCell>

                    <TableCell className="!text-start">
                      <div className="grid [grid-template-columns:auto_auto] w-max mx-auto gap-x-4 items-baseline space-y-2">
                        <span className="font-bold">{t("Amount")}: </span>
                        {shipment?.payment_type === "COD"
                          ? formatDecimalValue(shipment?.value, decimalPrecision)
                          : "-"}
                        <span className="font-bold">{t("Delivery Fee:")}</span>{" "}
                        {shipment?.delivery_fee
                          ? formatDecimalValue(shipment?.delivery_fee, decimalPrecision)
                          : "N/A"}
                        <span className="text-[14px] font-bold">{t("Total COD:")}</span>
                        <span className="text-[14px] font-bold">
                          {shipment?.fee_payer === "merchant"
                            ? formatDecimalValue(shipment?.value, decimalPrecision)
                            : formatDecimalValue(shipment?.amount, decimalPrecision)}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {shipment?.payment_type ? (
                          <Badge
                            variant={shipment?.payment_type === "COD" ? "outline" : "success"}
                            className="ml-2"
                          >
                            {shipment?.payment_type === "COD" ? "COD" : "Paid"}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="ml-2">
                            N/A
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell
                      className="!text-start">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(shipment?.id, shipment?.assigned_to_shelf?.barcode);
                        }}
                        className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors mt-1 flex-shrink-0 flex items-start justify-center w-full gap-1"
                        aria-label="Copy shelf barcode"
                      >
                        <span>{shipment?.assigned_to_shelf?.barcode ?? "no shelf"}</span>
                        {
                          shipment?.assigned_to_shelf?.barcode && (
                            copiedTrackingNo === shipment?.id ? (
                              <Check size={16} className="text-green-500" />
                            ) : (
                              <Copy size={16} />
                            )
                          )
                        }
                      </button >
                    </TableCell >

                    <TableCell className="!text-start">
                      <div className="grid [grid-template-columns:auto_auto] w-max mx-auto gap-x-4 items-baseline space-y-2">
                        <span className="font-bold">{shipment?.owner?.name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="!text-start">
                      <div className="grid [grid-template-columns:auto_auto] w-max mx-auto gap-x-4 items-baseline space-y-2">
                        <span className="font-bold">{shipment?.warehouse?.name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex gap-1.5">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(shipment);
                          }}
                          variant="show"
                          size="xs"
                          className="h-7 w-7 p-0 flex items-center justify-center"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(shipment);
                          }}
                          disabled={individualPrinting[shipment?.id] || isPrinting}
                          variant="print"
                          size="xs"
                          className="h-7 w-7 p-0 flex items-center justify-center"
                        >
                          {individualPrinting[shipment?.id] ? (
                            <LucideLoader className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <PrinterIcon className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow >
                ))}
            </TableBody >
          </Table >
        ) : (
          <NoRecordFound />
        )}
        <Pagination
          links={links}
          currentPage={filters?.currentPage}
          onPageChange={handlePageChange}
        />
      </div >

      {deleteAlert && (
        <DeleteAlert
          open={deleteAlert}
          onClose={closeDeleteAlert}
          record={Array.isArray(selectedRecord) ? selectedRecord : selectedRecord}
          api="shipments/delete"
          onSubmitSuccess={() => {
            if (Array.isArray(selectedRecord)) {
              setSelectedRows((prev) => {
                const newSelection = new Set(prev);
                selectedRecord.forEach((id) => newSelection.delete(id));
                return newSelection;
              });
            }
            handleSubmitSuccess();
          }}
          multiple={Array.isArray(selectedRecord)}
        />
      )}
      <TaskEditNew
        shipment={selectedShipment}
        isOpen={editDialogOpen}
        setIsOpen={setEditDialogOpen}
        onClose={closeEditDialog}
        onSubmitSuccess={handleSubmitSuccess}
      />
      <ShipmentViewNew
        shipment={selectedShipment}
        isOpen={isViewModalOpen}
        setIsOpen={setIsViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedShipment(null);
        }}
      />

      {
        showExport && (
          <ExportDialog
            model="shipments"
            endpoint="shipments/export"
            fields={[
              { key: "id", label: "ID" },
              { key: "tracking_no", label: "Tracking No" },
              { key: "consignee.name", label: "Consignee Name" },
              { key: "consignee.cellphone", label: "Consignee Phone" },
              { key: "consignee.alernatePhone", label: "Consignee Alternate Phone" },
              { key: "consignee.country.name", label: "Consignee Country Name" },
              { key: "consignee.governorate.en_name", label: "Consignee Governorate Name" },
              { key: "consignee.state.en_name", label: "Consignee State Name" },
              { key: "consignee.streetAddress", label: "Consignee Street Address" },
              { key: "consignee.zipcode", label: "Consignee Zip Code" },
              { key: "amount", label: "COD" },
              { key: "payment_type", label: "Payment Type" },
              { key: "shipment_information.weight", label: "Weight" },
              { key: "updated_at", label: "Updated At" },
            ]}
            onClose={() => setShowExport(false)}
          />
        )
      }
    </div >
  );
};

export default ShipmentIndexCondensed;