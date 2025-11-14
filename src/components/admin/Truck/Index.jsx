import { useState, useEffect, useRef } from "react";
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
import {
    Button
} from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "../../NoRecordFound";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
    Copy,
    Check,
    Download,
    LucideLoader,
    Pencil,
    PrinterIcon,
    RefreshCcw,
    Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import {
    can,
    handleError,
    humanizeText,
    printTruckBarcode,
} from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import ExportDialog from "@/components/misc/ExportDialog";
import { Badge } from "@/components/ui/badge";
import Select from "@/components/misc/Select";

const TruckIndex = () => {
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [trucks, setTrucks] = useState([]);
    const [search, setSearch] = useState("");
    const [refreshBtn, setRefreshBtn] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [copiedBarcode, setCopiedBarcode] = useState(null);

    const [selectedRecord, setselectedRecord] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const navigate = useNavigate();
    const { t } = useTranslation();
    const initialFetch = useRef(true);

    const accessAbility = can("Truck access");
    const createAbility = can("Truck create");
    const updateAbility = can("Truck update");
    const deleteAbility = can("Truck delete");
    const printAbility = can("Truck print");
    const exportAbility = can("Truck export");

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

    const fetchTrucks = async (pageNumber, query = "", perPage) => {
        setLoading(true);
        try {
            const response = await axiosMerchant.get(`trucks`, {
                params: {
                    page: pageNumber,
                    per_page: perPage,
                    query: query,
                },
            });
            setLinks(response.data.data.links || []);
            setTrucks(response.data.data.data || []);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setSearch("");
        setRefreshBtn(false);
        setCurrentPage(1);
        fetchTrucks(1, "", itemsPerPage);
    };

    const handleSubmitSuccess = () => {
        fetchTrucks(currentPage, search, itemsPerPage);
    };

    useEffect(() => {
        if (!accessAbility) {
            navigate("/unauthorized");
            return;
        }

        if (initialFetch.current) {
            initialFetch.current = false;
            fetchTrucks(currentPage, search, itemsPerPage);
            return;
        }

        if (search.trim() === "") {
            fetchTrucks(currentPage, "", itemsPerPage);
            setRefreshBtn(false);
        } else {
            setRefreshBtn(true);
        }

        const timer = setTimeout(() => {
            if (search.trim() !== "") {
                fetchTrucks(1, search, itemsPerPage);
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [currentPage, itemsPerPage, search]);


    const handlePrint = async (truck) => {
        try {
            setIsPrinting((prev) => ({ ...prev, [truck.id]: true }));
            const response = await axiosMerchant.get(`/trucks/printTruckBarcode`, {
                params: { id: truck.id },
            });

            printTruckBarcode(response.data.html);
            setIsPrinting((prev) => ({ ...prev, [truck.id]: false }));
        } catch (error) {
            setIsPrinting((prev) => ({ ...prev, [truck.id]: false }));
            console.error("Error fetching truck data for printing:", error);
        }
    };

    const handleCopy = async (barcode) => {
        await navigator.clipboard.writeText(barcode);
        setCopiedBarcode(barcode);

        setTimeout(() => {
            setCopiedBarcode(null);
        }, 2000);
    };

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case "active":
                return "success";
            case "inactive":
                return "secondary";
            case "maintenance":
                return "destructive";
            default:
                return "secondary";
        }
    };

    return (
        <div>
            <PageTitle title={t("Trucks")} />
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
                            <TableHead isFixed>{t("Barcode")}</TableHead>
                            <TableHead>{t("Number Plate")}</TableHead>
                            <TableHead>{t("Type")}</TableHead>
                            <TableHead>{t("Driver")}</TableHead>
                            <TableHead>{t("Status")}</TableHead>
                            <TableHead>{t("Print")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={12} className="text-center">
                                    <Loader />
                                </TableCell>
                            </TableRow>
                        ) : trucks && trucks.length > 0 ? (
                            trucks.map((truck, index) => (
                                <TableRow key={index}>
                                    <TableCell isFixed>
                                        <div className="flex flex-col justify-center">
                                            <div className="flex flex-col items-center">
                                                {accessAbility && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleCopy(truck.barcode)}
                                                            className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                                                            aria-label="Copy barcode"
                                                        >
                                                            {copiedBarcode === truck.barcode ? (
                                                                <Check size={18} className="text-green-500" />
                                                            ) : (
                                                                <Copy size={18} />
                                                            )}
                                                        </button>
                                                        <Button
                                                            onClick={() => navigate(`/trucks/view/${truck.barcode}`)}
                                                            variant="secondary"
                                                            size="xs"
                                                            className="d-inline"
                                                        >
                                                            <span className="text-xs">{truck.barcode}</span>
                                                        </Button>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-x-2 mt-2">
                                                    {updateAbility && (
                                                        <Button
                                                            onClick={() => openEditDialog(truck)}
                                                            variant="edit"
                                                            size="xs"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {deleteAbility && (
                                                        <Button
                                                            type="button"
                                                            onClick={() => openDeleteAlert(truck)}
                                                            variant="delete"
                                                            size="xs"
                                                        >
                                                            <Trash2Icon className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell> {truck.number_plate}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {humanizeText(truck.type)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {truck.truck_driver?.name || t("Unassigned")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(truck.status)}>
                                            {humanizeText(truck.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {printAbility && (
                                            <div className="flex space-x-1">
                                                <Button
                                                    variant="print"
                                                    onClick={() => handlePrint(truck)}
                                                    disabled={isPrinting[truck.id]}
                                                >
                                                    {isPrinting[truck.id] ? (
                                                        <LucideLoader className="h-4 w-4 animate-spin inline-block" />
                                                    ) : (
                                                        <PrinterIcon className="h-6 w-6" />
                                                    )
                                                    }
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
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
                    api={"trucks/delete"}
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
                    model="trucks"
                    endpoint="trucks/export"
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

export default TruckIndex;