import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosMerchant from "@/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import Loader from "@/components/Loader";
import { StatBox } from "@/components/misc/StatBox";
import { DollarSign, Loader2, RefreshCw, Sheet } from "lucide-react";

import {
  can,
  formatCurrency,
  formatCurrentCurrency,
  formatDecimalValue,
  handleError,
  humanizeText,
} from "@/utils/helpers";
import moment from "@/utils/moment.js";
import Select from "@/components/misc/Select.jsx";
import { DateTimeRangePicker } from "@/components/misc/DateTimeRangePicker.jsx";
import { Label } from "@/components/ui/label.jsx";
import { useLanguage } from "@/contexts/LanguageProvider";
import { useSelector } from "react-redux";

/**
 * Driver account page
 * API endpoints used (من المقترح اللي اتفقنا عليه):
 *  GET  /driver-accounts/:id?from=YYYY-MM-DD&to=YYYY-MM-DD
 *  POST /driver-accounts/:id/deposits  (FormData: amount, notes?, receipt?)
 *  GET  /driver-accounts/:id/export?from=...&to=...   (CSV)
 */
function DriverAccounts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { decimalPrecision, currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting);
  const params = useParams();
  const [type, setType] = useState("All");
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advAmount, setAdvAmount] = useState("");
  const [advVoucher, setAdvVoucher] = useState("");
  const [advNotes, setAdvNotes] = useState("");
  const [savingAdvance, setSavingAdvance] = useState(false);
  const canAdvance = can("Driver Advance create");
  const transactionTypeOptions = [
    { value: "All", label: t("All") },
    { value: "assignment", label: t("Assignment") },
    { value: "deposit", label: t("Deposit") },
    { value: "bonus_credit", label: t("Bonus credit") },
    { value: "advance", label: t("Advance") },
  ];
  // Permissions
  const canAccess = can("Account access");
  const canDeposit = can("Driver Deposit create");

  // Redirect if unauthorized
  if (!canAccess) {
    navigate("/unauthorized");
  }

  // Filters
  const today = moment().format("YYYY-MM-DD");
  const [from, setFrom] = useState(today);
  const [filters, setFilters] = useState({
    from: today,
    to: today,
    from_time: "00:00",
    to_time: "23:59",
    type: "All",
  });

  // Data States
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState(null);
  const [summary, setSummary] = useState({
    total_cod: 0,
    total_deposit: 0,
    total_bonus: 0,
    total_payouts: 0,
    total_advance: 0,
    current_balance: 0,
  });
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const perPageOptions = [10, 15, 25, 50, 100];

  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 15,
    last_page: 1,
    total: 0,
  });

  // Buttons
  const [exporting, setExporting] = useState(false);

  // Deposit Dialog
  const [depositOpen, setDepositOpen] = useState(false);
  const [depAmount, setDepAmount] = useState("");
  const [depNotes, setDepNotes] = useState("");
  const [depFile, setDepFile] = useState(null);
  const [savingDeposit, setSavingDeposit] = useState(false);
  // أعلى الملف مع باقي الstates
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payFile, setPayFile] = useState(null);
  const [savingPayout, setSavingPayout] = useState(false);

  const canPayout = can("Driver Payout create");

  // افتح الديالوج بمبلغ افتراضي = المستحق الموجب
  const openPayoutDialog = () => {
    const due = Math.max(0, Number(summary?.bonus_due || 0));
    if (due > 0) setPayAmount(String(formatDecimalValue(due, decimalPrecision)));
    setPayNotes("");
    setPayFile(null);
    setPayoutOpen(true);
  };
  const submitPayout = async () => {
    const num = parseFloat(payAmount);
    const due = Math.max(0, Number(summary?.bonus_due || 0));
    if (!num || num <= 0) return toast.error(t("Enter a valid amount"));
    if (num > due) return toast.error(t("Amount exceeds driver's bonus due"));
    if (!payFile) return toast.error(t("Receipt is required"));

    setSavingPayout(true);
    try {
      const form = new FormData();
      form.append("amount", num);
      if (payNotes?.trim()) form.append("notes", payNotes.trim());
      form.append("receipt", payFile);

      await axiosMerchant.post(`/driver-accounts/${params.id}/payouts`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(t("Payout recorded"));
      setPayoutOpen(false);
      setPayAmount("");
      setPayNotes("");
      setPayFile(null);
      fetchAccount();
    } catch (e) {
      handleError(e);
    } finally {
      setSavingPayout(false);
    }
  };
  const fetchAccount = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosMerchant.get(`/driver-accounts/${params.id}`, {
        params: {
          from: `${filters.from} ${filters.from_time}`,
          to: `${filters.to} ${filters.to_time}`,
          type,
          page,
          per_page: perPage,
        },
      });

      const res = data?.data || {};
      setDriver(res.driver || null);
      setSummary(res.summary || {});
      setRows(Array.isArray(res.transactions) ? res.transactions : []);
      if (res.pagination) setPagination(res.pagination);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [
    params.id,
    filters?.from,
    filters?.to,
    filters?.from_time,
    filters?.to_time,
    type,
    page,
    perPage,
  ]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const onFilter = () => {
    setPage(1);
    fetchAccount();
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const response = await axiosMerchant.get(
        `/driver-accounts/${params.id}/export`,
        {
          params: { from, to },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `driver_account_${params.id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t("File downloaded successfully"));
    } catch (e) {
      handleError(e);
    } finally {
      setExporting(false);
    }
  };

  const openDepositDialog = () => {
    const available = Number(summary?.current_balance || 0);
    if (available > 0) setDepAmount(String(formatDecimalValue(available, decimalPrecision)));
    setDepNotes("");
    setDepFile(null);
    setDepositOpen(true);
  };
  const openAdvanceDialog = () => {
    setAdvAmount("");
    setAdvVoucher("");
    setAdvNotes("");
    setAdvanceOpen(true);
  };

  const submitAdvance = async () => {
    const num = parseFloat(advAmount);
    if (!num || num <= 0) return toast.error(t("Enter a valid amount"));
    if (!/^\d{4}$/.test(advVoucher))
      return toast.error(t("Voucher number must be 4 digits"));

    setSavingAdvance(true);
    try {
      await axiosMerchant.post(`/driver-accounts/${params.id}/advances`, {
        amount: num,
        voucher_no: advVoucher,
        notes: advNotes || "",
      });
      toast.success(t("Advance recorded"));
      setAdvanceOpen(false);
      fetchAccount();
    } catch (e) {
      handleError(e);
    } finally {
      setSavingAdvance(false);
    }
  };

  const submitDeposit = async () => {
    const num = parseFloat(depAmount);
    if (!num || num <= 0) {
      toast.error(t("Enter a valid amount"));
      return;
    }
    if (num > Number(summary?.current_balance || 0)) {
      toast.error(t("Amount exceeds driver's balance"));
      return;
    }

    setSavingDeposit(true);
    try {
      const form = new FormData();
      form.append("amount", num);
      if (depNotes?.trim()) form.append("notes", depNotes.trim());
      if (depFile) form.append("receipt", depFile);

      await axiosMerchant.post(`/driver-accounts/${params.id}/deposits`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(t("Deposit recorded"));
      setDepositOpen(false);
      setDepAmount("");
      setDepNotes("");
      setDepFile(null);
      fetchAccount();
    } catch (e) {
      handleError(e);
    } finally {
      setSavingDeposit(false);
    }
  };

  // صيغة العرض بالموجب/السالب على حسب النوع
  const formattedRows = useMemo(() => {
    return (rows || []).map((r) => {
      const debitTypes = ["deposit", "payout"];
      const sign = debitTypes.includes(String(r.type)) ? -1 : 1;
      const amt = Number(r.amount || 0) * sign;
      return { ...r, __signedAmount: amt };
    });
  }, [rows]);
  // const formattedRows = useMemo(() => {
  //   return (rows || []).map((r) => {
  //     const debitTypes = ["deposit", "payout"]; // تظهر بسالب
  //     const sign = debitTypes.includes(String(r.type)) ? -1 : 1;
  //     const amt = Number(r.amount || 0) * sign;
  //     return {
  //       ...r,
  //       __signedAmount: amt,
  //     };
  //   });
  // }, [rows]);

  const handleRefresh = () => {
    setFilters((prev) => ({
      from: today,
      to: today,
      from_time: "00:00",
      to_time: "23:59",
    }));
    fetchAccount();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };
  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-start gap-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
              <div className={"flex items-center gap-2"}>
                <CardTitle className="text-2xl">
                  {t("Driver Account")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {driver?.name ? `#${driver?.id} — ${driver?.name}` : ""}
                </p>
              </div>
              <Button onClick={handleRefresh} variant="refresh">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <div className={"flex flex-col input-container"}>
                  <DateTimeRangePicker
                    filters={filters}
                    onChange={handleFilterChange}
                    t={t}
                  />
                </div>
                <div className={"w-[130%]"}>
                  <Select
                    value={
                      type
                        ? {
                          value: type,
                          label: transactionTypeOptions.find(
                            (opt) => opt.value === type
                          )?.label,
                        }
                        : null
                    }
                    onChange={(selected) => setType(selected?.value)}
                    options={transactionTypeOptions}
                    placeholder={t("transaction type")}
                    className="w-full mt-1"
                    isClearable
                  />
                </div>
                <Button variant="secondary" onClick={onFilter}>
                  {t("Filter")}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {/* {canDeposit && (
                  <Button onClick={openDepositDialog}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    {t("Add Deposit")}
                  </Button>
                )} */}
                <div className="flex items-center gap-2">
                  {/* {canDeposit && (
                    <Button onClick={openDepositDialog}>
                      <DollarSign className="w-4 h-4 mr-2" />
                      {t("Add Deposit")}
                    </Button>
                  )} */}
                  {canAdvance && (
                    <Button onClick={openAdvanceDialog} variant="destructive">
                      <DollarSign className="w-4 h-4 mr-2" />
                      {t("Advance request")}
                    </Button>
                  )}
                  {canPayout && (
                    <Button onClick={openPayoutDialog} variant="outline">
                      <DollarSign className="w-4 h-4 mr-2" />
                      {t("Settle Payout")}
                    </Button>
                  )}
                  <Button onClick={onExport} disabled={exporting}>
                    {exporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sheet className="w-4 h-4 mr-2" />
                        {t("Export")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatBox
              label={t("Total COD Collected")}
              value={formatCurrency(Number(summary?.total_cod || 0), language, decimalPrecision, currencyEnglishName, currencyArabicName)}
            />
            <StatBox
              label={t("Total Deposited")}
              value={formatCurrency(Number(summary?.total_deposit || 0), language, decimalPrecision, currencyEnglishName, currencyArabicName)}
            />
            <StatBox
              label={t("Total Bonuses Earned")}
              value={formatCurrency(Number(summary?.bonus_due || 0), language, decimalPrecision, currencyEnglishName, currencyArabicName)}
            />
            <StatBox
              label={t("Current Balance (COD Due)")}
              value={formatCurrency(Number(summary?.current_balance || 0), language, decimalPrecision, currencyEnglishName, currencyArabicName)}
            />
            <StatBox
              label={t("Total Advance")}
              value={formatCurrency(Number(summary?.total_advance || 0), language, decimalPrecision, currencyEnglishName, currencyArabicName)}
            />
          </div>

          {/* Transactions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Date")}</TableHead>
                  <TableHead>{t("Reference")}</TableHead>
                  <TableHead>{t("Type")}</TableHead>
                  <TableHead>{t("Description")}</TableHead>
                  <TableHead>{t("Receipt")}</TableHead> {/* جديد */}
                  <TableHead className="text-right">{t("Amount")}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : formattedRows.length > 0 ? (
                  formattedRows.map((row, idx) => {
                    const d = row.created_at ? new Date(row.created_at) : null;
                    const dateStr = d ? d.toLocaleDateString() : "-";
                    const timeStr = d
                      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "-";
                    return (
                      <TableRow key={idx}>
                        <TableCell>{`${dateStr} - ${timeStr}`}</TableCell>
                        <TableCell>{row.reference || "-"}</TableCell>
                        <TableCell>{humanizeText(row.type || "-")}</TableCell>
                        <TableCell>{row.description || "-"}</TableCell>
                        <TableCell>
                          {row.receipt_url ? (
                            <a
                              href={row.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline"
                            >
                              {t("View")}
                            </a>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              row.__signedAmount < 0
                                ? "text-rose-600 font-medium"
                                : "text-green-600 font-medium"
                            }
                          >
                            {row.__signedAmount < 0 ? "-" : "+"}
                            {formatCurrency(
                              Math.abs(Number(row.__signedAmount || 0)), language, decimalPrecision, currencyEnglishName, currencyArabicName
                            )}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      {t("No transactions found")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3">
            <div className="text-sm text-muted-foreground">
              {t("Showing")}{" "}
              <strong>
                {pagination.from || 0}-{pagination.to || 0}
              </strong>{" "}
              {t("of")} <strong>{pagination.total || 0}</strong>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">{t("Rows per page")}:</span>
              <select
                className="border rounded-md px-2 py-1 text-sm"
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
              >
                {perPageOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  {t("Previous")}
                </Button>
                <span className="text-sm">
                  {t("Page")} {pagination.current_page} {t("of")}{" "}
                  {pagination.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(pagination.last_page || 1, p + 1))
                  }
                  disabled={page >= (pagination.last_page || 1) || loading}
                >
                  {t("Next")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Deposit Dialog */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t("Add Deposit")}</DialogTitle>
            <DialogDescription>
              {t(
                "Record a cash deposit delivered by the driver to the facility."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm">{t(`Amount`)} ({formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)})</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={depAmount}
                onChange={(e) => setDepAmount(e.target.value)}
                placeholder="300.00"
              />
              <p
                className={`text-xs ${Number(summary?.current_balance || 0) < 0
                  ? "text-rose-600"
                  : "text-muted-foreground"
                  }`}
              >
                {t("Available")}:{" "}
                {formatCurrency(
                  Math.max(0, Number(summary?.current_balance || 0)), language, decimalPrecision, currencyEnglishName, currencyArabicName
                )}
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm">{t("Notes (optional)")}</label>
              <Textarea
                rows={3}
                value={depNotes}
                onChange={(e) => setDepNotes(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm">{t("Receipt (optional)")}</label>
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setDepFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setDepositOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button
              onClick={submitDeposit}
              disabled={
                savingDeposit ||
                !depAmount ||
                parseFloat(depAmount) <= 0 ||
                parseFloat(depAmount) >
                Math.max(0, Number(summary?.current_balance || 0))
              }
            >
              {savingDeposit ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("Save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t("Settle Payout")}</DialogTitle>
            <DialogDescription>
              {t(
                "Pay the driver's due balance and upload the payment receipt."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm">{t(`Amount`)} ({formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)})</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="150.00"
              />
              <p className="text-xs text-muted-foreground">
                {t("Due")}:{" "}
                {formatCurrency(Math.max(0, Number(summary?.bonus_due || 0)), language, decimalPrecision, currencyEnglishName, currencyArabicName)}
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm">{t("Notes (optional)")}</label>
              <Textarea
                rows={3}
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm">
                {t("Receipt")} <span className="text-rose-600">*</span>
              </label>
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setPayFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setPayoutOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button
              onClick={submitPayout}
              disabled={
                savingPayout ||
                !payAmount ||
                parseFloat(payAmount) <= 0 ||
                parseFloat(payAmount) >
                Math.max(0, Number(summary?.bonus_due || 0)) ||
                !payFile
              }
            >
              {savingPayout ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("Pay")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={advanceOpen} onOpenChange={setAdvanceOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t("Add operation")}</DialogTitle>
            <DialogDescription>
              {t("Create a cash advance for the driver")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* العملية: سلفة (read-only to match the design) */}
            <div className="grid gap-2">
              <label className="text-sm">{t("Operation type")}</label>
              <Input value={t("Advance")} readOnly />
            </div>

            <div className="grid gap-2">
              <label className="text-sm">{t(`Amount`)} ({formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)})</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={advAmount}
                onChange={(e) => setAdvAmount(e.target.value)}
                placeholder="150.000"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm">
                  {t("Voucher No.")} <span className="text-rose-600">*</span>
                </label>
                {/* you can keep a “Next” button later if you add sequences; for now no-op */}
              </div>
              <Input
                dir="ltr"
                maxLength={4}
                value={advVoucher}
                onChange={(e) =>
                  setAdvVoucher(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="0002"
              />
              <p className="text-xs text-muted-foreground">
                {t("Must be 4 digits")}
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm">{t("Notes")}</label>
              <Textarea
                rows={3}
                value={advNotes}
                onChange={(e) => setAdvNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setAdvanceOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button
              onClick={submitAdvance}
              disabled={
                savingAdvance || !advAmount || !/^\d{4}$/.test(advVoucher)
              }
            >
              {savingAdvance ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("Save operation")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DriverAccounts;
