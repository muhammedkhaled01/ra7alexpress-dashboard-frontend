import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "@/axios";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { format } from "date-fns";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import Loader from "@/components/Loader";
import { StatBox } from "@/components/misc/StatBox";
import { DollarSign, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatCurrency, humanizeText, handleError, formatCurrentCurrency, formatDecimalValue } from "@/utils/helpers";
import { useLanguage } from "@/contexts/LanguageProvider";

export default function MerchantAccount() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { decimalPrecision, currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting);
  const user = useSelector(state => state.auth.user);

  // summary + table
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // filters
  const today = format(new Date(), "yyyy-MM-dd");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [type, setType] = useState("All"); // All | COD | Fee | Settlement
  const [search, setSearch] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  // --- Dialog state (NEW)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reqAmount, setReqAmount] = useState("");
  const [reqNotes, setReqNotes] = useState("");
  const [reqSaving, setReqSaving] = useState(false);

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/merchant/account", {
        params: { from, to, type, search, page, per_page: perPage },
      });
      const payload = data?.data || {};
      setSummary(
        payload.summary || {
          total_cod: 0,
          total_fees: 0,
          total_settlements: 0,
          current_balance: 0,
        }
      );

      let tx = payload.data || [];
      let meta = { current_page: 1, last_page: 1, total: tx?.length || 0 };
      if (payload.links && payload.links.length) {
        meta = {
          current_page: payload.current_page || page,
          last_page: payload.last_page || 1,
          total: payload.total ?? (payload.data?.length || 0),
        };
      }
      setRows(Array.isArray(tx) ? tx : []);
      setPagination({
        currentPage: meta.current_page,
        lastPage: meta.last_page,
        total: meta.total,
      });

      // اقتراح قيمة افتراضية للشحنة من الرصيد الحالي (>= 0)
      const cb = Number(payload?.summary?.current_balance || 0);
      if (cb > 0 && !reqAmount) {
        setReqAmount(formatDecimalValue(cb,decimalPrecision));
      }
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [from, to, type, search, page, perPage, decimalPrecision, reqAmount]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const formattedRows = useMemo(() => {
    return (rows || []).map((r, i) => ({
      ...r,
      amount: parseFloat(r.amount ?? 0),
      date: r.date ? format(new Date(r.date), "yyyy-MM-dd") : "-",
      _k: `${r.reference}-${i}`,
    }));
  }, [rows]);

  const onApply = () => {
    setPage(1);
    fetchAccount();
  };

  const onReset = () => {
    const d = format(new Date(), "yyyy-MM-dd");
    setFrom(d);
    setTo(d);
    setType("All");
    setSearch("");
    setPage(1);
    fetchAccount();
  };
  const isImageUrl = (s) =>
    /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(String(s || ""));
  const isPdfUrl = (s) => /\.pdf(\?.*)?$/i.test(String(s || ""));
  // --- Open dialog & prefill (NEW)
  const openSettlementDialog = () => {
    const cb = Math.max(0, Number(summary?.current_balance || 0));
    if (!reqAmount && cb > 0) {
      setReqAmount(formatDecimalValue(cb,decimalPrecision));
    }
    setDialogOpen(true);
  };

  // --- Submit request (returns boolean) (NEW)
  const submitRequest = async () => {
    const amt = parseFloat(reqAmount);
    const available = Math.max(0, Number(summary?.current_balance || 0));

    if (!amt || amt <= 0) {
      toast.error(t("Enter a valid amount"));
      return false;
    }
    if (amt > available) {
      toast.error(t("Amount exceeds available balance"));
      return false;
    }

    setReqSaving(true);
    try {
      const res = await axios.post("/merchant/account/settlement-requests", {
        amount: amt,
        notes: reqNotes?.trim() || null,
        sender_id: user?.id,
        sender_name: user?.name
      });
      if (res?.data?.success === false) {
        toast.error(res?.data?.message || t("Failed to submit request"));
        return false;
      }
      toast.success(res?.data?.message || t("Request submitted"));
      // refresh KPIs/table
      fetchAccount();
      // reset fields (optional)
      setReqNotes("");
      return true;
    } catch (e) {
      handleError(e);
      return false;
    } finally {
      setReqSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* KPIs + top action button */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox
              label={t("Total COD Collected")}
              value={formatCurrency(summary?.total_cod || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <StatBox
              label={t("Total Fees")}
              value={formatCurrency(-(summary?.total_fees || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName))}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <StatBox
              label={t("Total Settlements")}
              value={formatCurrency(-(summary?.total_settlements || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName))}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <StatBox
              label={t("Current Balance")}
              value={formatCurrency(summary?.current_balance || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
              icon={<DollarSign className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>
      <CardHeader className="flex items-end justify-between">
        <Button onClick={openSettlementDialog} className="min-w-[180px]">
          <DollarSign className="w-4 h-4 mr-2" />
          {t("Request Settlement")}
        </Button>
      </CardHeader>

      {/* Dialog: Request Settlement (NEW) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{t("Request Settlement")}</DialogTitle>
            <DialogDescription>
              {t(
                "This will create a settlement request ticket for accounting to review."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm">{t("Amount")}</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={reqAmount}
                onChange={(e) => setReqAmount(e.target.value)}
                placeholder="500.00"
              />
              <p
                className={`text-xs ${
                  Number(summary?.current_balance || 0) < 0
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
                value={reqNotes}
                onChange={(e) => setReqNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button
              onClick={async () => {
                const ok = await submitRequest();
                if (ok) setDialogOpen(false);
              }}
              disabled={
                reqSaving ||
                !reqAmount ||
                parseFloat(reqAmount) <= 0 ||
                parseFloat(reqAmount) >
                  Math.max(0, Number(summary?.current_balance || 0))
              }
            >
              {reqSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("Send Request")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters + Table (بدون تغيير كبير) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("Transactions")}</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="min-w-[160px]">
                <SelectValue placeholder={t("Type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{t("All")}</SelectItem>
                <SelectItem value="COD">{t("COD")}</SelectItem>
                <SelectItem value="Fee">{t("Fee")}</SelectItem>
                <SelectItem value="Settlement">{t("Settlement")}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="min-w-[200px]"
              placeholder={t("Search by reference/description")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="secondary" onClick={onApply}>
              {t("Apply")}
            </Button>
            <Button variant="ghost" onClick={onReset}>
              {t("Reset")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Date")}</TableHead>
                  <TableHead>{t("Reference")}</TableHead>
                  <TableHead>{t("Type")}</TableHead>
                  <TableHead>{t("Description")}</TableHead>
                  <TableHead>{t("Receipt")}</TableHead>
                  <TableHead className="text-right">
                    {t(`Amount`)} ({formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)})
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : formattedRows.length ? (
                  formattedRows.map((r) => (
                    <TableRow key={r._k}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>{r.reference || "-"}</TableCell>
                      <TableCell>
                        <Badge>{humanizeText(r.type)}</Badge>
                      </TableCell>
                      <TableCell>{r.description || "-"}</TableCell>
                      <TableCell>
                        {r.type === "Settlement" && r.receipt_url ? (
                          isImageUrl(r.receipt_url) ? (
                            <a
                              href={r.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={r.receipt_url}
                                alt="Receipt"
                                className="h-10 w-auto rounded border"
                              />
                            </a>
                          ) : (
                            <a
                              href={r.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline text-blue-600"
                            >
                              {t("View file")}
                            </a>
                          )
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          r.amount < 0 ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {r.amount > 0 ? "+" : ""}
                        {formatCurrency(r.amount || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      {t("No transactions found")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {t("Total")}: {pagination.total}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(perPage)}
                onValueChange={(v) => {
                  setPerPage(parseInt(v, 10));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="20 / page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                disabled={pagination.currentPage <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("Prev")}
              </Button>
              <div className="px-2 text-sm">
                {pagination.currentPage} / {pagination.lastPage}
              </div>
              <Button
                variant="secondary"
                disabled={
                  pagination.currentPage >= pagination.lastPage || loading
                }
                onClick={() =>
                  setPage((p) => Math.min(pagination.lastPage, p + 1))
                }
              >
                {t("Next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
