// src/pages/accounts/WarehouseAccountsManagement.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import { DollarSign, RefreshCw } from "lucide-react";
import { formatCurrency, handleError, humanizeText } from "@/utils/helpers";
import { useSelector } from "react-redux";
import Select from "@/components/misc/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "@/components/NoRecordFound";
import moment from "@/utils/moment.js";
import Loader from "@/components/Loader";
import { Label } from "@/components/ui/label";
import { DateTimeRangePicker } from "@/components/misc/DateTimeRangePicker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageProvider";
import Pagination from "@/components/Pagination";

export default function WarehouseAccountsManagement() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const authUser = useSelector((s) => s.auth.user);
  const { decimalPrecision, currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting);

  const today = moment().format("YYYY-MM-DD");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("collections"); // collections | expenses | advances | transfers
  const [data, setData] = useState({
    summary: {},
    transactions: [],
    counts: {},
    links: [],
    meta: {
      current_page: 1,
      per_page: 8,
    }
  });

  const [filters, setFilters] = useState({
    from: today,
    to: today,
    from_time: "00:00",
    to_time: "23:59",
    type: null,
    workspace_key: null,
    workspace_type: null,
  });

  const workspaceOptions =
    authUser?.workspaces?.map((ws) => ({
      value: ws.id,
      label: `${ws.name} (${String(ws?.type).split("\\").pop()})`,
      type: `${ws?.type}`,
    })) || [];
  const { current_page, per_page } = data.meta;

  const typeOptions = [
    { value: "cash_in", label: t("Cash In") },
    { value: "cash_out", label: t("Cash Out") },
    { value: "expense", label: t("Expense") },
    { value: "ibt_in", label: t("IBT In") },
    { value: "ibt_out", label: t("IBT Out") },
  ];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        from: `${filters.from} ${filters.from_time}`,
        page: current_page,
        per_page: per_page,
        to: `${filters.to} ${filters.to_time}`,
        type: filters.type || undefined,
        workspace_key: filters.workspace_key
          ? [filters.workspace_key]
          : undefined,
        workspace_type: filters.workspace_type
          ? [filters.workspace_type]
          : undefined,
      };
      const res = await axiosMerchant.get("/accounts-warehouse/showAll", {
        params,
      });
      setData(res.data.data || {
        summary: {}, transactions: [], counts: {}, links: [], meta: {
          current_page: 1,
          per_page: 8,
        }
      });
    } catch (e) {
      handleError(e);
    } finally {
      setIsLoading(false);
    }
  }, [filters, current_page, per_page]);

  useEffect(() => {
    const id = setTimeout(fetchData, 350);
    return () => clearTimeout(id);
  }, [fetchData]);

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleReset = () => {
    setData((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        current_page: 1,
      },
    }));
    setFilters({
      from: today,
      to: today,
      from_time: "00:00",
      to_time: "23:59",
      type: null,
      workspace_key: null,
      workspace_type: null,
    });
  }

  // table columns
  const columns = useMemo(
    () => [
      { key: "workspace_name", label: t("Workspace") },
      { key: "date", label: t("Date") },
      { key: "reference", label: t("Reference") },
      { key: "type", label: t("Type") },
      { key: "description", label: t("Description") },
      { key: "amount", label: t("Amount") },
      { key: "user_name", label: t("User") },
    ],
    [t]
  );

  const { summary, transactions, counts } = data || {};
  const bannerBalance = formatCurrency(summary?.net_balance || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName);

  // filter by active tab for the ledger
  const filteredRows = useMemo(() => {
    if (!transactions?.length) return [];
    switch (activeTab) {
      case "collections":
        return transactions.filter((r) => r.type === "cash_in");
      case "expenses":
        return transactions.filter((r) => r.type === "expense");
      case "transfers":
        return transactions.filter((r) =>
          ["transfer_in", "transfer_out"].includes(r.type)
        );
      case "advances":
        // advances are shown only as a total chip; no rows come from WT
        return [];
      default:
        return transactions;
    }
  }, [transactions, activeTab]);

  return (
    <div className="p-4">
      <PageTitle title={t("Warehouse Accounts Management")} />

      {/* banner */}
      <div
        className="rounded-2xl text-white p-6 shadow-xl mt-4"
        style={{
          backgroundColor: "#031d4e",
          backgroundImage: "linear-gradient(to right, #031d4e, #2c4c9e)",
        }}
      >
        <div className="flex items-center justify-between">
          {/* Left side: icon + label */}
          <div className="flex items-center gap-4">
            <div
              className="rounded-full w-14 h-14 grid place-items-center shadow-lg"
              style={{ backgroundColor: "#031d4e", opacity: 0.9 }}
            >
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div className="text-sm font-medium opacity-90">
              {t("Current Balance")}
            </div>
          </div>

          {/* Right side: balance + cash in/out */}
          <div className="text-right">
            <div className="text-4xl font-extrabold tracking-tight">
              {formatCurrency(summary?.net_balance || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
            </div>
            <div className="text-xs opacity-75 mt-1">
              {t("Cash In")}{" "}
              <span style={{ color: "#031d4e", fontWeight: "bold" }}>
                {formatCurrency(summary?.cash_in || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
              </span>{" "}
              · {t("Cash Out")}{" "}
              <span style={{ color: "#031d4e", fontWeight: "bold" }}>
                {formatCurrency(summary?.cash_out || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* filters */}
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[220px]">
              <Label>{t("Workspace")}</Label>
              <Select
                value={
                  filters.workspace_key
                    ? {
                      value: filters.workspace_key,
                      label: workspaceOptions.find(
                        (w) => w.value === filters.workspace_key
                      )?.label,
                    }
                    : null
                }
                onChange={(opt) => {
                  handleFilterChange("workspace_key", opt?.value || null);
                  handleFilterChange("workspace_type", opt?.type || null);
                }}
                options={workspaceOptions}
                isClearable
                placeholder={t("Filter by workspace")}
                className="mt-1"
              />
            </div>

            <div className="min-w-[180px]">
              <Label>{t("Type")}</Label>
              <Select
                value={
                  filters.type
                    ? typeOptions.find((o) => o.value === filters.type)
                    : null
                }
                onChange={(opt) =>
                  handleFilterChange("type", opt?.value || null)
                }
                options={typeOptions}
                isClearable
                placeholder={t("Filter by type")}
                className="mt-1"
              />
            </div>

            <div className="flex-1 min-w-[280px]">
              <Label>{t("Date and Time Range")}</Label>
              <DateTimeRangePicker
                filters={filters}
                onChange={handleFilterChange}
                t={t}
              />
            </div>

            <div className="ml-auto flex gap-2">
              <Button onClick={fetchData} variant="default">
                {t("Apply")}
              </Button>
              <Button onClick={handleReset} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" /> {t("Reset")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* stat chips */}
      {/* stat chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <StatChip
          label={t("Today's Collections")}
          value={summary?.today_collections}
          language={language}
          decimalPrecision={decimalPrecision}
          currencyEnglishName={currencyEnglishName}
          currencyArabicName={currencyArabicName}
        />
        <StatChip
          label={t("Expenses")}
          value={summary?.expenses}
          language={language}
          decimalPrecision={decimalPrecision}
          currencyEnglishName={currencyEnglishName}
          currencyArabicName={currencyArabicName}
        />
        <StatChip
          label={t("Driver Advances")}
          value={summary?.driver_advances}
          language={language}
          decimalPrecision={decimalPrecision}
          currencyEnglishName={currencyEnglishName}
          currencyArabicName={currencyArabicName}
        />
        <StatChip
          label={t("IBT")}
          value={(summary?.ibt?.in || 0) - (summary?.ibt?.out || 0)}
          language={language}
          decimalPrecision={decimalPrecision}
          currencyEnglishName={currencyEnglishName}
          currencyArabicName={currencyArabicName}
        />
      </div>

      {/* ledger */}
      <Card className="mt-4">
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="collections">
                {t("Collections")} ({counts?.collections || 0})
              </TabsTrigger>
              <TabsTrigger value="expenses">
                {t("Expenses")} ({counts?.expenses || 0})
              </TabsTrigger>
              <TabsTrigger value="advances">
                {t("Advances")} {/* count not available from WT */}
              </TabsTrigger>
              <TabsTrigger value="transfers">
                {t("Transfers")} ({counts?.transfers || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="advances" className="mt-6">
              {/* advances are summarized only */}
              <div className="text-sm text-muted-foreground">
                {t("Total driver advances in period")}:
                <span className="ml-2 font-semibold">
                  {formatCurrency(summary?.driver_advances || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                </span>
              </div>
            </TabsContent>

            <TabsContent value="collections" className="mt-6">
              <LedgerTable
                data={data}
                setData={setData}
                rows={filteredRows}
                columns={columns}
                isLoading={isLoading}
                empty={<NoRecordFound />}
                language={language}
                decimalPrecision={decimalPrecision}
                currencyEnglishName={currencyEnglishName}
                currencyArabicName={currencyArabicName}
              />
            </TabsContent>
            <TabsContent value="expenses" className="mt-6">
              <LedgerTable
                data={data}
                setData={setData}
                rows={filteredRows}
                columns={columns}
                isLoading={isLoading}
                empty={<NoRecordFound />}
                language={language}
                decimalPrecision={decimalPrecision}
                currencyEnglishName={currencyEnglishName}
                currencyArabicName={currencyArabicName}
              />
            </TabsContent>
            <TabsContent value="transfers" className="mt-6">
              <LedgerTable
                data={data}
                setData={setData}
                rows={filteredRows}
                columns={columns}
                isLoading={isLoading}
                empty={<NoRecordFound />}
                language={language}
                decimalPrecision={decimalPrecision}
                currencyEnglishName={currencyEnglishName}
                currencyArabicName={currencyArabicName}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

/* --- small presentational helpers --- */

/* --- small presentational helpers --- */
function StatChip({ label, value, language, decimalPrecision, currencyEnglishName, currencyArabicName }) {
  return (
    <div className="rounded-xl border p-4 bg-white dark:bg-neutral-900">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">
        {formatCurrency(value || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
      </div>
    </div>
  );
}

function LedgerTable({ data, setData, rows, columns, isLoading, empty, language, decimalPrecision, currencyEnglishName, currencyArabicName }) {

  const handlePageChange = (page) => {
    setData(prev => ({
      ...prev,
      meta: {
        ...prev.meta, // <--- تم تصحيح الدمج هنا
        current_page: page,
      }
    }));
  };
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }
  if (!rows?.length) return empty;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800">
            {columns.map((c) => (
              <TableHead key={c.key} className="text-nowrap">
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell>{r.workspace_name || "-"}</TableCell>
              <TableCell>
                {r.date ? moment(r.date).format("YYYY-MM-DD HH:mm") : "N/A"}
              </TableCell>
              <TableCell>{r.reference || "-"}</TableCell>
              <TableCell className="capitalize">
                {humanizeText(r.type)}
              </TableCell>
              <TableCell>{r.description || "-"}</TableCell>
              <TableCell
                className={`${r.amount < 0 ? "text-rose-600" : "text-emerald-700"
                  }`}
              >
                {r.amount > 0 ? "+" : ""}
                {formatCurrency(r.amount || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
              </TableCell>
              <TableCell>{r.user_name || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4">
        <Pagination
          links={data.links}
          currentPage={data.meta.current_page}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
