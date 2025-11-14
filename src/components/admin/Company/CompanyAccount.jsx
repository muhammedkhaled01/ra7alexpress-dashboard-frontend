import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axiosMerchant from "@/axios";

import { can, formatCurrency } from "@/utils/helpers";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/Loader";
import {
  DollarSign,
  RefreshCw,
  CheckCircle2,
  Landmark,
  Users,
  Building2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageProvider";
import { useTranslation } from "react-i18next";

/**
 * CompanyAccount.jsx (EN)
 * Layout:
 * - Header with title + Refresh
 * - Hero balance banner (gradient) with three pills (Inflows / Outflows / Net)
 * - Four summary cards (Pending Settlements, Driver Salaries, Merchant Settlements, Branch Expenses)
 * - Journal tabs: All / Incoming only / Outgoing only
 * (table shows Date | Statement | Details | Debit | Credit | Balance)
 */

function Pill({ label, value, className = "" }) {
  return (
    <div
      className={`rounded-xl bg-white/15 text-white px-4 py-2 flex items-center gap-2 backdrop-blur ${className}`}
    >
      <span className="text-sm opacity-90">{label}</span>
      <span className="text-base font-semibold">{value}</span>
    </div>
  );
}

function SummaryItem({ icon, label, value }) {
  return (
    <div className="w-full rounded-2xl border bg-card p-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl p-3 bg-muted/50">{icon}</div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function JournalTable({
  loading,
  rows,
  language,
  decimalPrecision,
  currencyEnglishName,
  currencyArabicName,
}) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader />
      </div>
    );
  }
  if (!rows || rows.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        {t("No records found")}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40">
          <TableHead>{t("Date")}</TableHead>
          <TableHead>{t("Statement")}</TableHead>
          <TableHead>{t("Details")}</TableHead>
          <TableHead className="text-center">{t("Debit")}</TableHead>
          <TableHead className="text-center">{t("Credit")}</TableHead>
          <TableHead className="text-center">{t("Balance")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={r.id ?? i}>
            <TableCell>
              {r.date ? new Date(r.date).toLocaleString() : "—"}
            </TableCell>
            <TableCell>{r.statement || r.raw_type || "—"}</TableCell>
            <TableCell className="text-muted-foreground">
              {r.details || "—"}
            </TableCell>
            <TableCell className="text-center font-semibold text-emerald-600">
              {r.debit
                ? formatCurrency(
                  r.debit,
                  language,
                  decimalPrecision,
                  currencyEnglishName,
                  currencyArabicName
                )
                : "—"}
            </TableCell>
            <TableCell className="text-center font-semibold text-rose-600">
              {r.credit
                ? formatCurrency(
                  r.credit,
                  language,
                  decimalPrecision,
                  currencyEnglishName,
                  currencyArabicName
                )
                : "—"}
            </TableCell>
            <TableCell className="text-center font-bold text-blue-700">
              {formatCurrency(
                r.balance || 0,
                language,
                decimalPrecision,
                currencyEnglishName,
                currencyArabicName
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function CompanyAccount() {
  const { company_id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const {
    decimalPrecision = 2,
    currencyEnglishName,
    currencyArabicName,
  } = useSelector((state) => state.setting || {});
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);

  // top totals
  const [balance, setBalance] = useState(0);
  const [summary, setSummary] = useState({
    inflows: 0,
    outflows: 0,
    net: 0,
    opening: 0,
  });

  // journal
  const [journal, setJournal] = useState([]); // array of {date, statement, details, debit, credit, balance}
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    incoming: 0,
    outgoing: 0,
  });
  const [activeTab, setActiveTab] = useState("all"); // all | incoming | outgoing

  const canAccess = can("Account access");

  useEffect(() => {
    if (!canAccess) navigate("/unauthorized");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosMerchant.get(`/company-accounts/${company_id}`);
      const payload = data?.data ?? data ?? {};

      const acc = payload.account ?? payload;
      const comp =
        payload.company ?? payload.accountable ?? payload.company_data ?? null;

      setCompany(comp);
      // prefer summary.balance if provided, fallback to account.balance
      setBalance(
        Number(
          payload?.summary?.balance ?? acc?.balance ?? payload?.balance ?? 0
        )
      );

      setSummary({
        inflows: Number(payload?.summary?.inflows ?? payload?.inflows ?? 0),
        outflows: Number(payload?.summary?.outflows ?? payload?.outflows ?? 0),
        net: Number(payload?.summary?.net ?? payload?.net ?? 0),
        opening: Number(payload?.summary?.opening ?? 0),
      });

      setJournal(Array.isArray(payload?.ledger) ? payload.ledger : []);
      setTabCounts(
        payload?.tabs_counts || { all: 0, incoming: 0, outgoing: 0 }
      );
    } finally {
      setLoading(false);
    }
  }, [company_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRecalculate = async () => {
    try {
      setLoading(true);
      await axiosMerchant.post(`/company-accounts/${company_id}/recalculate`);
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const companyName = useMemo(
    () => (company?.name ? `${company.name} - ` : ""),
    [company?.name]
  );

  // derive rows by tab
  const filteredRows = useMemo(() => {
    if (!journal?.length) return [];
    if (activeTab === "incoming")
      return journal.filter((r) => (r.debit || 0) > 0);
    if (activeTab === "outgoing")
      return journal.filter((r) => (r.credit || 0) > 0);
    return journal;
  }, [journal, activeTab]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>
              <bdi>{companyName}{t("Account")}</bdi>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRecalculate}
                variant="ghost"
                size="icon"
                title={t("Recalculate")}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Hero balance banner */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/15 flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm opacity-90">
                    {t("Total Company Balance")}
                  </div>
                  <div className="text-3xl font-extrabold leading-tight">
                    {formatCurrency(
                      balance,
                      language,
                      decimalPrecision,
                      currencyEnglishName,
                      currencyArabicName
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Pill
                  label={t("Inflows")}
                  value={formatCurrency(
                    summary.inflows || 0,
                    language,
                    decimalPrecision,
                    currencyEnglishName,
                    currencyArabicName
                  )}
                />
                <Pill
                  label={t("Outflows")}
                  value={formatCurrency(
                    summary.outflows || 0,
                    language,
                    decimalPrecision,
                    currencyEnglishName,
                    currencyArabicName
                  )}
                />
                <Pill
                  label={t("Net")}
                  value={formatCurrency(
                    summary.net || 0,
                    language,
                    decimalPrecision,
                    currencyEnglishName,
                    currencyArabicName
                  )}
                />
              </div>
            </div>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryItem
              icon={<CheckCircle2 className="h-5 w-5" />}
              label={t("Pending Settlements")}
              value={
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {Number.isFinite(summary.pending_settlements)
                    ? summary.pending_settlements
                    : 0}
                </Badge>
              }
            />
            <SummaryItem
              icon={<Landmark className="h-5 w-5" />}
              label={t("Driver Salaries")}
              value={formatCurrency(
                summary.driver_salaries || 0,
                language,
                decimalPrecision,
                currencyEnglishName,
                currencyArabicName
              )}
            />
            <SummaryItem
              icon={<Users className="h-5 w-5" />}
              label={t("Merchant Settlements")}
              value={formatCurrency(
                summary.merchant_settlements || 0,
                language,
                decimalPrecision,
                currencyEnglishName,
                currencyArabicName
              )}
            />
            <SummaryItem
              icon={<Building2 className="h-5 w-5" />}
              label={t("Branch Expenses")}
              value={formatCurrency(
                summary.branch_expenses || 0,
                language,
                decimalPrecision,
                currencyEnglishName,
                currencyArabicName
              )}
            />
          </div>

          {/* Journal tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                {t("All")}
                <Badge variant="outline" className="ml-2">
                  {tabCounts.all || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="incoming">
                {t("Incoming only")}
                <Badge variant="outline" className="ml-2">
                  {tabCounts.incoming || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="outgoing">
                {t("Outgoing only")}
                <Badge variant="outline" className="ml-2">
                  {tabCounts.outgoing || 0}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="incoming" className="mt-4">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base">{t("Incoming only")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <JournalTable
                    loading={loading}
                    rows={journal.filter((r) => (r.debit || 0) > 0)}
                    language={language}
                    decimalPrecision={decimalPrecision}
                    currencyEnglishName={currencyEnglishName}
                    currencyArabicName={currencyArabicName}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all" className="mt-4">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base">{t("All")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <JournalTable
                    loading={loading}
                    rows={journal}
                    language={language}
                    decimalPrecision={decimalPrecision}
                    currencyEnglishName={currencyEnglishName}
                    currencyArabicName={currencyArabicName}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="outgoing" className="mt-4">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base">{t("Outgoing only")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <JournalTable
                    loading={loading}
                    rows={journal.filter((r) => (r.credit || 0) > 0)}
                    language={language}
                    decimalPrecision={decimalPrecision}
                    currencyEnglishName={currencyEnglishName}
                    currencyArabicName={currencyArabicName}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}