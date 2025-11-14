import React, { useEffect, useState, useCallback } from "react";
import axiosMerchant from "@/axios";
import { useNavigate } from "react-router-dom";

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
import { Button } from "@/components/ui/button";
import Select from "@/components/misc/Select";
import { Input } from "@/components/ui/input";
import { RefreshCcw, Check, X } from "lucide-react";
import { can } from "@/utils/helpers";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import moment from "moment";
import { DateTimeRangePicker } from "@/components/misc/DateTimeRangePicker";

function AddressUpdates() {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const [statusValue, setStatusValue] = useState(null);
  const [btnLoading, setBtnLoading] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [comments, setComments] = useState("");

  const today = moment().format("YYYY-MM-DD");
  const [filters, setFilters] = useState({
    status: "", // "", "pending", "approved", "rejected"
    from: today,
    to: today,
    from_time: "00:00",
    to_time: "23:59",
    search: "",
  });

  const { t } = useTranslation();
  const navigate = useNavigate();
  const canAccess = can("Quality Check access");
  const canApprove = can("Shipment update");
  const canReject = can("Shipment update");
  if (!canAccess) return navigate("/unauthorized");

  const statusOptions = [
    { label: t("All"), value: "" },
    { label: t("Pending"), value: "pending" },
    { label: t("Approved"), value: "approved" },
    { label: t("Rejected"), value: "rejected" },
  ];

  // Helpers
  const getStatusBadge = (rev) => {
    if (rev?.rejected)
      return <Badge variant="destructive">{t("Rejected")}</Badge>;
    if (rev?.approved) return <Badge variant="success">{t("Approved")}</Badge>;
    return <Badge variant="warning">{t("Pending")}</Badge>;
  };

  const formatPhone = (c) => {
    if (!c) return "";
    const key = c.country_key_cellphone
      ? `+${String(c.country_key_cellphone).replace(/^\+/, "")}`
      : "";
    const num = c.cellphone || "";
    return `${key}${num}`;
  };

  const renderAddress = (addr) => {
    if (!addr) return <span className="text-gray-400">{t("N/A")}</span>;
    const line1 = addr.streetAddress || t("N/A");
    const line2 = [
      addr.place?.en_name,
      addr.city?.name,
      addr.state?.en_name,
      addr.governorate?.en_name,
      addr.country?.name,
    ]
      .filter(Boolean)
      .join(", ");
    return (
      <div className="max-w-xs">
        <div className="text-sm">{line1}</div>
        <div className="text-xs text-gray-500">{line2}</div>
      </div>
    );
  };

  // Fetch
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        per_page: itemsPerPage,
        from: `${filters.from} ${filters.from_time}`,
        to: `${filters.to} ${filters.to_time}`,
      });
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);

      // NOTE: API returns sendResponse(...) directly (Laravel Resource Pagination)
      const res = await axiosMerchant.get(`address-updates?${params.toString()}`);

      // شكل الاستجابة المتوقع من sendResponse:
      // {
      //   message: "...",
      //   data: {
      //     current_page, data: [...], last_page, links: [...], total, ...
      //   },
      //   success: true
      // }
      const payload = res?.data?.data; // دا هو الـ paginator
      const list = payload?.data ?? []; // الصفوف
      const navLinks = payload?.links ?? [];
      const totalCount = payload?.total ?? 0;

      setRows(list);
      setLinks(navLinks);
      setTotal(totalCount);
    } catch (e) {
      console.error(e);
      toast.error(t("Failed to fetch address updates"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (p) => setCurrentPage(p);

  const handleApprove = async (rev) => {
    if (!rev) return;
    setBtnLoading(true);
    try {
      await axiosMerchant.post(`address-updates/${rev.id}/approve`, {
        comments,
        // shipment_id لم يعد مطلوبًا، الـrevision مرتبط بالأوردر
      });
      toast.success(t("Address update approved successfully"));
      setShowApprovalDialog(false);
      setSelectedUpdate(null);
      setComments("");
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error(t("Failed to approve address update"));
    } finally {
      setBtnLoading(false);
    }
  };

  const handleReject = async (rev) => {
    if (!rev) return;
    if (!comments.trim()) {
      toast.error(t("Comments are required for rejection"));
      return;
    }
    setBtnLoading(true);
    try {
      await axiosMerchant.post(`address-updates/${rev.id}/reject`, { comments });
      toast.success(t("Address update rejected successfully"));
      setShowRejectionDialog(false);
      setSelectedUpdate(null);
      setComments("");
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error(t("Failed to reject address update"));
    } finally {
      setBtnLoading(false);
    }
  };

  const handleRefresh = async () => {
    setCurrentPage(1);
    setFilters({
      status: "",
      from: today,
      to: today,
      from_time: "00:00",
      to_time: "23:59",
      search: "",
    });
    setStatusValue({ label: t("All"), value: "" });
    await fetchData();
  };

  const handleDateRangeChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {t("Address Updates")} {total ? `- ${total}` : ``}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button type="button" variant="refresh" onClick={handleRefresh}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4 mt-3">
            <div className="w-[260px]">
              <label>{t("Search")}</label>
              <Input
                name="search"
                placeholder={t("Search by tracking, name, phone")}
                value={filters.search}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, search: e.target.value }))
                }
              />
            </div>

            <div className="w-[200px]">
              <label>{t("Status")}</label>
              <Select
                name="status"
                placeholder={t("Status")}
                options={statusOptions}
                value={statusValue}
                onChange={(opt) => {
                  setStatusValue(opt);
                  setFilters((p) => ({ ...p, status: opt?.value ?? "" }));
                }}
              />
            </div>

            <div className="w-[320px]">
              <label>{t("Date")}</label>
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
                options={[5, 10, 15, 25, 50, 100].map((v) => ({
                  value: v,
                  label: String(v),
                }))}
                className="w-20 text-sm"
                isSearchable={false}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead isFixed>{t("Tracking No")}</TableHead>
                  <TableHead>{t("Customer")}</TableHead>
                  <TableHead>{t("Current Address")}</TableHead>
                  <TableHead>{t("Requested Address")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Requested Date")}</TableHead>
                  <TableHead>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : rows?.length ? (
                  rows.map((rev, idx) => {
                    const tracking = rev?.shipment?.tracking_no || t("N/A");

                    const customer =
                      rev?.shipment?.consignee ??
                      rev?.new_address?.consignee ??
                      rev?.old_address?.consignee ??
                      null;

                    const customerName = customer?.name || t("N/A");
                    const customerPhone = customer
                      ? `${
                          customer?.country_key_cellphone
                            ? `+${String(
                                customer.country_key_cellphone
                              ).replace(/^\+/, "")}`
                            : ""
                        }${customer?.cellphone ?? ""}`
                      : "";

                    const currentAddress =
                      rev?.shipment?.delivery_address ?? rev?.old_address ?? null;

                    const requestedAddress = rev?.new_address ?? null;

                    return (
                      <TableRow key={rev.id ?? idx}>
                        <TableCell className="font-medium">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </TableCell>

                        <TableCell isFixed className="font-medium">
                          {tracking}
                        </TableCell>

                        <TableCell>
                          <div>
                            <div className="font-medium">{customerName}</div>
                            <div className="text-sm text-gray-500">
                              {customerPhone}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>{renderAddress(currentAddress)}</TableCell>
                        <TableCell>{renderAddress(requestedAddress)}</TableCell>
                        <TableCell>{getStatusBadge(rev)}</TableCell>

                        <TableCell>
                          {rev?.created_at
                            ? new Date(rev.created_at).toLocaleDateString()
                            : "-"}
                        </TableCell>

                        <TableCell className="space-x-2">
                          {!rev?.approved && !rev?.rejected && (
                            <>
                              {canApprove && (
                              <Dialog
                                open={
                                  showApprovalDialog &&
                                  selectedUpdate?.id === rev.id
                                }
                                onOpenChange={setShowApprovalDialog}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedUpdate(rev)}
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    {t("Approve")}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      {t("Approve Address Update")}
                                    </DialogTitle>
                                    <DialogDescription>
                                      {t(
                                        "Are you sure you want to approve this address update?"
                                      )}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">
                                        {t("Comments (Optional)")}
                                      </label>
                                      <Textarea
                                        value={comments}
                                        onChange={(e) =>
                                          setComments(e.target.value)
                                        }
                                        placeholder={t("Add any comments...")}
                                        rows={3}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setShowApprovalDialog(false);
                                        setComments("");
                                      }}
                                    >
                                      {t("Cancel")}
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleApprove(selectedUpdate)
                                      }
                                      disabled={btnLoading}
                                    >
                                      {btnLoading
                                        ? t("Approving...")
                                        : t("Approve")}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              )}
                              {canReject && (
                              <Dialog
                                open={
                                  showRejectionDialog &&
                                  selectedUpdate?.id === rev.id
                                }
                                onOpenChange={setShowRejectionDialog}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setSelectedUpdate(rev)}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    {t("Reject")}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      {t("Reject Address Update")}
                                    </DialogTitle>
                                    <DialogDescription>
                                      {t(
                                        "Please provide a reason for rejecting this address update."
                                      )}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">
                                        {t("Rejection Reason")} *
                                      </label>
                                      <Textarea
                                        value={comments}
                                        onChange={(e) =>
                                          setComments(e.target.value)
                                        }
                                        placeholder={t(
                                          "Enter reason for rejection..."
                                        )}
                                        rows={3}
                                        required
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setShowRejectionDialog(false);
                                        setComments("");
                                      }}
                                    >
                                      {t("Cancel")}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() =>
                                        handleReject(selectedUpdate)
                                      }
                                      disabled={btnLoading || !comments.trim()}
                                    >
                                      {btnLoading
                                        ? t("Rejecting...")
                                        : t("Reject")}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              )}
                            </>
                          )}

                          {(rev?.approved || rev?.rejected) && rev?.reason && (
                            <div className="text-xs text-gray-500 mt-1">
                              <strong>{t("Comments")}:</strong> {rev.reason}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
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

export default AddressUpdates;
