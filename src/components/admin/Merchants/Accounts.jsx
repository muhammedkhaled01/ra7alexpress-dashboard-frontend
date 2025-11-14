import React, { useEffect, useMemo, useState } from "react";
import axiosMerchant from "@/axios";
import { useNavigate, useParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/Pagination";
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";

import { useTranslation } from "react-i18next";
import { DollarSign, Loader2, RefreshCw } from "lucide-react";
import {
  can,
  formatCurrency,
  formatCurrentCurrency,
  handleError,
  humanizeText,
} from "@/utils/helpers";
import { StatBox } from "@/components/misc/StatBox";
import { useDispatch, useSelector } from "react-redux";
import { getAccountables } from "@/stores/features/ajaxFeature";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import moment from "@/utils/moment.js";
import { useLanguage } from "@/contexts/LanguageProvider";

/* ---------- Create Settlement Button (admin only) ---------- */
/* ---------- Create Settlement Button (admin only) - JS (no TypeScript) ---------- */
function CreateSettlementBtn({ merchantId, onDone }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  // cleanup preview url
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onPickFile = (e) => {
    const file = (e.target.files && e.target.files[0]) || null;
    setReceiptFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (file && file.type && file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const resetForm = () => {
    setAmount("");
    setNotes("");
    setReceiptFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const save = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      alert(t("Enter a valid amount"));
      return;
    }
    if (!receiptFile) {
      alert(t("Receipt is required"));
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("amount", String(Number(amount)));
      if (notes && notes.trim()) fd.append("notes", notes.trim());
      fd.append("receipt", receiptFile);

      await axiosMerchant.post(
        // `merchant_accounts/${merchantId}/settlements`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setOpen(false);
      resetForm();
      if (onDone) onDone();
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>{saving ? t("Saving...") : t("Create Settlement")}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t("Create Settlement")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block mb-1">
              {t("Amount")} <span className="text-rose-600">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="800.00"
              required
            />
          </div>

          <div>
            <label className="block mb-1">
              {t("Notes")} ({t("optional")})
            </label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("Write any notes")}
            />
          </div>

          <div>
            <label className="block mb-1">
              {t("Receipt (Image/PDF)")}{" "}
              <span className="text-rose-600">*</span>
            </label>
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={onPickFile}
              required
            />
            {previewUrl ? (
              <div className="mt-2">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="max-h-48 rounded border"
                />
              </div>
            ) : receiptFile ? (
              <div className="mt-2 text-sm text-muted-foreground">
                {receiptFile.name}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("Save")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------ Main Page ------------------------ */
function MerchantAccounts() {
  const { id } = useParams();
  const { language } = useLanguage();
  const { decimalPrecision, currencyEnglishName, currencyArabicName } =
    useSelector((state) => state.setting);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

  // summary KPIs + table rows
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [links, setLinks] = useState([]);
  const [merchant, setMerchant] = useState(null); // لعرض الاسم إن توفر
  const currentBalance = useMemo(() => {
    const cod = Number(summary?.total_cod ?? 0);
    const fees = Number(summary?.total_fees ?? 0);
    return cod - fees;
  }, [summary]);
  // filters
  const today = moment().format("YYYY-MM-DD");
  const [filters, setFilters] = useState({
    from: today,
    to: today,
    from_time: "00:00",
    to_time: "23:59",
    type: "All",
  });
  const [from, setFrom] = useState(filters?.from + " " + filters?.from_time);
  const [to, setTo] = useState(filters?.to + " " + filters?.to_time);
  const [type, setType] = useState("All"); // COD | Fee | Settlement | All
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const accountables = useSelector((s) => s.ajax.accountables);

  useEffect(() => {
    if (!accountables) dispatch(getAccountables());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // لو عندك مصدر لاسم التاجر في الريدوكس، هاته (اختياري)
  const displayName = useMemo(() => {
    if (merchant?.name) return merchant.name;
    return merchant?.full_name || ""; // fallback لو API بيرجع شكل مختلف
  }, [merchant]);

  const canAccess = can("Account access");
  if (!canAccess) return navigate("/unauthorized");

  const fetchData = async () => {
    const fromDateTime = `${filters.from} ${filters.from_time}`;
    const toDateTime = `${filters.to} ${filters.to_time}`;
    setLoading(true);
    try {
      const { data } = await axiosMerchant.get(`merchant_accounts/${id}`, {
        params: {
          from: fromDateTime,
          to: toDateTime,
          type: type,
          search: search,
          page: currentPage,
        },
      });
      const payload = data?.data || {};
      setSummary(payload.summary || null);
      setRows(payload.data || []);
      setLinks(Array.isArray(payload.links) ? payload.links : []);
      setMerchant(payload.merchant || merchant);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const applyFilters = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const handleExport = async (fmt = "csv") => {
    setBtnLoading(true);
    try {
      const res = await axiosMerchant.post(
        `merchant_accounts/${id}/export`,
        { from, to, type, search, format: fmt },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `merchant_account_${id}.${fmt}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      handleError(e);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleRefresh = () => {
    setFilters((prev) => ({
      from: today,
      to: today,
      from_time: "00:00",
      to_time: "23:59",
    }));
    fetchData();
  };

  const canCreateSettlement = can("Merchant Settlement create");

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col md:flex-row items-center justify-between w-full">
            <bdi>
              {displayName ? `${displayName} - ` : ""}
              {t("Merchant Account Page")}
            </bdi>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={btnLoading}
                onClick={() => handleExport("csv")}
              >
                {btnLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("Export CSV")
                )}
              </Button>
              <Button
                variant="outline"
                disabled={btnLoading}
                onClick={() => handleExport("xlsx")}
              >
                {btnLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("Export Excel")
                )}
              </Button>
              <Button onClick={handleRefresh} variant="refresh">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <Card className="mb-4">
            <CardContent className="pt-4">
              <form
                onSubmit={applyFilters}
                className="grid grid-cols-1 md:grid-cols-5 gap-3"
              >
                <div className="flex items-center gap-2">
                  <span>{t("From")}</span>
                  <Input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span>{t("To")}</span>
                  <Input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t("All")}</SelectItem>
                    <SelectItem value="COD">{t("COD")}</SelectItem>
                    <SelectItem value="Fee">{t("Fee")}</SelectItem>
                    <SelectItem value="Settlement">
                      {t("Settlement")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder={t("Search by shipment/ref")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="submit">{t("Apply")}</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setFrom(defaultFrom);
                      setTo(defaultTo);
                      setType("All");
                      setSearch("");
                      setCurrentPage(1);
                      fetchData();
                    }}
                  >
                    {t("Reset")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatBox
              label={t("Total COD Collected")}
              value={formatCurrency(
                summary?.total_cod || 0,
                language,
                decimalPrecision,
                currencyEnglishName,
                currencyArabicName
              )}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <StatBox
              label={t("Total Fees")}
              value={formatCurrency(
                -(summary?.total_fees || 0),
                language,
                decimalPrecision,
                currencyEnglishName,
                currencyArabicName
              )}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <StatBox
              label={t("Total Settlements")}
              value={formatCurrency(
                -(summary?.total_settlements || 0),
                language,
                decimalPrecision,
                currencyEnglishName,
                currencyArabicName
              )}
              icon={<DollarSign className="h-4 w-4" />}
            />
            {/* <StatBox
              label={t("Current Balance")}
              value={formatCurrency(summary?.current_balance || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
              icon={<DollarSign className="h-4 w-4" />}
            /> */}
            <StatBox
              label={t("Current Balance")}
              value={formatCurrency(
                currentBalance,
                language,
                decimalPrecision,
                currencyEnglishName,
                currencyArabicName
              )}
              icon={<DollarSign className="h-4 w-4" />}
            />
          </div>

          {/* Transactions table */}
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t("Transactions")}</CardTitle>
                {canCreateSettlement && (
                  <CreateSettlementBtn
                    merchantId={id}
                    onDone={() => {
                      setCurrentPage(1);
                      fetchData();
                    }}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 flex justify-center">
                  <Loader />
                </div>
              ) : rows && rows.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Date")}</TableHead>
                        <TableHead>{t("Reference")}</TableHead>
                        <TableHead>{t("Type")}</TableHead>
                        <TableHead>{t("Description")}</TableHead>
                        <TableHead className="text-right">
                          {t(`Amount`)} (
                          {formatCurrentCurrency(
                            currencyEnglishName,
                            currencyArabicName,
                            language
                          )}
                          )
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r, idx) => {
                        const d = r.date ? new Date(r.date) : null;
                        const dateStr = d ? d.toLocaleDateString() : "-";
                        const timeStr = d
                          ? d.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-";
                        return (
                          <TableRow key={`${r.date}-${r.reference}-${idx}`}>
                            <TableCell>{`${dateStr} - ${timeStr}`}</TableCell>
                            <TableCell>{r.reference || "-"}</TableCell>
                            <TableCell className="capitalize">
                              {humanizeText(r.type)}
                            </TableCell>
                            <TableCell>{r.description || "-"}</TableCell>
                            <TableCell
                              className={`text-right ${
                                r.amount < 0
                                  ? "text-rose-600"
                                  : "text-emerald-700"
                              }`}
                            >
                              {r.amount > 0 ? "+" : ""}
                              {formatCurrency(
                                r.amount || 0,
                                language,
                                decimalPrecision,
                                currencyEnglishName,
                                currencyArabicName
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  <div className="mt-4">
                    <Pagination
                      links={Array.isArray(links) ? links : []}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </>
              ) : (
                <NoRecordFound />
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

export default MerchantAccounts;
