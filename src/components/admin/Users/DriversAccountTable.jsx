import React, { useEffect, useMemo, useState } from "react";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import { DollarSign, FileDown, Loader2, RefreshCw, Search } from "lucide-react";
import { formatCurrency, handleError, humanizeText, can } from "@/utils/helpers";
import { useSelector } from "react-redux";
import Select from "@/components/misc/Select";

// Components
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";
import Pagination from "@/components/Pagination";
import { StatBox } from "@/components/misc/StatBox";
import { Label } from "@/components/ui/label";
import moment from "@/utils/moment.js";
import { toast } from "react-hot-toast";
import { DateTimeRangePicker } from "@/components/misc/DateTimeRangePicker.jsx";
import { useLanguage } from "@/contexts/LanguageProvider";

export default function DriversAccountTable() {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const { decimalPrecision, currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting);
    const authUser = useSelector(store => store.auth.user);
    
    // Permission checks
    const accessAbility = can("Driver Account access");
    const exportAbility = can("Driver Account export");
    const [data, setData] = useState({ data: [], links: {}, meta: {} }); // Removed 'totals' from initial state
    const [isLoading, setIsLoading] = useState(true);
    const today = moment().format("YYYY-MM-DD");
    const [isExporting, setIsExporting] = useState(false);
    const [filters, setFilters] = useState({
        per_page: 8,
        search: "",
        from: today,
        to: today,
        from_time: '00:00',
        to_time: '23:59',
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

    const transactionTypeOptions = [
        { value: "All", label: t("All") },
        { value: "assignment", label: t("Assignment") },
        { value: "deposit", label: t("Deposit") },
        { value: "bonus_credit", label: t("Bonus credit") },
    ];

    const fetchData = async () => {
        if (!accessAbility) {
            setIsLoading(false);
            return;
        }
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

            const response = await axiosMerchant.get("/driver-accounts", { params });
            // Assuming response.data now contains { data: [...driverAccounts], links: {...}, meta: {...} }
            setData(response.data);
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const params = {
                search: filters.search,
                from: filters.from,
                to: filters.to,
                type: filters.type,
                workspace_key: filters.workspace_key ? [filters.workspace_key] : undefined,
                workspace_type: filters.workspace_type ? [filters.workspace_type] : undefined,
            };

            const response = await axiosMerchant.get(`/driver-accounts/exportAll`, {
                responseType: 'blob',
                params: params,
            });

            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'driver_accounts.xlsx';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length === 2) {
                    fileName = fileNameMatch[1];
                }
            }

            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("File downloaded successfully.");
        } catch (error) {
            handleError(error);
            toast.error("Failed to download file.");
        } finally {
            setIsExporting(false);
        }
    };
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(handler);
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (page) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const columns = useMemo(() => [
        { key: "driver_name", label: t("Driver Name") },
        { key: "date", label: t("Date") },
        { key: "reference", label: t("Reference") },
        { key: "type", label: t("Type") },
        { key: "description", label: t("Delivery Fee") },
        { key: "amount", label: t("Amount") },
    ], [t]);

    // New useMemo for table rows
    const tableRows = useMemo(() => {
        if (!data?.data || data?.data?.length === 0) {
            return [];
        }
        let rows = [];
        data?.data?.forEach(driverAccount => {
            const driverName = driverAccount.driver?.name || 'N/A';
            driverAccount.transactions.forEach(transaction => {
                rows.push({
                    driver_name: driverName,
                    date: transaction.created_at,
                    reference: transaction.reference,
                    type: transaction.type,
                    description: transaction.description,
                    amount: transaction.amount,
                });
            });
        });
        return rows;
    }, [data?.data]);

    // New useMemo for calculated totals
    const calculatedTotals = useMemo(() => {
        if (!data?.data || data?.data?.length === 0) {
            return {
                total_balance: 0,
                total_cod: 0,
                total_fees: 0,
                total_deposits: 0,
                total_bonus_due: 0,
                total_current_balance: 0,
            };
        }

        let total_balance = 0;
        let total_cod = 0;
        let total_fees = 0;
        let total_deposits = 0;
        let total_bonus_due = 0;
        let total_current_balance = 0;
        data?.data?.forEach(driverAccount => {
            if (driverAccount.summary) {
                total_balance += driverAccount.summary.current_balance || 0;
                total_cod += driverAccount.summary.total_cod || 0;
                total_deposits += driverAccount.summary.total_deposit || 0;
                total_fees += driverAccount.summary.total_fees || 0;
                total_bonus_due += driverAccount.summary.bonus_due || 0;
                total_current_balance += driverAccount.summary.current_balance || 0;
            }
        });
        return { total_balance, total_cod, total_fees, total_deposits, total_bonus_due, total_current_balance };
    }, [data?.data]);

    // const { totals } = data; // This line is no longer needed

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
    }
    return (
        <div className="p-4">
            <CardTitle className="flex items-center gap-x-2">
                <DollarSign className="w-6 h-6" />
                <span>{t("Transactions")}</span>
            </CardTitle>
            <div className="flex gap-x-2">
                {exportAbility && (
                    <Button
                        variant="secondary"
                        onClick={() => handleExport()}
                        disabled={isLoading || isExporting}
                    >
                        <FileDown className="w-4 h-4 mr-2" />
                        {isExporting ? <Loader2 className="animate-spin w-4 h-4" /> : t("Export")}
                    </Button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mt-4 gap-4 mb-6">
                <StatBox
                    label={t("Total COD Collected")}
                    value={formatCurrency(calculatedTotals.total_cod || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                    icon={<DollarSign className="h-6 w-6 text-emerald-500" />}
                />
                <StatBox
                    label={t("Total Deposits")}
                    value={formatCurrency(calculatedTotals.total_deposits || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                    icon={<DollarSign className="h-6 w-6 text-orange-500" />}
                />
                <StatBox
                    label={t("Total Bonuses Earned")}
                    value={formatCurrency(calculatedTotals.total_bonus_due || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                />
                <StatBox
                    label={t("Current Balance (COD Due)")}
                    value={formatCurrency(calculatedTotals.total_current_balance || 0, language, decimalPrecision, currencyEnglishName, currencyArabicName)}
                />
            </div>

            <Card className="shadow-lg">
                <div className={"flex justify-between flex-col px-4 md:items-center md:flex-row gap-2"}>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">{t("All Driver Transactions")}</CardTitle>
                    </CardHeader>
                    <Button onClick={handleRefresh} variant="refresh">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
                <CardContent>
                    <div className="mb-6 flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px] md:flex-none">
                            <Label htmlFor="search">{t("Search by Driver Name")}</Label>
                            <Input
                                id="search"
                                placeholder={t("Search...")}
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        {/* Filter by Workspace */}
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
                            <Select
                                value={filters.type ? {
                                    value: filters.type,
                                    label: transactionTypeOptions.find(opt => opt.value === filters.type)?.label
                                } : null}
                                onChange={(selected) => handleFilterChange("type", selected?.value || "All")}
                                options={transactionTypeOptions}
                                placeholder={t("transaction type")}
                                className="w-full mt-1"
                                isClearable
                            />
                        </div>
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
                            <Loader className="h-8 w-8 text-blue-500 animate-spin" />
                        </div>
                    ) : tableRows.length > 0 ? ( // Changed condition here
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
                                        {tableRows.map((r, index) => {
                                            const d = r.date ? new Date(r.date) : null;
                                            const dateStr = d ? d.toLocaleDateString() : "-";
                                            const timeStr = d
                                                ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                                : "-";
                                            return (
                                                <TableRow key={index}>
                                                    <TableCell>{r.driver_name}</TableCell>
                                                    <TableCell>{`${dateStr} - ${timeStr}`}</TableCell>
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
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="mt-4">
                                <Pagination
                                    links={data?.links || []}
                                    currentPage={data?.meta.current_page}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        </>
                    ) : (
                        <NoRecordFound />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
