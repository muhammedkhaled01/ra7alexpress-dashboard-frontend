import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { can, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import Search from "@/components/misc/Search";
import { MoreHorizontal, CheckCircle, XCircle, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import CreateTransfer from "./Create";
const TransfersIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Inter Branch Transfer access");
  const approveAbility = can("Inter Branch Transfer approve");
  const rejectAbility = can("Inter Branch Transfer reject");
  const exportAbility = can("Inter Branch Transfer export");

  useEffect(() => {
    if (!accessAbility) navigate("unauthorized");
    fetchList(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchList = async (pageNumber) => {
    setLoading(true);
    try {
      const { data } = await axiosMerchant.get(
        `inter-branch-transfers?page=${pageNumber}`
      );
      // sendResponse عندك بترجع data.data.links و data.data.data
      setLinks(data?.data?.links || []);
      setItems(data?.data?.data || data?.data || []);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setRefreshBtn(true);
    try {
      const { data } = await axiosMerchant.get(
        `inter-branch-transfers?query=${encodeURIComponent(search)}`
      );
      // البحث بيرجع Array بدون pagination
      setItems(data?.data || []);
      setLinks([]);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    fetchList(currentPage);
  };

  const approve = async (row) => {
    const comment = prompt(t("Approval comment (optional)")) || "";
    try {
      setLoading(true);
      await axiosMerchant.post(`inter-branch-transfers/approve/${row.id}`, {
        comment,
      });
      fetchList(currentPage);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const reject = async (row) => {
    const comment = prompt(t("Rejection reason (required)")) || "";
    if (!comment.trim()) return;
    try {
      setLoading(true);
      await axiosMerchant.post(`inter-branch-transfers/reject/${row.id}`, {
        comment,
      });
      fetchList(currentPage);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    try {
      setLoading(true);
      const res = await axiosMerchant.post(
        `inter-branch-transfers/export`,
        { query: search },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `transfers_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageTitle title={t("Transfers")} />

      <div className="flex flex-col md:flex-row gap-3 justify-between mt-2">
        <div className="flex gap-2">
          {exportAbility && (
            <Button variant="outline" onClick={exportCsv}>
              {t("Export CSV")}
            </Button>
          )}
          {/* <CreateTransfer onSubmitSuccess={() => fetchList(currentPage)} /> */}
        </div>

        <Search
          searchValue={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          onSearchSubmit={handleSearch}
          onRefresh={handleRefresh}
          showRefresh={refreshBtn}
          placeholder={t("Search Transfers...")}
        />
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>{t("Date")}</TableHead>
              <TableHead>{t("Transfer Code")}</TableHead>
              <TableHead>{t("From Warehouse")}</TableHead>
              <TableHead>{t("To Warehouse")}</TableHead>
              <TableHead>{t("Amount")}</TableHead>
              <TableHead>{t("Shipments Count")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
              <TableHead>{t("Created By")}</TableHead>
              <TableHead>{t("Approved By")}</TableHead>
              <TableHead className="text-right">{t("Actions")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : items && items.length > 0 ? (
              items.map((row, idx) => (
                <TableRow key={row.id}>
                  <TableHead>{(currentPage - 1) * 8 + (idx + 1)}</TableHead>
                  <TableCell>
                    {row.date ? new Date(row.date).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell className="font-medium">{row.code}</TableCell>
                  <TableCell>{row.from?.name || ""}</TableCell>
                  <TableCell>{row.to?.name || ""}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>{row.shipments_count}</TableCell>
                  <TableCell className="capitalize">{row.status}</TableCell>
                  <TableCell>{row.created_by?.name || "-"}</TableCell>
                  <TableCell>{row.approved_by?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="h-10 w-10 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => navigate(`/transfers/${row.id}`)}
                        >
                          <Eye className="p-1" /> {t("View")}
                        </DropdownMenuItem>
                        {approveAbility && row.status === "pending" && (
                          <DropdownMenuItem onClick={() => approve(row)}>
                            <CheckCircle className="p-1" /> {t("Approve")}
                          </DropdownMenuItem>
                        )}
                        {rejectAbility && row.status === "pending" && (
                          <DropdownMenuItem onClick={() => reject(row)}>
                            <XCircle className="p-1" /> {t("Reject")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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

        <Pagination
          links={links}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default TransfersIndex;