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
import Select from "@/components/misc/Select";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import {
    DollarSign,
    EditIcon,
    MoreHorizontal,
    Pencil,
    RefreshCcw,
    Scale,
    Sheet,
    Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import {
    can,
    getOwner,
    getOwnership,
    handleError,
    hasRole,
} from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import ShipperSettings from "./ShipperSettings";

const ShipperIndex = () => {
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [shippers, setShippers] = useState([]);
    const [search, setSearch] = useState("");
    const [refreshBtn, setRefreshBtn] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const [selectedRecord, setselectedRecord] = useState(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);

    const navigate = useNavigate();
    const { t } = useTranslation();

    const accessAbility = can("Shipper access");
    const createAbility = can("Shipper create");
    const updateAbility = can("Shipper update");
    const deleteAbility = can("Shipper delete");

    const isSuperAdmin = hasRole("Super Admin");

    const openDeleteAlert = (record) => {
        setselectedRecord(record);
        setDeleteAlert(true);
    };

    const closeDeleteAlert = () => {
        setselectedRecord(null);
        setDeleteAlert(false);
    };

    const openEditDialog = (record) => {
        setselectedRecord(record);
        setEditDialogOpen(true);
    };

    const closeEditDialog = () => {
        setselectedRecord(null);
        setEditDialogOpen(false);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const fetchShippers = useCallback(async (page, perPage, query = "") => {
        setLoading(true);
        setRefreshBtn(query.trim() !== "");
        try {
            const response = await axiosMerchant.get(`shippers`, {
                params: {
                    page: page,
                    per_page: perPage,
                    query: query || undefined,
                },
            });
            setLinks(response.data.data.links || []);
            setShippers(response.data.data.data || []);
        } catch (error) {
            handleError(error);
            setShippers([]);
            setLinks([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!accessAbility) {
            navigate("/unauthorized");
            return;
        }
        const timer = setTimeout(() => {
            fetchShippers(currentPage, itemsPerPage, search);
        }, 500);

        return () => clearTimeout(timer);
    }, [currentPage, itemsPerPage, search, fetchShippers, accessAbility, navigate]);

    const handleRefresh = () => {
        if(search === "") {
            fetchShippers(1,itemsPerPage)
        }
        setSearch("");
        setCurrentPage(1);
        setItemsPerPage(8);
    };

    const handleSubmitSuccess = () => {
        fetchShippers(currentPage, itemsPerPage, search);
    };

    return (
        <div>
            <PageTitle title={t("Shippers")} />
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0">
                <div className="flex gap-3 justify-start">
                    {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
                    <ShipperSettings />
                </div>
                <div className="flex md:items-center flex-col md:flex-row gap-2">
                    <form
                        onSubmit={(e) => e.preventDefault()}
                        className="flex justify-end w-full md:w-auto"
                    >
                        <div className="flex flex-col md:flex-row md:gap-x-2 w-full">
                            <Input
                                name="search"
                                type="text"
                                className="w-full md:w-[200px]"
                                value={search}
                                placeholder={t("Search Shippers...")}
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
                            <div className="flex gap-x-2 mt-2 md:mt-0">
                                <Button type="button" variant="refresh" onClick={handleRefresh}>
                                    <RefreshCcw className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </form>

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
                </div>
            </div>

            <div className="shadow-lg p-6 mt-4 rounded-lg ">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow className="">
                            <TableHead isFixed>{t("Name")}</TableHead>
                            <TableHead>{t("Address")}</TableHead>
                            <TableHead>{t("Info")}</TableHead>
                            <TableHead>{t("Financials")}</TableHead>
                            <TableHead>{t("Channels")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={12} className="text-center py-8">
                                    <Loader className="inline-block h-6 w-6 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : shippers && shippers.length > 0 ? (
                            shippers.map((shipper, index) => (
                                <TableRow key={index} className="">
                                    <TableCell isFixed className="">
                                        {shipper.name}
                                        <div className="flex justify-center gap-x-2 mt-2">
                                            {updateAbility && (
                                                <Button
                                                    onClick={() => openEditDialog(shipper)}
                                                    variant="edit"
                                                    size="xs"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {deleteAbility && (
                                                <Button onClick={() => openDeleteAlert(shipper)} variant="delete" size="xs">
                                                    <Trash2Icon className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <b>{t("Country:")}</b> {shipper.country?.name || t("N/A")}
                                        <br />
                                        <b>{t("Governorate:")}</b> {`${shipper?.governorate?.en_name} / ${shipper?.governorate?.ar_name}`}
                                        <br />
                                        <b>{t("State:")}</b> {`${shipper?.state?.en_name} / ${shipper?.state?.ar_name}`}
                                        <br />
                                        <b>{t("Place:")}</b> {`${shipper?.place?.en_name} / ${shipper?.place?.ar_name}`}
                                        <br />
                                        <b>{t("Address:")}</b> {shipper.address || t("N/A")}
                                    </TableCell>
                                    <TableCell>
                                        <b>{t("Contact")}:</b> {String(shipper.country_key_contact ?? "") + String(shipper.contact ?? "") || t("N/A")}
                                        <br />
                                        <b>{t("Alternative Contact")}:</b> {String(shipper.alternative_country_key_contact ?? "") + String(shipper.alternative_contact ?? "") || t("N/A")}
                                        <br />
                                        <b>{t("Failed OFD Count:")}</b> {shipper.setting?.failed_ofd_count || t("N/A")}
                                        <br />
                                        <b>{t("RTO Days:")}</b> {shipper.setting?.rto_days || t("N/A")}
                                        <br />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col space-y-2">
                                            <Link to={"commissions/" + shipper.id}>
                                                <Button
                                                    variant="outline"
                                                    size="xs"
                                                    className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                                                >
                                                    <DollarSign className="h-4 w-4" /> {t("Commissions")}
                                                </Button>
                                            </Link>
                                            <Link to={"accounts/" + shipper.id}>
                                                <Button
                                                    variant="outline"
                                                    size="xs"
                                                    className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                                                >
                                                    <Sheet className="h-4 w-4" /> {t("Accounts")}
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col space-y-2">
                                            <Link to={"/channels/country/" + shipper.id}>
                                                <Button
                                                    variant="outline"
                                                    size="xs"
                                                    className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                                                >
                                                    <Scale className="h-4 w-4" /> {t("Country Channels")}
                                                </Button>
                                            </Link>
                                            <Link to={"/channels/governorate/" + shipper.id}>
                                                <Button
                                                    variant="outline"
                                                    size="xs"
                                                    className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                                                >
                                                    <Scale className="h-4 w-4" /> {t("Governorate Channels")}
                                                </Button>
                                            </Link>
                                            <Link to={"/channels/state/" + shipper.id}>
                                                <Button
                                                    variant="outline"
                                                    size="xs"
                                                    className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                                                >
                                                    <Scale className="h-4 w-4" /> {t("State Channels")}
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={12}
                                    className="text-center py-6 text-gray-500"
                                >
                                    <NoRecordFound
                                        message={t("No shippers found. Please create one.")}
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className="mt-4">
                    <Pagination
                        links={links}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>

            {deleteAlert && (
                <DeleteAlert
                    onSubmitSuccess={handleSubmitSuccess}
                    record={selectedRecord}
                    onClose={closeDeleteAlert}
                    api={"shippers/delete"}
                />
            )}
            {editDialogOpen && (
                <Edit
                    onSubmitSuccess={handleSubmitSuccess}
                    record={selectedRecord}
                    onClose={closeEditDialog}
                />
            )}
        </div>
    );
};

export default ShipperIndex;