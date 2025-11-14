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
import {
    Download,
    EditIcon,
    MoreHorizontal,
    RefreshCcw,
    Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import { can, handleError, humanizeText } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import ExportDialog from "@/components/misc/ExportDialog";
import { Badge } from "@/components/ui/badge";
import Select from "@/components/misc/Select";


const TruckDriverIndex = () => {
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [truckDrivers, setTruckDrivers] = useState([]);
    const [search, setSearch] = useState("");
    const [refreshBtn, setRefreshBtn] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [showExport, setShowExport] = useState(false);

    const [selectedRecord, setselectedRecord] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const navigate = useNavigate();
    const { t } = useTranslation();

    const accessAbility = can("Truck Driver access");
    const createAbility = can("Truck Driver create");
    const updateAbility = can("Truck Driver update");
    const deleteAbility = can("Truck Driver delete");
    const exportAbility = can("Truck Driver export");

    // DELETE ALERT
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
    const fetchTruckDrivers = async () => {
        setLoading(true);
        try {
            if (search.trim() !== "") {
                const response = await axiosMerchant.get(`truck_drivers?query=${search}`);
                setTruckDrivers(response.data.data);
                setLinks([]);
            } else {
                const response = await axiosMerchant.get(
                    `truck_drivers?page=${currentPage}&per_page=${itemsPerPage}`
                );
                setLinks(response.data.data.links);
                setTruckDrivers(response.data.data.data);
            }
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!accessAbility) {
            navigate("/unauthorized");
            return;
        }
        fetchTruckDrivers();
    }, [currentPage, itemsPerPage, search, accessAbility]); 

    const handleRefresh = () => {
        if (search === "") {
            fetchTruckDrivers();
        }
        setSearch("");
        setCurrentPage(1);
    };

    const handleSubmitSuccess = () => {
        if (search.trim() !== "") {
            setSearch("");
        } else {
            setCurrentPage(1);
        }
    };

    useEffect(() => {
        search.trim() !== "" ? setRefreshBtn(true) : setRefreshBtn(false);
    }, [search]);


    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case "active":
                return "success";
            case "inactive":
                return "destructive";
            default:
                return "secondary";
        }
    };

    return (
        <div>
            <PageTitle title={t("Truck Drivers")} />
            <div className="flex flex-col md:flex-row gap-3 justify-between mt-2">
                <div>
                    {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
                </div>

                <div className="flex gap-2">
                    <form className="flex md:items-center flex-col md:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
                        <div className="flex gap-x-2">
                            <Input
                                name="search"
                                type="text"
                                className="w-[200px]"
                                value={search}
                                placeholder={t("Search By Name...")}
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
                    {exportAbility && (
                        <div>
                            <Button variant="download" type="button" onClick={() => setShowExport(true)}>
                                <Download />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="shadow-md py-4 mt-2 rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead isFixed>{t("Name")}</TableHead>
                            <TableHead>{t("Email")}</TableHead>
                            <TableHead>{t("Phone Number")}</TableHead>
                            <TableHead>{t("ID Card Number")}</TableHead>
                            <TableHead>{t("Company")}</TableHead>
                            <TableHead>{t("Status")}</TableHead>
                            {/* <TableHead className="text-right">{t("Actions")}</TableHead> */}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={12} className="text-center">
                                    <Loader />
                                </TableCell>
                            </TableRow>
                        ) : truckDrivers && truckDrivers.length > 0 ? (
                            truckDrivers.map((truckDriver, index) => (
                                <TableRow key={index}>
                                    <TableCell isFixed>
                                        <div className="flex flex-col justify-center">
                                            {truckDriver.user?.name}
                                            <div className="flex justify-center gap-x-2 mt-2">
                                                {updateAbility && (
                                                    <Button
                                                        onClick={() => openEditDialog(truckDriver)}
                                                        variant="edit"
                                                        size="xs"
                                                    >
                                                        <EditIcon className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {deleteAbility && (
                                                    <Button
                                                        type="button"
                                                        onClick={() => openDeleteAlert(truckDriver)}
                                                        variant="delete"
                                                        size="xs"
                                                    >
                                                        <Trash2Icon className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{truckDriver.user?.email}</TableCell>
                                    <TableCell>{String(truckDriver.country_code ?? "") + String(truckDriver.phone_number ?? "")}</TableCell>
                                    <TableCell>{truckDriver.id_card_number}</TableCell>
                                    <TableCell>{truckDriver.company}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(truckDriver.status)}>
                                            {humanizeText(truckDriver.status)}
                                        </Badge>
                                    </TableCell>
                                    {/* <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="h-10 w-10 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {updateAbility && (
                          <DropdownMenuItem
                            onClick={() => openEditDialog(truckDriver)}
                          >
                            <EditIcon className="p-1" /> {t("Edit")}
                          </DropdownMenuItem>
                        )}
                        {deleteAbility && (
                          <DropdownMenuItem
                            onClick={() => openDeleteAlert(truckDriver)}
                          >
                            <Trash2Icon className="p-1" /> {t("Delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell> */}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={12} className="text-center">
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

            {deleteAlert && (
                <DeleteAlert
                    onSubmitSuccess={handleSubmitSuccess}
                    record={selectedRecord}
                    onClose={closeDeleteAlert}
                    api={"truck_drivers/delete"}
                />
            )}
            {editDialogOpen && (
                <Edit
                    onSubmitSuccess={handleSubmitSuccess}
                    record={selectedRecord}
                    onClose={closeEditDialog}
                />
            )}
            {showExport && (
                <ExportDialog
                    model="truckDrivers"
                    endpoint="truckDrivers/export"
                    fields={[
                        { key: "id", label: "ID" },
                        { key: "barcode", label: "Barcode" },
                        { key: "number_plate", label: "Number Plate" },
                        { key: "color", label: "Color" },
                        { key: "company", label: "Company" },
                        { key: "created_at", label: "Created At" },
                        { key: "updated_at", label: "Updated At" },
                    ]}
                    onClose={() => setShowExport(false)}
                />
            )}
        </div>
    );
};

export default TruckDriverIndex;