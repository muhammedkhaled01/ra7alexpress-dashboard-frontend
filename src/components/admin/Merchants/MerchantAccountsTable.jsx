import React, {useCallback, useEffect, useMemo, useState} from "react";
import axiosMerchant from "@/axios";
import {useTranslation} from "react-i18next";
import {DollarSign, FileDown, Loader2, RefreshCw, Search} from "lucide-react";
import {formatCurrency, handleError, humanizeText} from "@/utils/helpers";
import {useSelector} from "react-redux";
import Select from "@/components/misc/Select";
import toast from "react-hot-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
    Select as ShadcnSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";
import Pagination from "@/components/Pagination";
import {StatBox} from "@/components/misc/StatBox";
import {Label} from "@/components/ui/label";
import moment from "@/utils/moment.js";

// استدعاء المكون المستقل
import { DateTimeRangePicker } from "@/components/misc/DateTimeRangePicker";
import { useLanguage } from "@/contexts/LanguageProvider";


export default function MerchantAccountsTable() {
    const {t} = useTranslation();
    const { language } = useLanguage();
    const { decimalPrecision, currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting);
    const authUser = useSelector(store => store.auth.user);
    const [isExporting, setIsExporting] = useState(false);
    const [data, setData] = useState({data: [], links: {}, meta: {}, totals: {}});
    const [isLoading, setIsLoading] = useState(true);
    const today = moment().format("YYYY-MM-DD");

    // تم إضافة from_time و to_time
    const [filters, setFilters] = useState({
        per_page: 8,
        search: "",
        from: today,
        to: today,
        from_time: '00:00', // جديد
        to_time: '23:59',   // جديد
        type: "All",
        page: 1,
        workspace_key: null,
        workspace_type: null,
    });

    const workspaceOptions = authUser?.workspaces?.map(ws => ({
        value: ws.id,
        label: `${ws.name} (${String(ws?.type).split('\\').pop()})`,
        type: `${ws?.type}`
    })) || [];

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {
                per_page: filters.per_page,
                search: filters.search,
                from: `${filters.from} ${filters.from_time}`,
                to: `${filters.to} ${filters.to_time}`,
                type: filters.type,
                page: filters.page,
                workspace_key: filters.workspace_key ? [filters.workspace_key] : undefined,
                workspace_type: filters.workspace_type ? [filters.workspace_type] : undefined,
            };

            const response = await axiosMerchant.get("/merchant_accounts", {params});
            setData(response.data);
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchData();
        }, 500); // Debounce search for 500ms
        return () => clearTimeout(handler);
    }, [filters, fetchData]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const params = {
                ...filters,
            };
            const response = await axiosMerchant.get("merchant_accounts/exportAll", {
                params,
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `merchant_accounts_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("File downloaded successfully!", { id: toastId });
        } catch (error) {
            handleError(error);
            toast.error("Failed to download file.", { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };
    const handleRefresh = () => {
        setFilters(prev => ({
            ...prev,
            search: "",
            type: "All",
            from: today,
            to: today,
            from_time: '00:00',
            to_time: '23:59',
            workspace_key: null,
            workspace_type: null,
            page: 1
        }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({...prev, [key]: value, page: 1}));
    };

    const handlePageChange = (page) => {
        setFilters(prev => ({...prev, page}));
    };

    const columns = useMemo(() => [
        {key: "merchant_name", label: t("Merchant Name")},
        {key: "date", label: t("Date")},
        {key: "reference", label: t("Reference")},
        {key: "type", label: t("Type")},
        {key: "description", label: t("Description")},
        {key: "amount", label: t("Amount")},
    ], [t]);

    const {totals} = data;

    return (
        <div className="p-4 flex flex-col gap-3">
            <PageTitle title={t("Merchant Accounts Management")}/>
            <div className="flex gap-x-2">
                <Button
                    variant="secondary"
                    onClick={() => handleExport()}
                    disabled={isLoading || isExporting}
                >
                    <FileDown className="w-4 h-4 mr-2" />
                    {isExporting ? <Loader2 className="animate-spin w-4 h-4" /> : t("Export")}
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatBox
                    label={t("Total COD Collected")}
                    value={formatCurrency(totals?.total_cod || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                    icon={<DollarSign className="h-6 w-6 text-emerald-500"/>}
                />
                <StatBox
                    label={t("Total Fees")}
                    value={formatCurrency(totals?.total_fees || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                    icon={<DollarSign className="h-6 w-6 text-rose-500"/>}
                />
                <StatBox
                    label={t("Total Settlements")}
                    value={formatCurrency(totals?.total_settlement || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                    icon={<DollarSign className="h-6 w-6 text-orange-500"/>}
                />
                <StatBox
                    label={t("Total Balance")}
                    value={formatCurrency(totals?.total_balance || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                    icon={<DollarSign className="h-6 w-6 text-gray-500"/>}
                />
            </div>

            <Card className="shadow-lg">
                <div className={"flex justify-between flex-col px-4 md:items-center md:flex-row gap-2"}>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">{t("All Transactions")}</CardTitle>
                    </CardHeader>
                    <Button onClick={handleRefresh} variant="refresh">
                        <RefreshCw className="w-4 h-4"/>
                    </Button>
                </div>
                <CardContent>
                    <div className="mb-6 flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px] md:flex-none">
                            <Label htmlFor="search">{t("Search by Merchant Name")}</Label>
                            <div className="relative w-full">
                                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    id="search"
                                    placeholder={t("Search by merchant name...")}
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange("search", e.target.value)}
                                    className="pl-8"
                                />
                                {filters.search && (
                                    <button
                                        onClick={() => handleFilterChange("search", "")}
                                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                                    >
                                        <RefreshCw className="h-4 w-4"/>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="type">{t("Workspace")}</Label>
                            <Select
                                value={filters.workspace_key ? {
                                    value: filters.workspace_key,
                                    label: workspaceOptions.find(ws => ws.value === filters.workspace_key)?.label
                                } : null}
                                onChange={(selected) => {
                                    handleFilterChange("workspace_key", selected?.value || null);
                                    handleFilterChange("workspace_type", selected?.type || null);
                                }}
                                options={workspaceOptions}
                                placeholder={t("Filter by workspace")}
                                className="w-full mt-1"
                                isClearable
                            />
                        </div>
                        <div className="w-full sm:w-[200px]">
                            <Label htmlFor="type">{t("Transaction Type")}</Label>
                            <ShadcnSelect
                                value={filters.type}
                                onValueChange={(value) => handleFilterChange("type", value)}
                            >
                                <SelectTrigger className="w-full mt-1">
                                    <SelectValue placeholder={t("All Types")}/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">{t("All")}</SelectItem>
                                    <SelectItem value="COD">{t("COD")}</SelectItem>
                                    <SelectItem value="Fee">{t("Fee")}</SelectItem>
                                    <SelectItem value="Settlement">{t("Settlement")}</SelectItem>
                                </SelectContent>
                            </ShadcnSelect>
                        </div>
                        {/* استبدال مدخلات التاريخ بـ DateTimeRangePicker */}
                        <div className={"flex flex-col input-container"}>
                            <Label htmlFor="date-range">{t("Date and Time Range")}</Label>
                            <DateTimeRangePicker
                                filters={filters}
                                onChange={handleFilterChange}
                                t={t}
                            />
                        </div>

                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center mt-16 h-40">
                            <Loader className="h-8 w-8 text-blue-500 animate-spin"/>
                        </div>
                    ) : data?.data?.length > 0 ? (
                        <>
                            <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50 dark:bg-gray-800">
                                            {columns.map((column) => (
                                                <TableHead key={column.key} className="text-nowrap">
                                                    {column.label}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.data.map((r, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{r.merchant_name}</TableCell>
                                                <TableCell>
                                                    {/* عرض التاريخ والوقت بدقة */}
                                                    {r.date ? moment(r.date).format('YYYY-MM-DD HH:mm') : 'N/A'}
                                                </TableCell>
                                                <TableCell>{r.reference || "-"}</TableCell>
                                                <TableCell className="capitalize">
                                                    {humanizeText(r.type)}
                                                </TableCell>
                                                <TableCell>{r.description || "-"}</TableCell>
                                                <TableCell
                                                    className={`text-right ${r.amount < 0 ? "text-rose-600" : "text-emerald-700"}`}
                                                >
                                                    {r.amount > 0 ? "+" : ""}
                                                    {formatCurrency(r.amount || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="mt-4">
                                <Pagination
                                    links={data.links}
                                    currentPage={data.meta.current_page}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        </>
                    ) : (
                        <NoRecordFound/>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}