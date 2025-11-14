import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import CreateFinancialRequestDialog from "./CreateFinancialRequestDialog";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Select from "@/components/misc/Select";
import Pagination from "@/components/Pagination";
import Loader from "@/components/Loader";
import NoRecordFound from "@/components/NoRecordFound";
import {Plus, CheckCircle, XCircle, Clock, BadgeCheck, RefreshCw} from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/utils/helpers";
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

function TypePill({ type }) {
    const { t } = useTranslation();
    const text =
        type === "merchant_settlement"
            ? t("Merchant Settlement")
            : type === "driver_salary"
                ? t("Driver Salary")
                : t("Branch Settlement");
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
            <BadgeCheck className="h-3.5 w-3.5" /> {text}
        </span>
    );
}

function RequestCard({ item }) {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const { decimalPrecision, currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting);
    const created = item.created_at
        ? new Date(item.created_at).toLocaleDateString()
        : "-";
    return (
        <div className="border rounded-xl p-4 bg-white flex items-center justify-between">
            <div>
                <div className="text-[#031d4e] font-extrabold text-lg">
                    {formatCurrency(item.amount, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{created}</div>
            </div>
            <div className="flex-1 px-3">
                <div className="flex items-center gap-2">
                    <TypePill type={item.type} />
                </div>
                <div className="text-sm mt-1 text-muted-foreground">
                    {item.payee_name ? item.payee_name : item.period || t("No payee")}
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground"> {item.code} </span>
                <StatusPill s={item.status} />
            </div>
        </div>
    );
}

export default function FinancialRequestsFacilityPage() {
    const { id } = useParams();
    const { t } = useTranslation();

    const TYPES = [
        { value: "merchant_settlement", label: t("Merchant Settlement") },
        { value: "driver_salary", label: t("Driver Salary") },
        { value: "branch_settlement", label: t("Branch Settlement") },
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
    const [dlgOpen, setDlgOpen] = useState(false);

    const [type, setType] = useState(null);
    const [payeeIds, setPayeeIds] = useState("");
    const [period, setPeriod] = useState("");
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");

    const parseList = (payload) => {
        if (Array.isArray(payload?.list?.data)) return payload.list?.data;
        if (Array.isArray(payload?.list)) return payload.list;
        return [];
    };

    const parseLinks = (payload) => {
        return payload?.list?.links || payload?.links || [];
    };

    const fetchList = async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                perPage: perPage,
                page: p,
            }).toString();
            const { data } = await axiosMerchant.get(`/financial-requests?${params}`);
            const payload = data?.data || {};
            setList(parseList(payload));
            setLinks(parseLinks(payload));
            setCounters(payload.counters || { pending: 0, approved: 0, rejected: 0 });
        } catch {
            toast.error(t("Failed to load data"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList(1);
    }, [perPage]);

    const handleCreate = async (e) => {
        try {
            const payload = {
                type: type?.value,
                payee_ids: Array.isArray(payeeIds)
                    ? payeeIds.map((opt) => opt.value)
                    : payeeIds || null,
                period_date: period || null,
                amount: Number(amount || 0),
                notes: notes || null,
            };
            await axiosMerchant.post("/financial-requests", payload);
            toast.success(t("Created successfully"));
            setDlgOpen(false);
            setType(null);
            setPayeeIds("");
            setPeriod("");
            setAmount("");
            setNotes("");
            fetchList(1);
        } catch {
            toast.error(t("Failed to create"));
        }
    };

    const handleRefresh = () => {
        fetchList()
    }
    return (
        <div className="space-y-4" dir="ltr">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">{t("Financial Requests")}</h1>
                <div className={"flex items-center gap-2"}>
                    <Button onClick={() => setDlgOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> {t("New Financial Request")}
                    </Button>
                    <Button onClick={handleRefresh} variant="refresh" title={t("Refresh")}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>
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
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t("Requests List")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loading ? (
                        <div className="py-10 flex justify-center">
                            <Loader />
                        </div>
                    ) : list?.length === 0 ? (
                        <NoRecordFound />
                    ) : (
                        <>
                            <div className="space-y-3">
                                {list?.map((r) => (
                                    <RequestCard key={r.id} item={r} />
                                ))}
                            </div>
                            {links?.length > 0 && (
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
            <CreateFinancialRequestDialog
                open={dlgOpen}
                onOpenChange={setDlgOpen}
                type={type}
                setType={setType}
                payeeIds={payeeIds}
                setPayeeIds={setPayeeIds}
                period={period}
                setPeriod={setPeriod}
                amount={amount}
                setAmount={setAmount}
                notes={notes}
                setNotes={setNotes}
                types={TYPES}
                onSubmit={handleCreate}
            />
        </div>
    );
}