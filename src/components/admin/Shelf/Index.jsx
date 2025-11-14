import axiosMerchant from "@/axios";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
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

import { Link, useNavigate, useLocation } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";
import {
  RefreshCcw,
  LucideLoader,
  PrinterIcon,
  Trash,
  Copy,
  Check,
  EyeIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Create from "./Create";
import { can, hasRole, printLabel, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useDispatch, useSelector } from "react-redux";
import { getShelfCategories } from "@/stores/features/ajaxFeature";

const ShelfIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8); // NEW: like Shipments
  const [shelves, setShelves] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [isPrinting, setIsPrinting] = useState({});
  const [bulkPrinting, setBulkPrinting] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState(null);
  const [selectedRecord, setselectedRecord] = useState(null);

  // NEW: bulk-select state
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const dispatch = useDispatch();

  const accessAbility = can("Shelf access");
  const createAbility = can("Shelf create");
  const deleteAbility = can("Shelf delete");
  const isSuperAdmin = hasRole("Super Admin");

  const shelfcategories = useSelector((store) => store.ajax.shelfcategories);

  const [categoryId, setCategory] = useState(null);
  const [categoryError, setCategoryError] = useState(false);
  const extractPaginated = (payload) => {
    const data = payload?.data ?? payload?.shelves?.data ?? [];

    const links = Array.isArray(payload?.links)
      ? payload.links
      : payload?.meta?.links ?? payload?.shelves?.links ?? [];

    return { data, links };
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasQuery = search.trim() !== "";
      setRefreshBtn(hasQuery);
      if (hasQuery) {
        handleSearch();
      } else {
        setCurrentPage(1);
        fetchShelves(1, itemsPerPage);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, itemsPerPage]);

  const handleCategoryChange = (category) => {
    setCategory(category?.value ?? null);
    setCategoryError(false);
    setCurrentPage(1);
    // fetchShelves(1, itemsPerPage);
  };

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
      return;
    }
    fetchShelves(currentPage, itemsPerPage);

    if (!shelfcategories) {
      dispatch(getShelfCategories());
    }
  }, [currentPage, itemsPerPage, categoryId]);

  // refresh after create or when navigating back with closeTabId
  useEffect(() => {
    if (location.state?.closeTabId) {
      window.history.replaceState({}, document.title);
      handleRefresh();
    }
  }, [location.state]);

  // const fetchShelves = async (page = 1, perPage = itemsPerPage) => {
  const fetchShelves = async (
    page = 1,
    perPage = itemsPerPage,
    catId = categoryId,
    q = search
  ) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`shelves`, {
        params: {
          page,
          per_page: perPage,
          // search: search || undefined,
          // category_id: categoryId || undefined,
          search: q || undefined,
          category_id: catId || undefined,
        },
        // params: { page, per_page: perPage, search: search || undefined },
      });

      // يدعم شكلين: data.data.data / data.data
      // const payload = response?.data?.data ?? {};
      // const list = payload?.data ?? payload?.shelves?.data ?? [];
      // const nav = payload?.links ?? payload?.shelves?.links ?? [];

      // setLinks(nav);
      // setShelves(list);
      const payload = response?.data?.data ?? {};
      const { data: list, links: nav } = extractPaginated(payload);
      setShelves(list);
      setLinks(nav);
    } catch (error) {
      console.error("Error fetching shelves:", error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.get(`shelves`, {
        params: {
          page: 1, // start from first page on new search
          per_page: itemsPerPage,
          search,
          category_id: categoryId || undefined,
        },
      });

      // const payload = response?.data?.data ?? {};
      // const list = payload?.data ?? payload?.shelves?.data ?? [];
      // const nav = payload?.links ?? payload?.shelves?.links ?? [];

      // setShelves(list);
      // setLinks(nav);
      const payload = response?.data?.data ?? {};
      const { data: list, links: nav } = extractPaginated(payload);
      setShelves(list);
      setLinks(nav);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error during search:", error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    setCurrentPage(1);
    fetchShelves(1, itemsPerPage);
    setCopiedBarcode(null);
  };

  const handleCopyBarcode = async (barcode) => {
    await navigator.clipboard.writeText(barcode);
    setCopiedBarcode(barcode);
    setTimeout(() => setCopiedBarcode(null), 2000);
  };

  const handlePrint = async (shelf) => {
    try {
      setIsPrinting((prev) => ({ ...prev, [shelf.id]: true }));
      const response = await axiosMerchant.get(`/shelves/printShelf`, {
        params: { id: shelf.id },
      });
      printLabel(response.data); // backend HTML
    } catch (error) {
      console.error("Error fetching shelf data for printing:", error);
      handleError(error);
    } finally {
      setIsPrinting((prev) => ({ ...prev, [shelf.id]: false }));
    }
  };

  const handleCategoryPrint = async () => {
    if (!categoryId) {
      setCategoryError(true);
      toast.error(t("Please select a category first"));
      document
        .querySelector('[data-id="category-select"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    try {
      const response = await axiosMerchant.get(`/shelves/printShelfByCategory`, {
        params: { categoryId },
      });
      printLabel(response.data);
    } catch (error) {
      console.error("Error fetching shelf data for printing:", error);
      handleError(error);
    }
  };

  // ===== Bulk select like Shipments =====
  const toggleRowSelection = useCallback((id) => {
    setSelectedRows((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const allIds = shelves.map((s) => s.id);
      setSelectedRows(new Set(allIds));
    }
    setSelectAll(!selectAll);
  }, [selectAll, shelves]);

  // clear selection when data changes
  useEffect(() => {
    setSelectedRows(new Set());
    setSelectAll(false);
  }, [shelves]);

  const openDeleteAlert = (record) => {
    // record can be single id, array of ids, or object
    if (Array.isArray(record)) {
      setselectedRecord(record);
    } else if (typeof record === "object" && record?.id) {
      setselectedRecord([record.id]);
    } else {
      setselectedRecord(record);
    }
    setDeleteAlert(true);
  };
  const handleBulkPrint = async () => {
    if (selectedRows.size === 0) return;
    try {
      setBulkPrinting(true);
      const ids = Array.from(selectedRows);
      const response = await axiosMerchant.post(`/shelves/printMultiple`, {
        ids,
      });
      printLabel(response.data);
    } catch (error) {
      console.error("Error bulk printing shelves:", error);
      handleError(error);
    } finally {
      setBulkPrinting(false);
    }
  };

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  const handleBulkDelete = useCallback(() => {
    if (!deleteAbility) return;
    if (selectedRows.size > 0) {
      openDeleteAlert(Array.from(selectedRows));
    }
  }, [selectedRows, deleteAbility]);

  if (!accessAbility) {
    return navigate("/unauthorized");
  }

  // options for items-per-page
  const pageSizeOptions = useMemo(
    () => [5, 8, 15, 25, 50, 100].map((n) => ({ value: n, label: String(n) })),
    []
  );

  return (
    <div>
      <PageTitle title={t("Shelves")} />

      {/* Bulk actions bar */}
      {selectedRows.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 p-3 mt-3 rounded-lg flex justify-between items-center">
          <div className="text-sm text-blue-700 dark:text-blue-200">
            {selectedRows.size} {selectedRows.size === 1 ? "item" : "items"}{" "}
            {t("selected")}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleBulkPrint}
              variant="print"
              size="sm"
              className="flex items-center gap-2"
              disabled={bulkPrinting}
            >
              {bulkPrinting ? (
                <LucideLoader className="h-4 w-4 animate-spin" />
              ) : (
                <PrinterIcon className="h-4 w-4" />
              )}
              {t("Print Selected")}
            </Button>
            {deleteAbility && (
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash className="h-4 w-4" />
                {t("Delete Selected")}
              </Button>
            )}
          </div>
        </div>
      )}

      <div
        className={`flex flex-col md:flex-row gap-2 justify-between mt-2 p-4 bg-white dark:bg-gray-800 shadow rounded ${
          selectedRows.size > 0 ? "rounded-t-none" : ""
        }`}
      >
        <div>
          {createAbility && (
            <Create
              onSubmitSuccess={() => fetchShelves(currentPage, itemsPerPage)}
              categorySuccess={() => dispatch(getShelfCategories())}
            />
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <div className="flex gap-x-2">
              <Input
                name="search"
                type="text"
                className="w-[200px]"
                value={search}
                id="search"
                placeholder={t("Search Shelves...")}
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
          </form>
          <div className="flex justify-between md:justify-normal md:items-center gap-x-4">
            <div className="w-64">
              <Select
                data-id="category-select"
                options={shelfcategories?.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
                name="category"
                onChange={handleCategoryChange}
                placeholder={t("Select category")}
                className={`mt-1 block w-full ${
                  categoryError
                    ? "ring-2 ring-red-500 ring-offset-1 rounded-md"
                    : ""
                }`}
              />
            </div>
            {/* <Button onClick={handleCategoryPrint} type="button" variant="print">
              <PrinterIcon />
            </Button> */}
            <Button
              type="button"
              variant="refresh"
              onClick={handleRefresh}
              disabled={loading}
              title={t("Refresh")}
            >
              <RefreshCcw className="size-4" />
            </Button>
          </div>

          {/* Show (items per page) like Shipments */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              {t("Show")}
            </label>
            <Select
              value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
              onChange={(opt) => {
                setItemsPerPage(Number(opt.value));
                setCurrentPage(1);
              }}
              options={pageSizeOptions}
              className="w-20 text-sm"
              isSearchable={false}
            />
          </div>
        </div>
      </div>

      <div className="shadow-md p-4 mt-4 rounded-lg">
        {loading ? (
          <Loader />
        ) : shelves.length === 0 ? (
          <NoRecordFound message={t("No shelves found")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead isFixed>
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={toggleSelectAll}
                      className="h-4 w-4"
                      aria-label="Select all shelves"
                    />
                    <span className="ml-2">{t("Location")}</span>
                  </div>
                </TableHead>
                <TableHead isFixed>{t("Barcode")}</TableHead>
                <TableHead>{t("Category")}</TableHead>
                <TableHead>{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shelves.map((shelf) => (
                <TableRow key={shelf.id}>
                  <TableCell isFixed hasCheckbox className="font-medium !p-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedRows.has(shelf.id)}
                        onCheckedChange={() => toggleRowSelection(shelf.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4"
                        aria-label={`Select shelf ${shelf.id}`}
                      />
                      <span>{shelf.location}</span>
                    </div>
                  </TableCell>

                  <TableCell isFixed>
                    <div className="flex items-center justify-center gap-x-2">
                      <button
                        onClick={() => handleCopyBarcode(shelf.barcode)}
                        className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                        aria-label="Copy barcode"
                      >
                        {copiedBarcode === shelf.barcode ? (
                          <Check size={18} className="text-green-500" />
                        ) : (
                          <Copy size={18} />
                        )}
                      </button>
                      {shelf.barcode}
                    </div>
                  </TableCell>

                  <TableCell>{shelf?.category?.name}</TableCell>

                  <TableCell>
                    <div className="flex justify-center gap-x-2">
                      <Button
                        variant="print"
                        onClick={() => handlePrint(shelf)}
                        disabled={isPrinting[shelf.id]}
                      >
                        {isPrinting[shelf.id] ? (
                          <LucideLoader className="h-4 w-4 animate-spin inline-block" />
                        ) : (
                          <PrinterIcon />
                        )}
                      </Button>

                      {deleteAbility && (
                        <Button
                          variant="delete"
                          onClick={() => openDeleteAlert([shelf.id])}
                        >
                          <Trash />
                        </Button>
                      )}

                      {accessAbility && (
                        <Link to={`shipments/${shelf.barcode}`}>
                          <Button variant="show">
                            <EyeIcon />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-4">
          <Pagination
            links={links}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>

        {deleteAlert && (
          <DeleteAlert
            open={deleteAlert}
            onClose={closeDeleteAlert}
            record={
              Array.isArray(selectedRecord) ? selectedRecord : selectedRecord
            }
            api={"shelves/delete"}
            multiple={Array.isArray(selectedRecord)}
            onSubmitSuccess={() => {
              // بعد الحذف: شيل العناصر من السِلكشن وجدّد الجدول
              if (Array.isArray(selectedRecord)) {
                setSelectedRows((prev) => {
                  const s = new Set(prev);
                  selectedRecord.forEach((id) => s.delete(id));
                  return s;
                });
              }
              fetchShelves(currentPage, itemsPerPage);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ShelfIndex;
