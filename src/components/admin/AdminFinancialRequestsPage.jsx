import React, { useEffect, useMemo, useState } from "react";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";
import Pagination from "@/components/Pagination";
import Loader from "@/components/Loader";
import NoRecordFound from "@/components/NoRecordFound";
import { CheckCircle, XCircle, Clock, Search, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/utils/helpers";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageProvider";
import {useSelector} from "react-redux";

function StatusPill({ s }) {
    const { t } = useTranslation();
    const map = {
        pending: {
            text: t("Pending Review"),
            className: "bg-amber-100 text-amber-700",
            icon: <Clock className="h-4 w-4" />,
        },
        approved: {
            text: t("Approved"),
            className: "bg-emerald-100 text-emerald-700",
            icon: <CheckCircle className="h-4 w-4" />,
        },
        rejected: {
            text: t("Rejected"),
            className: "bg-rose-100 text-rose-700",
            icon: <XCircle className="h-4 w-4" />,
        },
    };
    const it = map[s] || map.pending;
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${it.className}`}
        >
            {it.icon}
            {it.text}
        </span>
    );
}

export default function AdminFinancialRequestsPage() {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const { decimalPrecision, currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting);

    const TYPE_OPTIONS = [
        { value: "", label: t("All Types") },
        { value: "merchant_settlement", label: t("Merchant Settlement") },
        { value: "driver_salary", label: t("Driver Salary") },
        { value: "branch_settlement", label: t("Branch Settlement") },
    ];

    const STATUS_OPTIONS = [
        { value: "", label: t("All Statuses") },
        { value: "pending", label: t("Pending Review") },
        { value: "approved", label: t("Approved") },
        { value: "rejected", label: t("Rejected") },
    ];

    const [loading, setLoading] = useState(true);
    const [list, setList] = useState([]);
    const [links, setLinks] = useState([]);
    const [counters, setCounters] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
    });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const [status, setStatus] = useState("");
    const [type, setType] = useState("");
    const [q, setQ] = useState("");

    const [selected, setSelected] = useState(new Set()); // IDs for bulk actions
    const [viewItem, setViewItem] = useState(null); // dialog for details

    const parseList = (payload) => {
        if (Array.isArray(payload?.list?.data)) return payload.list.data;
        if (Array.isArray(payload?.list)) return payload.list;
        return [];
    };
    const parseLinks = (payload) => payload?.list?.links || payload?.links || [];

    const fetchList = async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                perPage: perPage,
                page: p,
                ...(status ? { status } : {}),
                ...(type ? { type } : {}),
                ...(q ? { q } : {}),
            }).toString();
            const { data } = await axiosMerchant.get(`/financial-requests?${params}`);
            const payload = data?.data || {};
            setList(parseList(payload));
            setLinks(parseLinks(payload));
            setCounters(payload.counters || { pending: 0, approved: 0, rejected: 0 });
            setSelected(new Set());
        } catch {
            toast.error(t("Failed to load data"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList(1);
    }, [perPage, status, type]);

    const approve = async (id) => {
        try {
            await axiosMerchant.patch(`/financial-requests/${id}/approve`);
            toast.success(t("Approved"));
            fetchList(page);
        } catch {
            toast.error(t("Failed to approve"));
        }
    };

    const reject = async (id) => {
        try {
            await axiosMerchant.patch(`/financial-requests/${id}/reject`);
            toast.success(t("Rejected"));
            fetchList(page);
        } catch {
            toast.error(t("Failed to reject"));
        }
    };

    const bulkApprove = async () => {
        if (selected.size === 0) return;
        await Promise.all(
            [...selected].map((id) =>
                axiosMerchant.patch(`/financial-requests/${id}/approve`).catch(() => null)
            )
        );
        toast.success(t("Selected approved"));
        fetchList(page);
    };

    const bulkReject = async () => {
        if (selected.size === 0) return;
        await Promise.all(
            [...selected].map((id) =>
                axiosMerchant.patch(`/financial-requests/${id}/reject`).catch(() => null)
            )
        );
        toast.success(t("Selected rejected"));
        fetchList(page);
    };

    const toggleSelect = (id) =>
        setSelected((prev) => {
            const c = new Set(prev);
            c.has(id) ? c.delete(id) : c.add(id);
            return c;
        });

    return (
        <div className="space-y-4" dir="ltr">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">
                    {t("Financial Requests (Admin Panel)")}
                </h1>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Input
                            placeholder={t("Search by code/name/note")}
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && fetchList(1)}
                            className="pr-8 w-64"
                        />
                        <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                    <Select
                        value={TYPE_OPTIONS.find((o) => o.value === type)}
                        onChange={(v) => setType(v?.value ?? "")}
                        options={TYPE_OPTIONS}
                        className="w-44"
                    />
                    <Select
                        value={STATUS_OPTIONS.find((o) => o.value === status)}
                        onChange={(v) => setStatus(v?.value ?? "")}
                        options={STATUS_OPTIONS}
                        className="w-40"
                    />
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setQ("");
                            setType("");
                            setStatus("");
                            fetchList(1);
                        }}
                    >
                        {t("Default Filter")}
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card>
                    <CardContent className="py-5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-600">
                            <Clock className="h-5 w-5" />
                            <span>{t("Pending Review")}</span>
                        </div>
                        <span className="font-semibold">{counters.pending}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle className="h-5 w-5" />
                            <span>{t("Approved")}</span>
                        </div>
                        <span className="font-semibold">{counters.approved}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-rose-600">
                            <XCircle className="h-5 w-5" />
                            <span>{t("Rejected")}</span>
                        </div>
                        <span className="font-semibold">{counters.rejected}</span>
                    </CardContent>
                </Card>
            </div>

            {/* bulk actions */}
            <div className="flex items-center gap-2">
                <Button size="sm" onClick={bulkApprove} disabled={selected.size === 0}>
                    {t("Approve Selected")}
                </Button>
                <Button
                    size="sm"
                    variant="destructive"
                    onClick={bulkReject}
                    disabled={selected.size === 0}
                >
                    {t("Reject Selected")}
                </Button>
                <span className="text-xs text-muted-foreground">
                    {t("({0} selected)", [selected.size])}
                </span>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t("Requests List")}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-10 flex justify-center">
                            <Loader />
                        </div>
                    ) : list.length === 0 ? (
                        <NoRecordFound />
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-left w-12">{t("Select")}</TableHead>
                                        <TableHead className="text-left">{t("Amount")}</TableHead>
                                        <TableHead className="text-left">{t("Type")}</TableHead>
                                        <TableHead className="text-left">{t("Payee")}</TableHead>
                                        <TableHead className="text-left">{t("Period")}</TableHead>
                                        <TableHead className="text-left">{t("Code")}</TableHead>
                                        <TableHead className="text-left">{t("Status")}</TableHead>
                                        <TableHead className="text-left w-40">{t("Action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {list.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(r.id)}
                                                    onChange={() => toggleSelect(r.id)}
                                                />
                                            </TableCell>
                                            <TableCell className="text-left font-semibold">
                                                {formatCurrency(r.amount, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                                            </TableCell>
                                            <TableCell className="text-left">
                                                {r.type === "merchant_settlement"
                                                    ? t("Merchant Settlement")
                                                    : r.type === "driver_salary"
                                                        ? t("Driver Salary")
                                                        : t("Branch Settlement")}
                                            </TableCell>
                                            <TableCell className="text-left">
                                                {r.payee_name || "-"}
                                            </TableCell>
                                            <TableCell className="text-left">
                                                {r.period || "-"}
                                            </TableCell>
                                            <TableCell className="text-left">{r.code}</TableCell>
                                            <TableCell className="text-left">
                                                <StatusPill s={r.status} />
                                            </TableCell>
                                            <TableCell className="text-left">
                                                <div className="flex gap-2 justify-start">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setViewItem(r)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" /> {t("Details")}
                                                    </Button>
                                                    {r.status === "pending" ? (
                                                        <>
                                                            <Button size="sm" onClick={() => approve(r.id)}>
                                                                {t("Approve")}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => reject(r.id)}
                                                            >
                                                                {t("Reject")}
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">
                                                            —
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {links.length > 0 && (
                                <div className="mt-4">
                                    <Pagination
                                        links={links}
                                        currentPage={page}
                                        onPageChange={(p) => {
                                            setPage(p);
                                            fetchList(p);
                                        }}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Details dialog */}
            <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{t("Request Details")}</DialogTitle>
                    </DialogHeader>
                    {viewItem && (
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("Code")}</span>
                                <span>{viewItem.code}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("Type")}</span>
                                <span>
                                    {viewItem.type === "merchant_settlement"
                                        ? t("Merchant Settlement")
                                        : viewItem.type === "driver_salary"
                                            ? t("Driver Salary")
                                            : t("Branch Settlement")}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("Payee")}</span>
                                <span>{viewItem.payee_name || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("Period")}</span>
                                <span>{viewItem.period || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("Amount")}</span>
                                <span>{formatCurrency(viewItem.amount, language, decimalPrecision, currencyEnglishName, currencyArabicName)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("Status")}</span>
                                <span>
                                    <StatusPill s={viewItem.status} />
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-1">
                                    {t("Notes")}
                                </span>
                                <div className="text-sm whitespace-pre-wrap">
                                    {viewItem.notes || "-"}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}