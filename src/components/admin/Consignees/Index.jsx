import axiosMerchant from "@/axios";
import React, {useEffect, useState} from "react";
import {Button} from "../../ui/button";
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
import {Link, useNavigate} from "react-router-dom";
import Pagination from "@/components/Pagination";
import {Input} from "@/components/ui/input";
import {toast} from "react-hot-toast";
import {
    EditIcon,
    EyeIcon,
    Filter,
    MoreHorizontal,
    Pencil,
    RefreshCcw,
    Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import {can, handleError, hasRole} from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import {useTranslation} from "react-i18next";
import View from "./View";
import Select from "@/components/misc/Select";

const ConsigneeIndex = () => {
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [consignees, setConsignees] = useState([]);
    const [search, setSearch] = useState("");
    const [refreshBtn, setRefreshBtn] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const [selectedRecord, setselectedRecord] = useState(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);

    const navigate = useNavigate();
    const {t} = useTranslation();

    const accessAbility = can("Consignee access");
    const createAbility = can("Consignee create");
    const updateAbility = can("Consignee update");
    const deleteAbility = can("Consignee delete");

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

    const openViewDialog = (record) => {
        setselectedRecord(record);
        setViewDialogOpen(true);
    };

    const closeViewDialog = () => {
        setselectedRecord(null);
        setViewDialogOpen(false);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // ✨ تم دمج منطق البحث والتصفح في useEffect واحد
    useEffect(() => {
        if (!accessAbility) {
            navigate("/unauthorized");
            return;
        }

        const fetchConsignees = async () => {
            setLoading(true);
            try {
                if (search.trim() !== "") {
                    const response = await axiosMerchant.get(`consignees?query=${search}`);
                    setConsignees(response.data.data || response.data.data.data || []);
                    setLinks(response.data.data.links || []);
                } else {
                    const response = await axiosMerchant.get(
                        `consignees?page=${currentPage}&per_page=${itemsPerPage}`
                    );
                    setLinks(response.data.data.links);
                    setConsignees(response.data.data.data);
                }
            } catch (error) {
                handleError(error);
            } finally {
                setLoading(false);
            }
        };

        // ✨ Debouncing للبحث
        const timer = setTimeout(() => {
            fetchConsignees();
        }, 500);

        return () => clearTimeout(timer);
    }, [currentPage, itemsPerPage, search, accessAbility]);


    const handleRefresh = () => {
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

    return (
        <div>
            <PageTitle title={t("Consignees")}/>
            <div className="flex justify-between mt-2">
                <div>
                    {createAbility && <Create onSubmitSuccess={handleSubmitSuccess}/>}
                </div>

                <form className="flex md:items-center flex-col md:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
                    <div className="flex gap-x-2">
                        <Input
                            name="search"
                            type="text"
                            className="w-[200px]"
                            value={search}
                            placeholder={t("Search Consignees...")}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={
                                refreshBtn && search.trim() !== "" && (
                                    <RefreshCcw className="w-4 h-4 cursor-pointer" onClick={handleRefresh}/>
                                )
                            }
                        />
                        <Button type="button" variant="refresh" onClick={handleRefresh}>
                            <RefreshCcw className="w-4 h-4"/>
                        </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600 dark:text-gray-300">
                            {t("Show")}
                        </label>
                        <Select
                            value={{value: itemsPerPage, label: itemsPerPage.toString()}}
                            onChange={(selectedOption) => {
                                setItemsPerPage(Number(selectedOption.value));
                            }}
                            options={[
                                {value: 5, label: '5'},
                                {value: 8, label: '8'},
                                {value: 15, label: '15'},
                                {value: 25, label: '25'},
                                {value: 50, label: '50'},
                                {value: 100, label: '100'}
                            ]}
                            className="w-20 text-sm"
                            isSearchable={false}
                        />
                    </div>
                </form>
            </div>

            <div className="shadow-md py-4 mt-2 rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">#</TableHead>
                            <TableHead isFixed>{t("Name")}</TableHead>
                            <TableHead>{t("Email")}</TableHead>
                            <TableHead>{t("Cell Phone")}</TableHead>
                            <TableHead>{t("Country")}</TableHead>
                            <TableHead>{t("State")}</TableHead>
                            <TableHead>{t("Street Address")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center">
                                    <Loader/>
                                </TableCell>
                            </TableRow>
                        ) : consignees && consignees.length > 0 ? (
                            consignees.map((consignee, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell isFixed>
                                        {consignee?.name}
                                        <div className="flex justify-center gap-x-2 mt-2">
                                            {updateAbility && (
                                                <Button onClick={() => openEditDialog(consignee)} variant="edit"
                                                        size="xs">
                                                    <Pencil className="w-4 h-4"/>
                                                </Button>
                                            )}
                                            {accessAbility && (
                                                <Button onClick={() => openViewDialog(consignee)} variant="secondary"
                                                        size="xs">
                                                    <EyeIcon className="w-4 h-4"/>
                                                </Button>
                                            )}
                                            {deleteAbility && (
                                                <Button onClick={() => openDeleteAlert(consignee)} variant="delete"
                                                        size="xs">
                                                    <Trash2Icon className="w-4 h-4"/>
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{String(consignee?.email ? consignee?.email : "-")}</TableCell>
                                    <TableCell>{(String(consignee?.country_key_cellphone) + String(consignee?.cellphone))}</TableCell>
                                    <TableCell>{String(consignee?.country?.name)}</TableCell>
                                    <TableCell>{String(consignee?.state?.en_name)}</TableCell>
                                    <TableCell>{String(consignee?.streetAddress)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center">
                                    <NoRecordFound/>
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

            {viewDialogOpen && (
                <View record={selectedRecord} onClose={closeViewDialog}/>
            )}

            {deleteAlert && (
                <DeleteAlert
                    onSubmitSuccess={handleSubmitSuccess}
                    record={selectedRecord}
                    onClose={closeDeleteAlert}
                    api={"consignees/delete"}
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

export default ConsigneeIndex;