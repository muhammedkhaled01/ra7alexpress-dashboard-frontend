// src/components/AccountPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";

import {
  can,
  formatCurrency,
  formatDecimalValue,
  humanizeText,
} from "@/utils/helpers";

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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Select from "@/components/misc/Select";

import { RefreshCw, DollarSign, Eye } from "lucide-react";
import Loader from "@/components/Loader";
import NoRecordFound from "@/components/NoRecordFound";
import { DateTimeRangePicker } from "@/components/misc/DateTimeRangePicker.jsx";
import toast from "react-hot-toast";
import Pagination from "@/components/Pagination";
import RunsheetShipmentsView from "@/components/admin/QualityCheck/RunsheetShipmentsView.jsx";
import { useLanguage } from "@/contexts/LanguageProvider";
import { useSelector } from "react-redux";

function HeaderHero({ balance, cashIn, cashOut, label, id, navigate }) {
  const PRIMARY_BLUE = "#031d4e";
  const { decimalPrecision, currencyEnglishName, currencyArabicName } =
    useSelector((state) => state.setting);
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const isHub = pathname?.includes("/hubs/");
  const ACCENT_ORANGE = "#031d4e";
  const { t } = useTranslation();
  return (
    <div
      className="rounded-2xl text-white p-6 shadow-xl"
      style={{
        backgroundColor: PRIMARY_BLUE,
        backgroundImage: `linear-gradient(to right, ${PRIMARY_BLUE}, #2c4c9e)`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="rounded-full w-14 h-14 grid place-items-center shadow-lg"
            style={{ backgroundColor: ACCENT_ORANGE, opacity: 0.9 }}
          >
            <DollarSign className="w-7 h-7 text-white" />
          </div>
          <div className="text-sm font-medium opacity-90">{label}</div>
        </div>

        <div className="text-right">
          <div className="text-4xl font-extrabold tracking-tight">
            {formatCurrency(
              balance || 0,
              language,
              decimalPrecision,
              currencyEnglishName,
              currencyArabicName
            )}
          </div>
          <div className="text-xs opacity-75 mt-1">
            {t("Cash In")}{" "}
            <span style={{ color: ACCENT_ORANGE, fontWeight: "bold" }}>
              {formatCurrency(
                cashIn || 0,
                language,
                decimalPrecision,
                currencyEnglishName,
                currencyArabicName
              )}
            </span>{" "}
            · {t("Cash Out")}{" "}
            <span style={{ color: ACCENT_ORANGE, fontWeight: "bold" }}>
              {formatCurrency(
                cashOut || 0,
                language,
                decimalPrecision,
                currencyEnglishName,
                currencyArabicName
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          onClick={() =>
            navigate(
              isHub
                ? `/hubs/${id}/financial-requests`
                : `/stations/${id}/financial-requests`
            )
          }
          style={{
            backgroundColor: ACCENT_ORANGE,
            borderColor: ACCENT_ORANGE,
            color: "white",
          }}
          className="hover:bg-opacity-90 transition duration-200 border-0 shadow-lg font-semibold px-6 py-2"
        >
          {t("الشحنات المالية")}
        </Button>
      </div>
    </div>
  );
}

function KpiCard({ label, value, money = true }) {
  const { decimalPrecision, currencyEnglishName, currencyArabicName } =
    useSelector((state) => state.setting);
  const { language } = useLanguage();
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center justify-between py-5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-xl font-semibold">
          {money
            ? formatCurrency(
                value,
                language,
                decimalPrecision,
                currencyEnglishName,
                currencyArabicName
              )
            : value}
        </span>
      </CardContent>
    </Card>
  );
}

function TableLiteExpenses({ data, loading }) {
  const { t } = useTranslation();
  const { decimalPrecision, currencyEnglishName, currencyArabicName } =
    useSelector((state) => state.setting);
  const { language } = useLanguage();
  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader />
      </div>
    );
  }

  if (!data || data.length === 0) return <NoRecordFound />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">#</TableHead>
          <TableHead className="text-right">
            {t("Name / Description")}
          </TableHead>
          <TableHead className="text-right">{t("Amount")}</TableHead>
          <TableHead className="text-right">{t("Date")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((r, idx) => {
          const d = r.created_at ? new Date(r.created_at) : null;
          const dateStr = d ? d.toLocaleDateString() : "-";
          return (
            <TableRow key={idx}>
              <TableCell className="text-right font-medium">
                {idx + 1}
              </TableCell>
              <TableCell className="text-right font-medium">
                {r.name || r.description || "-"}
              </TableCell>
              <TableCell className="text-right text-red-600 font-semibold">
                {formatCurrency(
                  r.amount,
                  language,
                  decimalPrecision,
                  currencyEnglishName,
                  currencyArabicName
                )}
              </TableCell>
              <TableCell className="text-right">{dateStr}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function TableLite({ t, data, loading }) {
  const { decimalPrecision, currencyEnglishName, currencyArabicName } =
    useSelector((state) => state.setting);
  const { language } = useLanguage();
  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader />
      </div>
    );
  }

  if (!data || data.length === 0) return <NoRecordFound />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">{t("Driver")}</TableHead>
          <TableHead className="text-right">{t("Runsheet")}</TableHead>
          <TableHead className="text-right">{t("Amount")}</TableHead>
          <TableHead className="text-center">{t("Date")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((r, idx) => {
          const d = r.date ? new Date(r.date) : null;
          const dateStr = d ? d.toLocaleDateString() : "-";
          const timeStr = d
            ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "-";
          return (
            <TableRow key={idx}>
              <TableCell className="text-right">
                {r.driver_name || r.runsheet_details?.driver_name || "-"}
              </TableCell>
              <TableCell className="text-right">
                {r.runsheet_details && (
                  <RunsheetShipmentsView
                    tigger={
                      <Button
                        size="icon"
                        className="h-8 w-8 p-0"
                        title={t("View Runsheet Shipments")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    }
                    record={r.runsheet_details.shipments}
                  />
                )}
              </TableCell>
              <TableCell className="text-right text-emerald-600 font-semibold">
                {formatCurrency(
                  r.amount,
                  language,
                  decimalPrecision,
                  currencyEnglishName,
                  currencyArabicName
                )}
              </TableCell>
              <TableCell>{`${dateStr} - ${timeStr}`}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function TableSettlements({ t, data, loading }) {
  const { decimalPrecision, currencyEnglishName, currencyArabicName } =
    useSelector((state) => state.setting);
  const { language } = useLanguage();
  if (loading)
    return (
      <div className="py-8 flex justify-center">
        <Loader />
      </div>
    );
  if (!data || data.length === 0) return <NoRecordFound />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">#</TableHead>
          <TableHead className="text-right">{t("Reference")}</TableHead>
          <TableHead className="text-right">{t("Merchant")}</TableHead>
          <TableHead className="text-right">{t("Amount")}</TableHead>
          <TableHead className="text-right">{t("Status")}</TableHead>
          <TableHead className="text-right">{t("Date")}</TableHead>
          <TableHead className="text-right">{t("Receipt")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((r, idx) => {
          const d = r.created_at ? new Date(r.created_at) : null;
          const dateStr = d ? d.toLocaleString() : "-";
          const url =
            r.receipt_url || r.receiptPath || r.receipt || r.receipt_path;
          return (
            <TableRow key={r.id ?? idx}>
              <TableCell className="text-right">{idx + 1}</TableCell>
              <TableCell className="text-right">{r.reference || "-"}</TableCell>
              <TableCell className="text-right">
                {r.merchant_name || r.merchant?.name || "-"}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(
                  Number(r.amount || 0),
                  language,
                  decimalPrecision,
                  currencyEnglishName,
                  currencyArabicName
                )}
              </TableCell>
              <TableCell className="text-right">
                {humanizeText(r.status || "posted")}
              </TableCell>
              <TableCell className="text-right">{dateStr}</TableCell>
              <TableCell className="text-right">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    {t("View")}
                  </a>
                ) : (
                  "-\u200b"
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function TableDriverPayouts({ t, data, loading }) {
  const { decimalPrecision, currencyEnglishName, currencyArabicName } =
    useSelector((state) => state.setting);
  const { language } = useLanguage();
  if (loading)
    return (
      <div className="py-8 flex justify-center">
        <Loader />
      </div>
    );
  if (!data || data.length === 0) return <NoRecordFound />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">#</TableHead>
          <TableHead className="text-right">{t("Reference")}</TableHead>
          <TableHead className="text-right">{t("Driver")}</TableHead>
          <TableHead className="text-right">{t("Amount")}</TableHead>
          <TableHead className="text-right">{t("Date")}</TableHead>
          <TableHead className="text-right">{t("Receipt")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((r, idx) => {
          const d = r.date
            ? new Date(r.date)
            : r.created_at
            ? new Date(r.created_at)
            : null;
          const dateStr = d ? d.toLocaleString() : "-";
          const url =
            r.receipt_url || r.receiptPath || r.receipt || r.receipt_path;
          return (
            <TableRow key={r.id ?? idx}>
              <TableCell className="text-right">{idx + 1}</TableCell>
              <TableCell className="text-right">{r.reference || "-"}</TableCell>
              <TableCell className="text-right">
                {r.driver_name || r.user?.name || r.created_by_name || "-"}
              </TableCell>
              <TableCell className="text-right text-emerald-700 font-semibold">
                {formatCurrency(
                  Number(r.amount || 0),
                  language,
                  decimalPrecision,
                  currencyEnglishName,
                  currencyArabicName
                )}
              </TableCell>
              <TableCell className="text-right">{dateStr}</TableCell>
              <TableCell className="text-right">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    {t("View")}
                  </a>
                ) : (
                  "-\u200b"
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
function TableApprovedRequests({ t, data, loading }) {
  const { decimalPrecision, currencyEnglishName, currencyArabicName } =
    useSelector((state) => state.setting);
  const { language } = useLanguage();
  if (loading)
    return (
      <div className="py-8 flex justify-center">
        <Loader />
      </div>
    );
  if (!data || data.length === 0) return <NoRecordFound />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">#</TableHead>
          <TableHead className="text-right">{t("Code")}</TableHead>
          <TableHead className="text-right">{t("Type")}</TableHead>
          <TableHead className="text-right">{t("Party")}</TableHead>
          <TableHead className="text-right">{t("Period")}</TableHead>
          <TableHead className="text-right">{t("Amount")}</TableHead>
          <TableHead className="text-right">{t("Approved At")}</TableHead>
          <TableHead className="text-right">{t("Attachment")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((r, idx) => {
          const d = r.approved_at ? new Date(r.approved_at) : null;
          const dateStr = d ? d.toLocaleString() : "-";
          return (
            <TableRow key={r.id ?? idx}>
              <TableCell className="text-right">{idx + 1}</TableCell>
              <TableCell className="text-right">{r.code}</TableCell>
              <TableCell className="text-right">
                {humanizeText(r.type)}
              </TableCell>
              <TableCell className="text-right">
                {r.party_name || "-"}
              </TableCell>
              <TableCell className="text-right">{r.period || "-"}</TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(
                  Number(r.amount || 0),
                  language,
                  decimalPrecision,
                  currencyEnglishName,
                  currencyArabicName
                )}
              </TableCell>
              <TableCell className="text-right">{dateStr}</TableCell>
              <TableCell className="text-right">
                {r.attachment_path ? (
                  <a
                    href={r.attachment_path}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    {t("View")}
                  </a>
                ) : (
                  "-\u200b"
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function AccountPage({ entity }) {
  const { id } = useParams();
  const { decimalPrecision, currencyEnglishName, currencyArabicName } =
    useSelector((state) => state.setting);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [accountable, setAccountable] = useState(null);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [rawExpenses, setRawExpenses] = useState([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [driverAdvances, setDriverAdvances] = useState([]);
  const [advancesLinks, setAdvancesLinks] = useState([]);
  const [advancesCurrentPage, setAdvancesCurrentPage] = useState(1);

  // transfers: extra datasets
  const [merchantSettlements, setMerchantSettlements] = useState([]);
  const [driverPayouts, setDriverPayouts] = useState([]);
  const [settlementsLinks, setSettlementsLinks] = useState([]);
  const [payoutsLinks, setPayoutsLinks] = useState([]);
  const [settlementsCurrentPage, setSettlementsCurrentPage] = useState(1);
  const [payoutsCurrentPage, setPayoutsCurrentPage] = useState(1);

  const [transactionsLinks, setTransactionsLinks] = useState([]);
  const [expensesLinks, setExpensesLinks] = useState([]);
  const [transactionsCurrentPage, setTransactionsCurrentPage] = useState(1);
  const [expensesCurrentPage, setExpensesCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [approvedRequestsLinks, setApprovedRequestsLinks] = useState([]);
  const [approvedRequestsCurrentPage, setApprovedRequestsCurrentPage] =
    useState(1);
  const today = new Date();
  const [filters, setFilters] = useState({
    from: today,
    to: today,
    type: null,
    from_time: "00:00",
    to_time: "23:59",
  });

  const [feeDlgOpen, setFeeDlgOpen] = useState(false);
  const [feeDlgLoading, setFeeDlgLoading] = useState(false);
  const [feeAlloc, setFeeAlloc] = useState([]);
  const [feeDlgShipment, setFeeDlgShipment] = useState({
    tracking_no: "",
    total_fee: 0,
  });

  const canAccess = can("Account access");
  useEffect(() => {
    if (!canAccess) navigate("/unauthorized");
  }, [canAccess, navigate]);

  const dir =
    typeof document !== "undefined"
      ? document.documentElement.dir || (i18n.language === "ar" ? "rtl" : "ltr")
      : i18n.language === "ar"
      ? "rtl"
      : "ltr";

  const initialTab = location?.state?.tab || "collections";

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // NEW: fetchData with a single object param (prevents positional arg bugs)
  const fetchData = useCallback(
    async ({ page = 1, tab = "collections", perPage = itemsPerPage }) => {
      setLoading(true);
      try {
        const formattedFrom = formatDate(filters.from);
        const formattedTo = formatDate(filters.to);

        const params = {
          from: `${formattedFrom} ${filters.from_time}`,
          to: `${formattedTo} ${filters.to_time}`,
          type: filters?.type === "null" ? null : filters?.type,
          perPage,
          ...(warehouseId ? { warehouse_id: warehouseId } : {}),
        };

        if (tab === "expenses") {
          params.expenses_page = page;
          params.expenses_per_page = perPage;
        } else if (tab === "collections") {
          params.transactions_page = page;
          params.transactions_per_page = perPage;
        } else if (tab === "advances") {
          params.advances_page = page;
          params.advances_per_page = perPage;
        } else if (tab === "transfers") {
          // If your backend supports separate paging for settlements/payouts, add here:
          // params.settlements_page = settlementsCurrentPage;
          // params.payouts_page = payoutsCurrentPage;
          // params.transactions_page = page; // if you also list transaction transfers
        }

        const qs = new URLSearchParams(params).toString();
        const url =
          entity === "hub"
            ? `accounts-warehouse/hub/${id}?${qs}`
            : `accounts-warehouse/station/${id}?${qs}`;

        const { data } = await axiosMerchant.get(url);
        const res = data?.data || {};

        // ---- settlements
        if (res?.merchant_settlements) {
          const cs = Array.isArray(res.merchant_settlements?.data)
            ? res.merchant_settlements.data
            : Array.isArray(res.merchant_settlements)
            ? res.merchant_settlements
            : [];
          setMerchantSettlements(cs);
          setSettlementsLinks(res.merchant_settlements.links || []);
        } else {
          setMerchantSettlements([]);
          setSettlementsLinks([]);
        }
        // ---- driver advances (from this warehouse only)
        if (res?.driver_advances) {
          const adata = Array.isArray(res.driver_advances?.data)
            ? res.driver_advances.data
            : Array.isArray(res.driver_advances)
            ? res.driver_advances
            : [];
          setDriverAdvances(
            adata.map((a) => ({
              date: a.date || a.created_at,
              type: "advance",
              description: a.description || "Driver advance",
              amount: Number(a.amount || 0),
              driver_name: a.driver_name || "-",
              reference: a.reference || null,
            }))
          );
          setAdvancesLinks(res.driver_advances.links || []);
        } else {
          setDriverAdvances([]);
          setAdvancesLinks([]);
        }

        // ---- payouts (explicit or derive from transactions)
        let payoutsPayload = [];
        if (res?.payouts) {
          payoutsPayload = Array.isArray(res.payouts?.data)
            ? res.payouts.data
            : Array.isArray(res.payouts)
            ? res.payouts
            : [];
          setPayoutsLinks(res.payouts.links || []);
        }

        setAccountable(res?.accountable ?? res[entity] ?? null);
        setSummary(res?.summary || null);

        if (res?.expenses) {
          setRawExpenses(res.expenses.data || []);
          setExpensesLinks(res.expenses.links || []);
        } else {
          setRawExpenses([]);
          setExpensesLinks([]);
        }

        let tx = [];
        if (res?.transactions) {
          tx = res.transactions.data || [];
          setTransactionsLinks(res.transactions.links || []);
        } else {
          tx = [
            ...(res?.from_transactions || []),
            ...(res?.to_transactions || []),
          ];
          setTransactionsLinks([]);
        }
        if (res?.approved_financial_requests) {
          const afr = Array.isArray(res.approved_financial_requests?.data)
            ? res.approved_financial_requests.data
            : Array.isArray(res.approved_financial_requests)
            ? res.approved_financial_requests
            : [];
          setApprovedRequests(afr);
          setApprovedRequestsLinks(res.approved_financial_requests.links || []);
        } else {
          setApprovedRequests([]);
          setApprovedRequestsLinks([]);
        }
        tx = (tx || []).map((r) => ({
          date: r.date || r.created_at,
          type: r.type,
          description:
            r.description ||
            r.notes ||
            r.remark ||
            (r.shipment?.tracking_no ? `COD for ${r.shipment.tracking_no}` : "-"),
          amount: Number(r.amount ?? 0),
          fee: r.fee ?? (r.fee === 0 ? 0 : null),
          cod: r.cod ?? (r.cod === 0 ? 0 : null),
          user_name:
            r?.runsheet_details?.driver_name ||
            r.user?.name ||
            r.created_by_name ||
            "-",
          driver_name:
            r?.runsheet_details?.driver_name ||
            r.driver?.name ||
            r.user_name ||
            "-",
          shipment_tracking_no:
            r.shipment_tracking_no ??
            r.tracking_no ??
            r.shipment?.tracking_no ??
            null,
          reference: r.reference ?? r.ref ?? null,
          runsheet_details: r.runsheet_details,
          shipment: r.shipment ?? null,
          // optional front-normalization for receipts if needed:
          // receipt_url: r.receipt_url || r.receipt_path,
        }));

        tx.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // derive payouts when API doesn't provide them
        if (!payoutsPayload.length) {
          payoutsPayload = (tx || []).filter(
            (r) => String(r.type || "").toLowerCase() === "payout"
          );
        }
        setDriverPayouts(payoutsPayload);

        setRows(tx);
      } catch (e) {
        toast.error(t("Failed to load data"));
      } finally {
        setLoading(false);
      }
    },
    [entity, id, filters, warehouseId, itemsPerPage, t]
  );

  // initial load
  useEffect(() => {
    fetchData({ page: 1, tab: initialTab });
  }, [fetchData, initialTab]);

  const handleTabChange = (tab) => {
    if (tab === "expenses") {
      setExpensesCurrentPage(1);
      fetchData({ page: 1, tab });
    } else if (tab === "advances") {
      setAdvancesCurrentPage(1);
      fetchData({ page: 1, tab });
    } else if (tab === "transfers") {
      setSettlementsCurrentPage(1);
      setPayoutsCurrentPage(1);
      fetchData({ page: 1, tab });
    } else {
      setTransactionsCurrentPage(1);
      fetchData({ page: 1, tab }); // collections
    }
  };

  // pagination
  const handleTransactionsPageChange = (pageNumber) => {
    setTransactionsCurrentPage(pageNumber);
    fetchData({ page: pageNumber, tab: "collections" });
  };

  const handleExpensesPageChange = (pageNumber) => {
    setExpensesCurrentPage(pageNumber);
    fetchData({ page: pageNumber, tab: "expenses" });
  };
  const handleAdvancesPageChange = (pageNumber) => {
    setAdvancesCurrentPage(pageNumber);
    fetchData({ page: pageNumber, tab: "advances" });
  };
  const typeOptions = [
    { value: "cash_in", label: t("Cash In") },
    { value: "cash_out", label: t("Cash Out") },
    { value: "ibt_in", label: t("IBT In") },
    { value: "ibt_out", label: t("IBT Out") },
  ];

  const handleRefresh = () => {
    const today = new Date();
    setFilters({
      from: today,
      to: today,
      type: null,
      from_time: "00:00",
      to_time: "23:59",
    });
    setTransactionsCurrentPage(1);
    setExpensesCurrentPage(1);
    setSettlementsCurrentPage(1);
    setPayoutsCurrentPage(1);
    setWarehouseId("");
    // optional: re-fetch current tab
    fetchData({ page: 1, tab: initialTab });
  };

  const handleFilterChange = (key, value) =>
    setFilters((p) => ({ ...p, [key]: value }));

  const reset = () => {
    const today = new Date();
    setFilters({
      from: today,
      to: today,
      from_time: "00:00",
      to_time: "23:59",
    });
    setWarehouseId("");
    setTransactionsCurrentPage(1);
    setExpensesCurrentPage(1);
    setSettlementsCurrentPage(1);
    setPayoutsCurrentPage(1);
    fetchData({ page: 1, tab: initialTab });
  };

  const namePrefix = useMemo(
    () => (accountable?.name ? `${accountable.name} - ` : ""),
    [accountable?.name]
  );

  const warehouses = summary?.warehouses || accountable?.warehouses || [];

  const isCollection = (r) =>
    ["collection", "cod_collection", "cash_in"].includes(
      String(r.type || "").toLowerCase()
    );
  const isExpense = (r) =>
    ["expense", "cash_out", "opex"].includes(
      String(r.type || "").toLowerCase()
    );
  const isAdvance = (r) =>
    ["driver_advance", "advance"].includes(String(r.type || "").toLowerCase());
  const isDeposit = (r) =>
    ["deposit", "bank_deposit"].includes(String(r.type || "").toLowerCase());
  const isTransfer = (r) =>
    ["transfer_in", "transfer_out", "transfer"].includes(
      String(r.type || "").toLowerCase()
    );

  const collections = rows.filter(isCollection);
  const expenses = rows.filter(isExpense);
  const advances = rows.filter(isAdvance);
  const deposits = rows.filter(isDeposit);
  const transfers = rows.filter(isTransfer);

  const getRunsheetId = (tx) => {
    const ref = String(tx.reference ?? "");
    if (ref.startsWith("COD-RS-")) {
      const id = parseInt(ref.replace("COD-RS-", ""), 10);
      if (!Number.isNaN(id)) return id;
    }
    const desc = String(tx.description ?? "");
    const m = desc.match(/runsheet\s*#\s*(\d+)/i);
    if (m && m[1]) {
      const id = parseInt(m[1], 10);
      if (!Number.isNaN(id)) return id;
    }
    return null;
  };

  const getTrackingNo = (tx) => {
    if (tx.shipment_tracking_no) return String(tx.shipment_tracking_no);
    if (tx.tracking_no) return String(tx.tracking_no);
    if (tx.shipment?.tracking_no) return String(tx.shipment.tracking_no);
    const d = String(tx.description || "");
    const fromDesc = d.match(/\bPE\d+\b/i);
    if (fromDesc && fromDesc[0]) return fromDesc[0];
    const ref = String(tx.reference || "");
    const fromRef = ref.match(/\bPE\d+\b/i);
    if (fromRef && fromRef[0]) return fromRef[0];
    return "";
  };

  const resolveTrackingForTx = async (tx) => {
    const direct = getTrackingNo(tx);
    if (direct) return direct;
    const rsId = getRunsheetId(tx);
    if (!rsId) return "";
    try {
      const { data } = await axiosMerchant.get(
        `/runsheets/${rsId}/transferables`
      );
      const items = Array.isArray(data?.data) ? data.data : [];
      const f = Number(tx.fee || 0);
      const match = items.find(
        (it) => Math.abs(Number(it.fee ?? it.amount ?? 0) - f) < 0.001
      );
      if (match)
        return (
          match.tracking_no ?? match.shipment_tracking_no ?? match.shipment_code ?? ""
        );
      if (items.length === 1) {
        const it = items[0];
        return it.tracking_no ?? it.shipment_tracking_no ?? it.shipment_code ?? "";
      }
      return "";
    } catch {
      return "";
    }
  };

  const normalizeFeeAllocPayload = (payload, trackingNo, totalFee) => {
    const rows = [];
    const a = payload?.allocation ?? payload ?? {};
    const others = Array.isArray(payload?.others) ? payload.others : [];
    const createdAt = a.created_at || a.updated_at || new Date().toISOString();
    const amt = (v) => formatDecimalValue(v, decimalPrecision);
    const labelWH = (id) => (id ? `Warehouse #${id}` : "Warehouse (N/A)");
    const labelDrv = (id) => (id ? `Driver #${id}` : "Driver (N/A)");

    rows.push({
      created_at: createdAt,
      amount: amt(a.pickup_driver_amount),
      recipient: labelDrv(a.pickup_driver_id),
      type: "pickup_driver",
      shipment_no: trackingNo,
    });
    rows.push({
      created_at: createdAt,
      amount: amt(a.first_warehouse_amount),
      recipient: labelWH(a.first_warehouse_id),
      type: "first_warehouse",
      shipment_no: trackingNo,
    });

    if (others.length > 0) {
      others.forEach((o) =>
        rows.push({
          created_at: createdAt,
          amount: amt(o.amount),
          recipient: labelWH(o.warehouse_id),
          type: "other_warehouse",
          shipment_no: trackingNo,
        })
      );
    } else {
      rows.push({
        created_at: createdAt,
        amount: amt(a.other_warehouse_amount),
        recipient: labelWH(a.other_warehouse_id),
        type: "other_warehouse",
        shipment_no: trackingNo,
      });
    }

    rows.push({
      created_at: createdAt,
      amount: amt(a.delivery_driver_amount),
      recipient: labelDrv(a.delivery_driver_id),
      type: "delivery_driver",
      shipment_no: trackingNo,
    });
    rows.push({
      created_at: createdAt,
      amount: amt(a.company_amount),
      recipient: "Ra7al Express (N/A)",
      type: "company",
      shipment_no: trackingNo,
    });
    return rows;
  };

  const loadFeeAllocations = async (trackingNo, totalFee = 0) => {
    try {
      setFeeDlgLoading(true);
      if (!trackingNo) {
        const rows = normalizeFeeAllocPayload({}, "", totalFee);
        setFeeAlloc(rows);
        setFeeDlgShipment({ tracking_no: "", total_fee: Number(totalFee || 0) });
        setFeeDlgOpen(true);
        return;
      }
      const safeTrk = encodeURIComponent(trackingNo);
      const { data } = await axiosMerchant.get(
        `/shipments/${safeTrk}/fee-allocations`
      );
      const payload = data?.data ?? {};
      const rows = Array.isArray(payload.rows)
        ? payload.rows
        : normalizeFeeAllocPayload(payload, trackingNo, totalFee);
      const apiTotal = Number(payload?.allocation?.total_delivery_fee ?? NaN);
      const effectiveTotal = Number.isFinite(apiTotal)
        ? apiTotal
        : Number(totalFee || 0);

      setFeeAlloc(rows);
      setFeeDlgShipment({ tracking_no: trackingNo, total_fee: effectiveTotal });
      setFeeDlgOpen(true);
    } catch {
      const rows = normalizeFeeAllocPayload({}, trackingNo || "", totalFee);
      setFeeAlloc(rows);
      setFeeDlgShipment({
        tracking_no: trackingNo || "",
        total_fee: Number(totalFee || 0),
      });
      setFeeDlgOpen(true);
    } finally {
      setFeeDlgLoading(false);
    }
  };

  const onOpenFee = async (tx) => {
    const trackingNo = await resolveTrackingForTx(tx);
    const totalFee = Number(tx.fee || 0);
    if (trackingNo) return loadFeeAllocations(trackingNo, totalFee);
    const rows = normalizeFeeAllocPayload({}, "", totalFee);
    setFeeAlloc(rows);
    setFeeDlgShipment({ tracking_no: "", total_fee: totalFee });
    setFeeDlgOpen(true);
  };

  return (
    <div dir={dir} className="space-y-4">
      <HeaderHero
        label={
          entity === "hub"
            ? t("Hub Current Balance")
            : t("Branch Current Balance")
        }
        balance={summary?.net_balance}
        cashIn={summary?.cash_in}
        cashOut={summary?.cash_out}
        id={id}
        navigate={navigate}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          <bdi>
            {namePrefix}
            {t("Account")}
          </bdi>
        </h2>
        <Button onClick={handleRefresh} variant="refresh" title={t("Refresh")}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("Filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // use the current active tab if you store it; otherwise fall back to initialTab
              fetchData({ page: 1, tab: initialTab });
            }}
            className="flex flex-col md:flex-row gap-3 items-center"
          >
            <div className="flex flex-col input-container w-full md:w-auto">
              <DateTimeRangePicker
                filters={filters}
                onChange={handleFilterChange}
                t={t}
              />
            </div>
            <div>
              <Select
                value={
                  filters.type
                    ? typeOptions.find((o) => o.value === filters.type)
                    : null
                }
                onChange={(selected) =>
                  handleFilterChange("type", selected?.value || null)
                }
                options={typeOptions}
                placeholder={t("Filter by type")}
                className="w-full mt-1"
                isClearable
              />
            </div>
            <div>
              <Select
                value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
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

            <Button type="submit" disabled={loading}>
              {t("Apply")}
            </Button>
            <Button type="button" variant="secondary" onClick={reset}>
              {t("Reset")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label={t("Today's Collections")}
          value={summary?.today_collections ?? 0}
        />
        <KpiCard label={t("Expenses")} value={summary?.expenses ?? 0} />
        <KpiCard
          label={t("Driver Advances")}
          value={summary?.driver_advances ?? 0}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue={initialTab} onValueChange={handleTabChange}>
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="collections">
                {t("Collections")} ({rows.filter(isCollection).length})
              </TabsTrigger>
              <TabsTrigger value="expenses">
                {t("Expenses")} ({rawExpenses.length})
              </TabsTrigger>
              <TabsTrigger value="advances">
                {t("Advances")} ({driverAdvances.length})
              </TabsTrigger>
              <TabsTrigger value="transfers">
                {t("Transfers")} (
                {rows.filter(isTransfer).length +
                  driverPayouts.length +
                  merchantSettlements.length}
                )
              </TabsTrigger>
            </TabsList>

            <TabsContent value="collections" className="mt-6">
              <TableLite t={t} data={collections} loading={loading} />
              {transactionsLinks.length > 0 && (
                <div className="mt-4">
                  <Pagination
                    links={transactionsLinks}
                    currentPage={transactionsCurrentPage}
                    onPageChange={handleTransactionsPageChange}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="expenses" className="mt-6">
              <TableLiteExpenses data={rawExpenses} loading={loading} />
              {expensesLinks.length > 0 && (
                <div className="mt-4">
                  <Pagination
                    links={expensesLinks}
                    currentPage={expensesCurrentPage}
                    onPageChange={handleExpensesPageChange}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="advances" className="mt-6">
              <TableLite t={t} data={driverAdvances} loading={loading} />
              {advancesLinks.length > 0 && (
                <div className="mt-4">
                  <Pagination
                    links={advancesLinks}
                    currentPage={advancesCurrentPage}
                    onPageChange={handleAdvancesPageChange}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="transfers" className="mt-6 space-y-8">
              {/* (A) Existing transfers (IBT) */}
              {rows.filter(isTransfer).length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm font-medium opacity-80">
                    {t("Inter-Branch Transfers")}
                  </div>
                  <TableLite t={t} data={transfers} loading={loading} />
                  {transactionsLinks.length > 0 && (
                    <div className="mt-4">
                      <Pagination
                        links={transactionsLinks}
                        currentPage={transactionsCurrentPage}
                        onPageChange={handleTransactionsPageChange}
                      />
                    </div>
                  )}
                </div>
              )}
              {/* (D) Approved Financial Requests */}
              <div className="space-y-3">
                <div className="text-sm font-medium opacity-80">
                  {t("Approved Financial Requests")}
                </div>
                <TableApprovedRequests
                  t={t}
                  data={approvedRequests}
                  loading={loading}
                />
                {approvedRequestsLinks.length > 0 && (
                  <div className="mt-4">
                    <Pagination
                      links={approvedRequestsLinks}
                      currentPage={approvedRequestsCurrentPage}
                      onPageChange={(page) => {
                        setApprovedRequestsCurrentPage(page);
                        fetchData({ page, tab: "transfers" });
                      }}
                    />
                  </div>
                )}
              </div>
              {/* (B) Merchant Settlements */}
              <div className="space-y-3">
                <div className="text-sm font-medium opacity-80">
                  {t("Merchant Settlements")}
                </div>
                <TableSettlements
                  t={t}
                  data={merchantSettlements}
                  loading={loading}
                />
                {settlementsLinks.length > 0 && (
                  <div className="mt-4">
                    <Pagination
                      links={settlementsLinks}
                      currentPage={settlementsCurrentPage}
                      onPageChange={(page) => {
                        setSettlementsCurrentPage(page);
                        fetchData({ page, tab: "transfers" });
                      }}
                    />
                  </div>
                )}
              </div>

              {/* (C) Driver Bonus Payouts (transactions.type = 'payout') */}
              <div className="space-y-3">
                <div className="text-sm font-medium opacity-80">
                  {t("Driver Bonus Payouts")}
                </div>
                <TableDriverPayouts
                  t={t}
                  data={driverPayouts}
                  loading={loading}
                />
                {payoutsLinks.length > 0 && (
                  <div className="mt-4">
                    <Pagination
                      links={payoutsLinks}
                      currentPage={payoutsCurrentPage}
                      onPageChange={(page) => {
                        setPayoutsCurrentPage(page);
                        fetchData({ page, tab: "transfers" });
                      }}
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={feeDlgOpen} onOpenChange={setFeeDlgOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {t("Delivery Fee Allocation")}{" "}
              {feeDlgShipment.tracking_no ? `— ${feeDlgShipment.tracking_no}` : ""}
            </DialogTitle>
            <div className="text-sm text-muted-foreground">
              {t("Total Fee")}:{" "}
              {formatCurrency(
                Number(feeDlgShipment.total_fee),
                language,
                decimalPrecision,
                currencyEnglishName,
                currencyArabicName
              )}
            </div>
          </DialogHeader>

          {feeDlgLoading ? (
            <div className="py-8 flex justify-center">
              <Loader />
            </div>
          ) : feeAlloc.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{t("Date")}</TableHead>
                    <TableHead className="text-right">
                      {t("Allocated Amount")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("Recipient")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("Recipient Type")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("Runsheet")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeAlloc.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-right">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          Number(r.amount ?? 0),
                          language,
                          decimalPrecision,
                          currencyEnglishName,
                          currencyArabicName
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.recipient || "-\u200b"}
                      </TableCell>
                      <TableCell className="lowercase text-right">
                        {humanizeText(r.type || "")}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.shipment_no || "-\u200b"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <NoRecordFound />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
