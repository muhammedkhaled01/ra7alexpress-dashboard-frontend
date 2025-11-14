import axiosMerchant from "@/axios";
import { useEffect, useState, useCallback } from "react";
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

import { Link, useLocation, useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import { Eye, Plus, RefreshCcw, Copy, Check } from "lucide-react";

import { can, capitalize, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { closeTab } from "@/stores/features/tabsFeature";
import { useDispatch } from "react-redux";
import Select from "@/components/misc/Select";

const TransferTaskIndex = () => {
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [currentPage, setCurrentPage] = useState(1);
    const [transferTasks, setTransferTasks] = useState([]);
    const [search, setSearch] = useState("");
    const [refreshBtn, setRefreshBtn] = useState(false);
    const [copiedTaskId, setCopiedTaskId] = useState(null);

    const [selectedRecord, setselectedRecord] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState(false);

    const navigate = useNavigate();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const location = useLocation();

    const accessAbility = can("Transfer Task access");
    const createAbility = can("Transfer Task create");

    // DELETE ALERT
    const openDeleteAlert = (record) => {
        setselectedRecord(record);
        setDeleteAlert(true);
    };

    const closeDeleteAlert = () => {
        setselectedRecord(null);
        setDeleteAlert(false);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const fetchTransferTasks = useCallback(async (page, perPage, query = "") => {
        setLoading(true);
        setRefreshBtn(query.trim() !== "");
        try {
            const response = await axiosMerchant.get(`transfer_tasks`, {
                params: {
                    page: page,
                    per_page: perPage,
                    query: query || undefined,
                },
            });
            setLinks(response.data.data.links || []);
            setTransferTasks(response.data.data.data || []);
        } catch (error) {
            handleError(error);
            setTransferTasks([]);
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
            fetchTransferTasks(currentPage, itemsPerPage, search);
        }, 500);

        return () => clearTimeout(timer);
    }, [currentPage, itemsPerPage, search, fetchTransferTasks, accessAbility, navigate]);

    useEffect(() => {
        if (location.state?.closeTabId) {
            dispatch(closeTab(location.state.closeTabId));
            window.history.replaceState(null, document.title);
        }
        if (location.state?.from === '/shipments/new-create-transfer-task' || location.state?.closeTabId) {
            handleRefresh();
        }
    }, [location.state, dispatch]);


    const handleCopy = async (numberPlate, taskId) => {
        if (!numberPlate) return;
        await navigator.clipboard.writeText(numberPlate);
        setCopiedTaskId(taskId);

        setTimeout(() => {
            setCopiedTaskId(null);
        }, 2000);
    };

    const handleRefresh = () => {
        if(search === ""){
            fetchTransferTasks()
        }
        setSearch("");
        setCurrentPage(1);
        setItemsPerPage(8);
    };

    const handleSubmitSuccess = () => {
        fetchTransferTasks(currentPage, itemsPerPage, search);
    };

    return (
        <div>
            <PageTitle title={t("Transfer Task")} />
            <div className="flex flex-col md:flex-row gap-2 justify-between mt-2">
                <div>
                    {createAbility && (
                        <Link to={"/shipments/new-create-transfer-task"}>
                            <Button type="button" className="flex items-center space-x-1">
                                <Plus className="w-4 h-4" />
                                <span>{t("Create Transfer Task")}</span>
                            </Button>
                        </Link>
                    )}
                </div>

                <form className="flex md:items-center flex-col md:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
                    <div className="flex gap-x-2">
                        <Input
                            name="search"
                            type="text"
                            className="w-[200px]"
                            value={search}
                            id="search"
                            placeholder={t("Search By Number Plate...")}
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
            </div>

            <div className="shadow-md py-4 mt-2 rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">#</TableHead>
                            <TableHead>{t("Origin")}</TableHead>
                            <TableHead isFixed>{t("Truck Number Plate")}</TableHead>
                            <TableHead>{t("Driver Name")}</TableHead>
                            <TableHead>{t("Driver Phone")}</TableHead>
                            <TableHead>{t("Status")}</TableHead>
                            <TableHead>{t("View")}</TableHead>
                            <TableHead>{t("Created at")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center">
                                    <Loader />
                                </TableCell>
                            </TableRow>
                        ) : transferTasks && transferTasks.length > 0 ? (
                            transferTasks.map((transferTask, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>{transferTask.origin?.name}</TableCell>
                                    <TableCell isFixed>
                                        <div className="flex justify-center items-center gap-x-2">
                                            <button
                                                onClick={() => handleCopy(transferTask.truck?.number_plate, transferTask.id)}
                                                className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                                                aria-label="Copy number plate"
                                            >
                                                {copiedTaskId === transferTask.id ? (
                                                    <Check size={18} className="text-green-500" />
                                                ) : (
                                                    <Copy size={18} />
                                                )}
                                            </button>
                                            <span className="font-medium">{transferTask.truck?.number_plate}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{transferTask.truck_driver?.user?.name}</TableCell>
                                    <TableCell>
                                        {String(transferTask.truck_driver?.country_code ?? "") + String(transferTask.truck_driver?.phone_number ?? "")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge>{capitalize(transferTask.status)}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Link to={"/shipments/transfer/tasks/view/" + transferTask.id}>
                                            <Button size="icon" className="ml-1" variant="show">
                                                <Eye className="h-6 w-6" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(transferTask.created_at).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center">
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
                    api={"transferTasks/delete"}
                />
            )}
        </div>
    );
};

export default TransferTaskIndex;