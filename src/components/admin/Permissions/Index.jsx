import axiosMerchant from "@/axios";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "../../NoRecordFound";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import { Download, RefreshCcw } from "lucide-react";
import Loader from "@/components/Loader";
import { useTranslation } from "react-i18next";
import Select from "@/components/misc/Select";
import { can, handleError } from "@/utils/helpers";
import ExportDialog from "@/components/misc/ExportDialog";
import { useNavigate } from "react-router-dom";

const PermissionIndex = () => {
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [permissions, setPermissions] = useState([]);
    const [search, setSearch] = useState("");
    const [refreshBtn, setRefreshBtn] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const { t } = useTranslation();
    const navigate = useNavigate();

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const fetchPermissions = useCallback(async (page, perPage, query = "") => {
        setLoading(true);
        try {
            const response = await axiosMerchant.get(`permissions`, {
                params: {
                    page: page,
                    per_page: perPage,
                    query: query || undefined,
                },
            });
            setLinks(response.data.data.links || []);
            setPermissions(response.data.data.data || []);
        } catch (error) {
            handleError(error);
            setPermissions([]);
            setLinks([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPermissions(currentPage, itemsPerPage, search);
        }, 500);

        return () => clearTimeout(timer);
    }, [currentPage, itemsPerPage, search, fetchPermissions]);

    useEffect(() => {
        setRefreshBtn(search.trim() !== "");
    }, [search]);

    const handleRefresh = () => {
        if(search === ""){
            fetchPermissions(1, 8, "");
            return;
        }
        setSearch("");
        setCurrentPage(1);
        setItemsPerPage(8);
    };

    const canAccess = can("Permission access");
    const exportAbility = can("Permission export");
    if (!canAccess) {
        return navigate("/unauthorized");
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0">
                <PageTitle title={t("Permissions")} />
                <div className="flex flex-wrap gap-3 mt-2">
                    <form className="flex md:items-center flex-col md:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
                        <div className="flex gap-x-2">
                            <Input
                                name="search"
                                type="text"
                                className="w-[200px]"
                                value={search}
                                placeholder={t("Search by name...")}
                                onChange={(e) => setSearch(e.target.value)}
                                icon={
                                    refreshBtn && (
                                        <RefreshCcw className="w-4 h-4 cursor-pointer" onClick={handleRefresh} />
                                    )
                                }
                            />
                            <Button type="button" variant="refresh" onClick={handleRefresh}>
                                <RefreshCcw className="w-4 h-4" />
                            </Button>
                            {exportAbility && (
                                <Button variant="download" type="button" onClick={e => setShowExport(true)}>
                                    <Download />
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-600 dark:text-gray-300">
                                {t("Show")}
                            </label>
                            <Select
                                value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
                                onChange={(selectedOption) => {
                                    setItemsPerPage(Number(selectedOption.value));
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
            <div className="shadow-md py-4 mt-2 rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">#</TableHead>
                            <TableHead className="min-w-[200px]">{t("Name")}</TableHead>
                            <TableHead className="min-w-[100px]">{t("Guard")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center">
                                    <Loader />
                                </TableCell>
                            </TableRow>
                        ) : permissions && permissions.length > 0 ? (
                            permissions.map((permission, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>{permission.name}</TableCell>
                                    <TableCell>{permission.guard_name}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center">
                                    <NoRecordFound />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <Pagination
                    links={links}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                />
            </div>

            {showExport && (
                <ExportDialog
                    model="permissions"
                    endpoint="permissions/export"
                    fields={[
                        { key: "id", label: "ID" },
                        { key: "name", label: "Name" },
                        { key: "created_at", label: "Created At" },
                        { key: "updated_at", label: "Updated At" },
                    ]}
                    onClose={() => setShowExport(false)}
                />
            )}
        </div>
    );
};

export default PermissionIndex;