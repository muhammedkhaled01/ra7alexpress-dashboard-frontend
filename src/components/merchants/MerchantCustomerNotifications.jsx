import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";
import PageTitle from "../admin/Layouts/PageTitle";
import NoRecordFound from "../NoRecordFound";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import Pagination from "@/components/Pagination";
import { handleError, humanizeText } from "@/utils/helpers";
import Loader from "../Loader";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { getMerchantConsignees } from "@/stores/features/ajaxFeature";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcw, Search as SearchIcon } from "lucide-react";
import Select from "@/components/misc/Select";

const MerchantCustomerNotifications = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [notifications, setNotifications] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        from: "",
        to: "",
        customer: "",
        search: ""
    });

    // Consignee options
    const merchantConsignees = useSelector((state) => state.ajax.merchantConsignees);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!merchantConsignees) dispatch(getMerchantConsignees());
    }, []);

    useEffect(() => {
        fetchNotifications(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, filters]);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1);
    };

    const handleRefresh = () => {
        setFilters({
            from: "",
            to: "",
            customer: "",
            search: ""
        });
        setCurrentPage(1);
        fetchNotifications(1);
    };

    const fetchNotifications = async (pageNumber = 1) => {
        setLoading(true);
        try {
            const params = { ...filters };
            const response = await axiosMerchant.get(`merchant/notifications/customers?page=${pageNumber}`, { params });
            setLinks(response.data.data.links);
            setNotifications(response.data.data.data);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <PageTitle title={t("Notifications")} />

            {/* Filters */}
            <Card className="mb-6 mt-4">
                <CardHeader>
                    <CardTitle>{t("Filter Notifications")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        {/* Date From */}
                        <div className="input-container">
                            <Label>{t("Date From")}</Label>
                            <Input
                                type="date"
                                value={filters.from}
                                onChange={(e) => handleFilterChange("from", e.target.value)}
                            />
                        </div>

                        {/* Date To */}
                        <div className="input-container">
                            <Label>{t("Date To")}</Label>
                            <Input
                                type="date"
                                value={filters.to}
                                onChange={(e) => handleFilterChange("to", e.target.value)}
                            />
                        </div>

                        {/* Customer Filter */}
                        <div className="input-container">
                            <Label>{t("Customer")}</Label>
                            <Select
                                options={
                                    merchantConsignees?.map((c) => ({ value: c.id, label: c.name })) || []
                                }
                                value={
                                    merchantConsignees?.map((c) => ({ value: c.id, label: c.name }))
                                        .find((o) => o.value === filters.customer) || null
                                }
                                onChange={(selected) => handleFilterChange("customer", selected ? selected.value : "")}
                                placeholder={t("Select Customer")}
                                isClearable={true}
                            />
                        </div>


                        {/* Search */}
                        <div className="input-container">
                            <Label>{t("Search")}</Label>
                            <Input
                                placeholder={t("Search Notifications...")}
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                icon={<SearchIcon className="w-4 h-4" />}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4 md:mt-0">
                            <Button
                                variant="refresh"
                                onClick={handleRefresh}
                                title={t("Reset Filters")}
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <div className="shadow-md mt-2 rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">#</TableHead>
                                    <TableHead>{t("Title")}</TableHead>
                                    <TableHead>{t("Content")}</TableHead>
                                    <TableHead>{t("Type")}</TableHead>
                                    <TableHead>{t("Date / Time")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center">
                                            <Loader />
                                        </TableCell>
                                    </TableRow>
                                ) : notifications && notifications.length > 0 ? (
                                    notifications.map((notification, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell>{notification.title}</TableCell>
                                            <TableCell>{notification.content}</TableCell>
                                            <TableCell>{humanizeText(notification.type)}</TableCell>
                                            <TableCell>{new Date(notification.created_at).toLocaleString()}</TableCell>
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
                </CardContent>
            </Card>
        </div>
    );
}

export default MerchantCustomerNotifications