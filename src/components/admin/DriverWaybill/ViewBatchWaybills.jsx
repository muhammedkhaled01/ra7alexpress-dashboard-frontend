import React, { useEffect, useState, useCallback } from "react";
import { Button } from "../../ui/button";
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
import { useParams, useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Check,
  Loader2,
  PrinterIcon,
  RefreshCcw,
  LucideLoader,
} from "lucide-react";
import { can, convertBoolean, handleError, printLabel } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import axiosMerchant from "@/axios";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Select from "@/components/misc/Select.jsx";

const DriverViewBatchWaybills = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [waybills, setWaybills] = useState([]);
  const [search, setSearch] = useState("");
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const { driver_id, batch_id } = useParams();

  const accessAbility = can("Driver Waybill access");

  const fetchWaybills = useCallback(
    async (query, page, perPage) => {
      if (!accessAbility) return navigate("/unauthorized");
      setLoading(true);
      const q = String(query || "").trim();
      const url = `driver_waybills/batches/${batch_id}?page=${page}&driver_id=${driver_id}&per_page=${perPage}&query=${encodeURIComponent(
        q
      )}`;
      try {
        const res = await axiosMerchant.get(url);
        setLinks(res.data?.data?.links || []);
        setWaybills(res.data?.data?.data || []);
      } catch (e) {
        handleError(e);
      } finally {
        setLoading(false);
      }
    },
    [batch_id, driver_id, accessAbility, navigate]
  );

  useEffect(() => {
    const delay = search.trim() ? 500 : 0;
    const timer = setTimeout(
      () => fetchWaybills(search, currentPage, itemsPerPage),
      delay
    );
    return () => clearTimeout(timer);
  }, [currentPage, itemsPerPage, search, fetchWaybills]);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  const handleItemsPerPageChange = (opt) => {
    setItemsPerPage(Number(opt.value));
    setCurrentPage(1);
  };
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };
  const handleRefresh = () => {
    if (!search) fetchWaybills("", 1, itemsPerPage);
    setSearch("");
    setCurrentPage(1);
  };

  const handleBulkPrint = async () => {
    if (selectedRows.size === 0) return;
    setIsPrinting(true);
    try {
      const ids = waybills
        .filter((s) => selectedRows.has(s.id))
        .map((s) => s.id);
      const response = await axiosMerchant.post(
        `/driver_waybills/printMultipleWaybills`,
        { ids, forcePrintMode: 'local-waybill' }
      );
      await printLabel(response.data.html);
    } catch (e) {
      handleError(e);
    } finally {
      setIsPrinting(false);
    }
  };

  const toggleRowSelection = useCallback((id) => {
    setSelectedRows((prev) => {
      const ns = new Set(prev);
      ns.has(id) ? ns.delete(id) : ns.add(id);
      return ns;
    });
  }, []);
  const toggleSelectAll = useCallback(() => {
    if (selectAll) setSelectedRows(new Set());
    else setSelectedRows(new Set(waybills.map((s) => s.id)));
    setSelectAll(!selectAll);
  }, [selectAll, waybills]);
  useEffect(() => {
    setSelectedRows(new Set());
    setSelectAll(false);
  }, [waybills]);

  const handleCopy = async (trackingNo) => {
    await navigator.clipboard.writeText(trackingNo);
    setCopiedTrackingNo(trackingNo);
    setTimeout(() => setCopiedTrackingNo(null), 2000);
  };

  const handlePrintOne = async (waybill) => {
    try {
      setIsPrinting((prev) => ({ ...prev, [waybill.id]: true }));
      const response = await axiosMerchant.post(
        `/driver_waybills/printMultipleWaybills`,
        { ids: [waybill.id], forcePrintMode: 'local-waybill' }
      );
      await printLabel(response.data.html);
    } catch (e) {
      handleError(e);
    } finally {
      setIsPrinting((prev) => ({ ...prev, [waybill.id]: false }));
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center my-2 space-y-4 md:space-y-0">
        <PageTitle title={t("Driver Waybills")} />
        <div className="flex flex-col md:flex-row items-center gap-3">
          <form className="flex justify-end w-full md:w-auto">
            <div className="flex flex-col md:flex-row md:gap-x-2 w-full">
              <Input
                name="search"
                type="text"
                className="w-full md:w-[200px]"
                value={search}
                id="search"
                placeholder={t("Search By Tracking Number...")}
                onChange={handleSearchChange}
                icon={
                  search.trim() !== "" && (
                    <RefreshCcw
                      className="w-4 h-4 cursor-pointer"
                      onClick={handleRefresh}
                    />
                  )
                }
              />
              <Button type="button" variant="refresh" onClick={handleRefresh}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>
          </form>
          <label className="text-sm text-gray-600 dark:text-gray-300">
            {t("Show")}
          </label>
          <Select
            value={{ value: itemsPerPage, label: String(itemsPerPage) }}
            onChange={handleItemsPerPageChange}
            options={[5, 8, 15, 25, 50, 100].map((n) => ({
              value: n,
              label: String(n),
            }))}
            className="w-20 text-sm"
            isSearchable={false}
          />
        </div>
      </div>

      {selectedRows.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 p-3 mt-3 rounded-lg flex justify-between items-center">
          <div className="text-sm text-blue-700 dark:text-blue-200">
            {selectedRows.size}{" "}
            {selectedRows.size === 1 ? t("item") : t("items")} {t("selected")}
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      )}

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("#")}</TableHead>
              <TableHead isFixed>
                <div className="flex items-center">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={toggleSelectAll}
                    className="h-4 w-4"
                  />
                  <span className="ml-2">{t("Tracking No.")}</span>
                </div>
              </TableHead>
              <TableHead>{t("Used")}</TableHead>
              <TableHead>{t("Print")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : waybills.length > 0 ? (
              waybills.map((st, idx) => (
                <TableRow key={st.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell isFixed hasCheckbox>
                    <div className="flex items-center gap-x-2">
                      <Checkbox
                        checked={selectedRows.has(st.id)}
                        onCheckedChange={() => toggleRowSelection(st.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 mt-1"
                        aria-label={`Select waybill ${st.tracking_no}`}
                      />
                      <button
                        onClick={() => handleCopy(st.tracking_no)}
                        className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                      >
                        {copiedTrackingNo === st.tracking_no ? (
                          <Check size={18} className="text-green-500" />
                        ) : (
                          <Copy size={18} />
                        )}
                      </button>
                      <span className="font-medium">{st.tracking_no}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>{convertBoolean(st.used)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handlePrintOne(st)}
                      disabled={!!isPrinting[st.id] || st.used}
                    >
                      {isPrinting[st.id] ? (
                        <LucideLoader className="h-4 w-4 animate-spin inline-block" />
                      ) : (
                        <PrinterIcon className="h-6 w-6" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <NoRecordFound />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination links={links} onPageChange={handlePageChange} />
      </div>

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={() =>
            fetchWaybills(search, currentPage, itemsPerPage)
          }
          record={null}
          onClose={() => setDeleteAlert(false)}
          api={"driver_waybills/delete"}
        />
      )}
    </div>
  );
};

export default DriverViewBatchWaybills;
