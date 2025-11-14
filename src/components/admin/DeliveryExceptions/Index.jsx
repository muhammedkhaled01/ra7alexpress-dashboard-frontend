import axiosMerchant from "@/axios";
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

import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Download,
  EditIcon,
  Pencil,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import Select from "@/components/misc/Select";
import Edit from "./Edit";
import Create from "./Create";
import { can, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import ExportDialog from "@/components/misc/ExportDialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const DeliveryExceptionIndex = () => {
  const [loading, setLoading] = useState(true);
  const [exceptions, setExceptions] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    links: [],
  });

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Delivery Exception access");
  const createAbility = can("Delivery Exception create");
  const updateAbility = can("Delivery Exception update");
  const deleteAbility = can("Delivery Exception delete");

  const flowOptions = [
    "Resend -> Move to Zone -> Repeat max 3 times -> Shelf -> Notify Customer (Chat + Notification)",
    "Shelf -> Notification 1 day before delivery -> Pick Task -> Zone",
    "Transfer to Supervisor -> Address Correction -> Return to Normal Path",
    "CRM tries to contact customer / merchant -> If updated -> Reschedule -> Dispatch -> If failed after 2-3 attempts -> Shelf -> RTO",
    "CRM can either reschedule (Shelf) or start RTO directly",
    "Temporary Hold -> Reschedule within the same day -> Dispatch",
    "Show Delivery Date and Zone Number in Sorter App",
  ];

  const finalStatusOptions = [
    "Delivered / RTO",
    "RTO or Shelf with New Date",
    "Shelf / RTO",
    "Delivered / RTO",
    "Shelf / RTO",
  ];

  const notificationOptions = [
    "Internal Notification",
    "CRM + Customer Notification",
    "CRM Follow-up",
    "Internal Notification (CRM + Supervisor)",
    "System Alert + Internal Notification",
  ];

  const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const getRandomAttemptCount = () => Math.floor(Math.random() * 5) + 1;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`delivery_exceptions`, {
        params: {
          page: currentPage,
          per_page: itemsPerPage,
          query: search || undefined,
        },
      });

      const { data, pagination } = response.data.data;

      const staticExceptions = data.static.map((exception) => ({
        ...exception,
        type: "Static",
      }));

      const systemExceptions = data.system.map((exception) => ({
        ...exception,
        type: "System",
      }));

      const combinedExceptions = [...systemExceptions, ...staticExceptions];
      setExceptions(combinedExceptions);

      const totalItems = pagination.static_total + pagination.system_total;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      setPagination({
        current_page: pagination.current_page,
        last_page: totalPages,
        per_page: itemsPerPage,
        total: totalItems,
        links: generatePaginationLinks(pagination.current_page, totalPages),
      });
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, search]);

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    fetchData();
  }, [accessAbility, navigate, fetchData]);

  const handleSearch = useCallback(
    (e) => {
      if (e) e.preventDefault();
      if (search.trim() === "") return;
      setLoading(true);
      setRefreshBtn(true);
      fetchData();
    },
    [search, fetchData]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      search.trim() !== "" ? setRefreshBtn(true) : setRefreshBtn(false);
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [search, handleSearch]);

  const handleRefresh = () => {
    setRefreshBtn(false);
    fetchData();
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generatePaginationLinks = (currentPage, lastPage) => {
    const links = [];
    const maxVisiblePages = 5;
    let startPage, endPage;

    if (lastPage <= maxVisiblePages) {
      startPage = 1;
      endPage = lastPage;
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
      const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;

      if (currentPage <= maxPagesBeforeCurrent) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (currentPage + maxPagesAfterCurrent >= lastPage) {
        startPage = lastPage - maxVisiblePages + 1;
        endPage = lastPage;
      } else {
        startPage = currentPage - maxPagesBeforeCurrent;
        endPage = currentPage + maxPagesAfterCurrent;
      }
    }

    if (startPage > 1) {
      links.push({ url: null, label: "1", active: false, page: 1 });
      if (startPage > 2) {
        links.push({ url: null, label: "...", active: false, disabled: true });
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      links.push({
        url: null,
        label: i.toString(),
        active: i === currentPage,
        page: i,
      });
    }

    if (endPage < lastPage) {
      if (endPage < lastPage - 1) {
        links.push({ url: null, label: "...", active: false, disabled: true });
      }
      links.push({
        url: null,
        label: lastPage.toString(),
        active: false,
        page: lastPage,
      });
    }

    const prevPage = currentPage > 1 ? currentPage - 1 : 1;
    const nextPage = currentPage < lastPage ? currentPage + 1 : lastPage;

    return [
      {
        url: null,
        label: "&laquo; Previous",
        active: false,
        page: prevPage,
        disabled: currentPage === 1,
      },
      ...links,
      {
        url: null,
        label: "Next &raquo;",
        active: false,
        page: nextPage,
        disabled: currentPage === lastPage,
      },
    ];
  };

  const handleItemsPerPageChange = (selectedOption) => {
    const newItemsPerPage = Number(selectedOption.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const openDeleteAlert = (record) => {
    setselectedRecord(record);
    setDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  const openEditDialog = (record) => {
    setselectedRecord(record);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setselectedRecord(null);
    setEditDialogOpen(false);
  };

  const handleSubmitSuccess = () => {
    fetchData();
  };

  const normalizeExceptionKey = (name) => {
    if (!name) return "";
    // لو جاية من الـ static كـ "Wrong Number" هنطبعها لـ "WRONG_NUMBER"
    return String(name)
      .trim()
      .replace(/\s+/g, "_")
      .replace(/-+/g, "_")
      .toUpperCase();
  };

  // خليها إعداد سهل التغيير (لو عايز من API بعدين بدّلها):
  const exceptionMaxAttemptsMap = {
    WRONG_NUMBER: 3,
    NO_ANSWER: 3,
  };

  const getMaxAttempts = (name) => {
    const key = normalizeExceptionKey(name);
    return exceptionMaxAttemptsMap[key] ?? ""; // فاضي لكل الأنواع الأخرى
  };
  return (
    <div>
      <PageTitle title={t("Delivery Exceptions")} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mt-2">
        <div className="flex flex-wrap gap-3">
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>
        <form
          className="flex flex-col md:flex-row gap-2 w-full md:w-auto"
          onSubmit={handleSearch}
        >
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-[200px]"
              value={search}
              placeholder={t("Search Delivery Exceptions...")}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                refreshBtn && (
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
                { value: 5, label: "5" },
                { value: 10, label: "10" },
                { value: 15, label: "15" },
                { value: 25, label: "25" },
                { value: 50, label: "50" },
                { value: 100, label: "100" },
              ]}
              className="w-20 text-sm"
              isSearchable={false}
            />
          </div>
        </form>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead isFixed>{t("Type")}</TableHead>
              <TableHead>{t("Name")}</TableHead>
              <TableHead>{t("Description")}</TableHead>
              <TableHead>{t("Proof Required")}</TableHead>
              <TableHead>{t("Move to CRM")}</TableHead>
              <TableHead>{t("Next Action / Flow")}</TableHead>
              <TableHead>{t("Max Attempts")}</TableHead>
              <TableHead>{t("Final Status")}</TableHead>
              <TableHead>{t("Notifications")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : exceptions && exceptions.length > 0 ? (
              exceptions.map((exception, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell isFixed>
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        exception.type === "System"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {t(exception.type)}
                    </span>
                  </TableCell>
                  <TableCell>{t(exception.name)}</TableCell>
                  <TableCell>{t(exception.description)}</TableCell>
                  <TableCell>
                    <span
                      style={{
                        color: exception.proof_required ? "green" : "red",
                      }}
                    >
                      ✅
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      style={{ color: exception.move_to_crm ? "green" : "red" }}
                    >
                      {exception.move_to_crm ? <>✅</> : <>✗</>}
                    </span>
                  </TableCell>
                  <TableCell>{t(getRandomElement(flowOptions))}</TableCell>
                  <TableCell>{getMaxAttempts(exception.name)}</TableCell>
                  <TableCell>
                    {t(getRandomElement(finalStatusOptions))}
                  </TableCell>
                  <TableCell>
                    {t(getRandomElement(notificationOptions))}
                  </TableCell>
                  <TableCell>
                    {exception.type !== "Static" && (
                      <div className="flex justify-center gap-x-2">
                        {updateAbility && (
                          <Button
                            onClick={() => openEditDialog(exception)}
                            variant="edit"
                            size="xs"
                            disabled={exception.type === "Static"}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {deleteAbility && (
                          <Button
                            onClick={() => openDeleteAlert(exception)}
                            variant="delete"
                            size="xs"
                            disabled={exception.type === "Static"}
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
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
        {pagination.total > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, pagination.total)} of{" "}
                {pagination.total} entries
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        currentPage > 1 && handlePageChange(currentPage - 1)
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {pagination.current_page > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {Array.from(
                    { length: Math.min(5, pagination.last_page) },
                    (_, i) => {
                      let pageNum;
                      if (pagination.last_page <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.current_page <= 3) {
                        pageNum = i + 1;
                      } else if (
                        pagination.current_page >=
                        pagination.last_page - 2
                      ) {
                        pageNum = pagination.last_page - 4 + i;
                      } else {
                        pageNum = pagination.current_page - 2 + i;
                      }

                      return pageNum > 0 && pageNum <= pagination.last_page ? (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={pageNum === pagination.current_page}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      ) : null;
                    }
                  )}

                  {pagination.current_page < pagination.last_page - 2 &&
                    pagination.last_page > 5 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        currentPage < pagination.last_page &&
                        handlePageChange(currentPage + 1)
                      }
                      className={
                        currentPage === pagination.last_page
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}

        {deleteAlert && (
          <DeleteAlert
            onSubmitSuccess={handleSubmitSuccess}
            record={selectedRecord}
            onClose={closeDeleteAlert}
            api={"delivery_exceptions/delete"}
          />
        )}
        {editDialogOpen && (
          <Edit
            onSubmitSuccess={handleSubmitSuccess}
            record={selectedRecord}
            onClose={closeEditDialog}
          />
        )}

        {showExport && (
          <ExportDialog
            model="delivery_exceptions"
            endpoint="delivery_exceptions/export"
            fields={[
              { key: "id", label: "ID" },
              { key: "name", label: "Name" },
              { key: "description", label: "Description" },
              { key: "action", label: "Action" },
              { key: "move_to_crm", label: "Move to CRM" },
              { key: "proof_required", label: "Proof Required" },
              { key: "next_action_flow", label: "Next Action / Flow" },
              { key: "attempt_count", label: "Attempt Count" },
              { key: "final_status", label: "Final Status" },
              { key: "notifications", label: "Notifications" },
              { key: "created_at", label: "Created At" },
              { key: "updated_at", label: "Updated At" },
            ]}
            onClose={() => setShowExport(false)}
          />
        )}
      </div>
    </div>
  );
};

export default DeliveryExceptionIndex;
