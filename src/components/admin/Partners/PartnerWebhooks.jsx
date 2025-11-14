import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axiosMerchant from "@/axios";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "../../NoRecordFound";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
    RefreshCcw,
} from "lucide-react";
import Loader from "@/components/Loader";
import { can, handleError } from "@/utils/helpers";
import { Badge } from "@/components/ui/badge";
import Select from "@/components/misc/Select";

const PartnerWebhooks = () => {
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [webhooks, setWebhooks] = useState([]);
    const [search, setSearch] = useState("");
    const [refreshBtn, setRefreshBtn] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [partners, setPartners] = useState([]);
    const [selectedPartnerId, setSelectedPartnerId] = useState(null);

    const { t } = useTranslation();
    const accessAbility = can("Partner Dashboard access");

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const fetchPartners = useCallback(async () => {
        try {
            const response = await axiosMerchant.get("partners/all");
            if (response.data.data && Array.isArray(response.data.data)) {
                setPartners(response.data.data);
            }
        } catch (error) {
            handleError(error);
        }
    }, []);

    const fetchWebhooks = useCallback(
        async (pageNumber = 1) => {
            if (!accessAbility || !selectedPartnerId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await axiosMerchant.get(`partners/${selectedPartnerId}/webhooks`);
                if (response.data.data && Array.isArray(response.data.data)) {
                    let filteredWebhooks = response.data.data;
                    
                    // Apply search filter if provided
                    if (search && search.trim() !== "") {
                        const searchLower = search.toLowerCase();
                        filteredWebhooks = filteredWebhooks.filter(webhook => 
                            webhook.url?.toLowerCase().includes(searchLower) ||
                            webhook.id?.toString().includes(searchLower)
                        );
                    }
                    
                    // Client-side pagination
                    const totalItems = filteredWebhooks.length;
                    const startIndex = (pageNumber - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedWebhooks = filteredWebhooks.slice(startIndex, endIndex);
                    
                    setWebhooks(paginatedWebhooks);
                    
                    // Generate pagination links for client-side pagination
                    const totalPages = Math.ceil(totalItems / itemsPerPage);
                    const links = [];
                    
                    // First page
                    links.push({
                        url: pageNumber > 1 ? `?page=${pageNumber - 1}` : null,
                        label: "&laquo; Previous",
                        active: false
                    });
                    
                    // Page numbers
                    for (let i = 1; i <= totalPages; i++) {
                        links.push({
                            url: `?page=${i}`,
                            label: i.toString(),
                            active: i === pageNumber
                        });
                    }
                    
                    // Last page
                    links.push({
                        url: pageNumber < totalPages ? `?page=${pageNumber + 1}` : null,
                        label: "Next &raquo;",
                        active: false
                    });
                    
                    setLinks(links);
                } else {
                    setWebhooks([]);
                    setLinks([]);
                }
            } catch (error) {
                handleError(error);
                setWebhooks([]);
                setLinks([]);
            } finally {
                setLoading(false);
            }
        },
        [search, itemsPerPage, accessAbility, selectedPartnerId]
    );

    // Initial data fetch
    useEffect(() => {
        fetchPartners();
    }, [fetchPartners]);

    useEffect(() => {
        if (selectedPartnerId) {
            fetchWebhooks(currentPage);
        }
    }, [currentPage, fetchWebhooks, selectedPartnerId]);

    const handleSearch = useCallback(() => {
        setCurrentPage(1);
        setRefreshBtn(true);
        fetchWebhooks(1);
    }, [fetchWebhooks]);

    const handleRefresh = useCallback(() => {
        setSearch("");
        setRefreshBtn(false);
        setCurrentPage(1);
        fetchWebhooks(1);
    }, [fetchWebhooks]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.trim() !== "") {
                setRefreshBtn(true);
                handleSearch();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [search, handleSearch]);

    return (
        <div>
            <PageTitle title={t("Webhooks")} />
            <div className="flex flex-wrap gap-3 mt-2 justify-between">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                        {t("Select Partner")}:
                    </label>
                    <Select
                        value={partners.find(p => p.id === selectedPartnerId) 
                            ? { value: selectedPartnerId, label: partners.find(p => p.id === selectedPartnerId).name }
                            : null}
                        onChange={(selectedOption) => {
                            setSelectedPartnerId(selectedOption ? selectedOption.value : null);
                            setCurrentPage(1);
                        }}
                        options={partners.map(partner => ({
                            value: partner.id,
                            label: partner.name
                        }))}
                        placeholder={t("Select Partner...")}
                        className="w-64"
                        isSearchable={true}
                    />
                </div>
                {selectedPartnerId && (
                    <div className="flex flex-wrap gap-2 items-center">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSearch();
                            }}
                            className="flex flex-wrap gap-2 items-center"
                        >
                            <div className="flex gap-x-2">
                                <Input
                                    name="search"
                                    type="text"
                                    className="w-[200px]"
                                    value={search}
                                    placeholder={t("Search...")}
                                    onChange={(e) => setSearch(e.target.value)}
                                    icon={
                                        refreshBtn && (
                                            <RefreshCcw
                                                className="w-4 h-4 cursor-pointer"
                                                onClick={handleRefresh}
                                            />
                                        )
                                    }
                                />
                                <Button type="button" variant="refresh" onClick={handleRefresh}>
                                    <RefreshCcw className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex items-center space-x-2">
                                <label className="text-sm text-gray-600 dark:text-gray-300">
                                    {t("Show")}
                                </label>
                                <Select
                                    value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
                                    onChange={(selectedOption) => {
                                        setItemsPerPage(Number(selectedOption.value));
                                        setCurrentPage(1);
                                    }}
                                    options={[
                                        { value: 5, label: '5' },
                                        { value: 8, label: '8' },
                                        { value: 15, label: '15' },
                                        { value: 25, label: '25' },
                                        { value: 50, label: '50' },
                                        { value: 100, label: '100' }
                                    ]}
                                    className="w-20 text-sm"
                                    isSearchable={false}
                                />
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {selectedPartnerId ? (
                <div className="shadow-md py-4 mt-2 rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("ID")}</TableHead>
                                <TableHead>{t("URL")}</TableHead>
                                <TableHead>{t("Events")}</TableHead>
                                <TableHead>{t("Status")}</TableHead>
                                <TableHead>{t("Last Success")}</TableHead>
                                <TableHead>{t("Failure Count")}</TableHead>
                                <TableHead>{t("Created At")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">
                                        <Loader />
                                    </TableCell>
                                </TableRow>
                            ) : webhooks && webhooks.length > 0 ? (
                                webhooks.map((webhook, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {webhook.id}
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-xs truncate" title={webhook.url}>
                                                {webhook.url || t("N/A")}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {webhook.events && webhook.events.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {webhook.events.slice(0, 2).map((event, idx) => (
                                                        <Badge key={idx} variant="outline" className="text-xs">
                                                            {event}
                                                        </Badge>
                                                    ))}
                                                    {webhook.events.length > 2 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{webhook.events.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">{t("N/A")}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={webhook.is_active ? "default" : "secondary"}>
                                                {webhook.is_active ? t("Active") : t("Inactive")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {webhook.last_success_at 
                                                ? new Date(webhook.last_success_at).toLocaleString()
                                                : <span className="text-gray-400">{t("Never")}</span>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {webhook.failure_count || 0}
                                        </TableCell>
                                        <TableCell>
                                            {webhook.created_at 
                                                ? new Date(webhook.created_at).toLocaleString()
                                                : t("N/A")
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">
                                        <NoRecordFound />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    {links.length > 1 && (
                        <Pagination
                            links={links}
                            currentPage={currentPage}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            ) : (
                <div className="shadow-md py-8 mt-2 rounded-lg text-center text-gray-500">
                    {t("Please select a partner to view webhooks")}
                </div>
            )}
        </div>
    );
};

export default PartnerWebhooks;

