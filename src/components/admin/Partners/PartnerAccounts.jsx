import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
    Eye,
    Key,
} from "lucide-react";
import Loader from "@/components/Loader";
import { can, handleError } from "@/utils/helpers";
import { Badge } from "@/components/ui/badge";
import Select from "@/components/misc/Select";
import Create from "./PartnerCreate";
import PartnerKeysModal from "./PartnerKeysModal";
import PartnerScopesModal from "./PartnerScopesModal";

const PartnerAccounts = () => {
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [accounts, setAccounts] = useState([]);
    const [search, setSearch] = useState("");
    const [refreshBtn, setRefreshBtn] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [keysModalOpen, setKeysModalOpen] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [scopesModalOpen, setScopesModalOpen] = useState(false);

    const navigate = useNavigate();
    const { t } = useTranslation();
    const accessAbility = can("Partner Dashboard access");
    const createAbility = can("Partner create");

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const fetchAccounts = useCallback(
        async (pageNumber = 1) => {
            if (!accessAbility) {
                navigate("/unauthorized");
                return;
            }

            setLoading(true);
            try {
                const response = await axiosMerchant.get("partners/all");
                console.log('-------------------------------------------');
                console.log(response.data);
                console.log('-------------------------------------------');
                if (response.data.data && Array.isArray(response.data.data)) {
                    let filteredAccounts = response.data.data;
                    
                    // Apply search filter if provided
                    if (search && search.trim() !== "") {
                        const searchLower = search.toLowerCase();
                        filteredAccounts = filteredAccounts.filter(account => 
                            account.name?.toLowerCase().includes(searchLower) ||
                            account.contact_email?.toLowerCase().includes(searchLower) ||
                            account.id?.toString().includes(searchLower)
                        );
                    }
                    
                    // Client-side pagination
                    const totalItems = filteredAccounts.length;
                    const startIndex = (pageNumber - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);
                    
                    setAccounts(paginatedAccounts);
                    
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
                    setAccounts([]);
                    setLinks([]);
                }
            } catch (error) {
                handleError(error);
                setAccounts([]);
                setLinks([]);
            } finally {
                setLoading(false);
            }
        },
        [search, itemsPerPage, accessAbility, navigate]
    );

    // Initial data fetch
    useEffect(() => {
        fetchAccounts(currentPage);
    }, [currentPage, fetchAccounts]);

    const handleSearch = useCallback(() => {
        setCurrentPage(1);
        setRefreshBtn(true);
        fetchAccounts(1);
    }, [fetchAccounts]);

    const handleRefresh = useCallback(() => {
        setSearch("");
        setRefreshBtn(false);
        setCurrentPage(1);
        fetchAccounts(1);
    }, [fetchAccounts]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.trim() !== "") {
                setRefreshBtn(true);
                handleSearch();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [search, handleSearch]);

    const handleView = (account) => {
        navigate(`/partners/view/${account.id}`);
    };

    const handleViewKeys = (account) => {
        setSelectedPartner({ id: account.id, name: account.name });
        setKeysModalOpen(true);
    };
    const handleEditScopes = (account) => {
        setSelectedPartner({ id: account.id, name: account.name, allowed_scopes: account.allowed_scopes || [] });
        setScopesModalOpen(true);
    };

    const handleSubmitSuccess = () => {
        fetchAccounts(currentPage);
    };

    return (
        <div>
            <PageTitle title={t("Accounts")} />
            <div className="flex flex-wrap gap-3 mt-2 justify-between">
                <div>
                    {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
                </div>
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
            </div>

            <div className="shadow-md py-4 mt-2 rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("ID")}</TableHead>
                            <TableHead>{t("Name")}</TableHead>
                            <TableHead>{t("Contact Email")}</TableHead>
                            <TableHead>{t("Status")}</TableHead>
                            <TableHead>{t("Allowed Scopes")}</TableHead>
                            <TableHead>{t("Rate Limit")}</TableHead>
                            <TableHead>{t("Actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">
                                    <Loader />
                                </TableCell>
                            </TableRow>
                        ) : accounts && accounts.length > 0 ? (
                            accounts.map((account, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        {account.id}
                                    </TableCell>
                                    <TableCell>
                                        {account.name || t("N/A")}
                                    </TableCell>
                                    <TableCell>
                                        {account.contact_email || t("N/A")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={account.is_active ? "default" : "secondary"}>
                                            {account.is_active ? t("Active") : t("Inactive")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {account.allowed_scopes && account.allowed_scopes.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {account.allowed_scopes.slice(0, 2).map((scope, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-xs">
                                                        {scope}
                                                    </Badge>
                                                ))}
                                                {account.allowed_scopes.length > 2 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{account.allowed_scopes.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">{t("N/A")}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {account.rate_limit ? (
                                            <div className="text-sm">
                                                <div>{account.rate_limit.requests_per_hour || 0} {t("per hour")}</div>
                                                <div className="text-gray-500">{account.rate_limit.requests_per_minute || 0} {t("per minute")}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">{t("N/A")}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                        {accessAbility && (
                                            <Button
                                                onClick={() => handleView(account)}
                                                variant="secondary"
                                                size="xs"
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                {t("View")}
                                            </Button>
                                        )}
                                            <Button
                                                onClick={() => handleEditScopes(account)}
                                                variant="secondary"
                                                size="xs"
                                            >
                                                {t("Edit Scopes")}
                                            </Button>
                                            <Button
                                                onClick={() => handleViewKeys(account)}
                                                variant="outline"
                                                size="xs"
                                            >
                                                <Key className="w-4 h-4 mr-1" />
                                                {t("View Key")}
                                            </Button>
                                        </div>
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
            {selectedPartner && (
                <PartnerKeysModal
                    partnerId={selectedPartner.id}
                    partnerName={selectedPartner.name}
                    open={keysModalOpen}
                    onOpenChange={setKeysModalOpen}
                />
            )}
            {selectedPartner && (
                <PartnerScopesModal
                    partner={selectedPartner}
                    open={scopesModalOpen}
                    onOpenChange={(open) => {
                        setScopesModalOpen(open);
                        if (!open) {
                            // refresh list after closing in case of changes
                            fetchAccounts(currentPage);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default PartnerAccounts;

