import React, { useEffect, useState } from "react";
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
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Link, useNavigate, useParams } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
    EditIcon,
    Eye,
    LucideLoader,
    MoreHorizontal,
    Plus,
    Printer,
    PrinterIcon,
    RefreshCcw,
    Ticket,
    Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import { can, capitalize, convertBoolean, handleError, printLabel, printWaybill } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import axiosMerchant from "@/axios";
import { Badge } from "@/components/ui/badge";
import View from "./TruckShipmentsView";

const TruckView = () => {
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [truck, setTruck] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [search, setSearch] = useState("");
    const [refreshBtn, setRefreshBtn] = useState(false);

    const [selectedRecord, setSelectedRecord] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);

    const [isPrinting, setIsPrinting] = useState(false);

    const params = useParams()
    const navigate = useNavigate();
    const { t } = useTranslation();

    const accessAbility = can("Merchant Waybill access");
    const createAbility = can("Merchant Waybill create");
    const updateAbility = can("Merchant Waybill update");
    const deleteAbility = can("Merchant Waybill delete");

    const openDeleteAlert = (record) => {
        setSelectedRecord(record);
        setDeleteAlert(true);
    };

    const closeDeleteAlert = () => {
        setSelectedRecord(null);
        setDeleteAlert(false);
    };

    // const openEditDialog = (record) => {
    //   setSelectedRecord(record);
    //   setEditDialogOpen(true);
    // };

    // const closeEditDialog = () => {
    //   setSelectedRecord(null);
    //   setEditDialogOpen(false);
    // };

    useEffect(() => {
        if (!accessAbility) {
            navigate("/unauthorized");
        }
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await axiosMerchant.get(`trucks/view/${params.truck_barcode}`,);
            console.log(response.data.data)
            setTasks(response.data.data.tasks);
            setTruck(response.data.data.truck)
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitSuccess = () => {
        fetchTrucks(currentPage);
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0">
                <PageTitle title={`${t("Truck")} ${truck ? `- ${truck.number_plate}` : ''}`} />
            </div>
            {/* <View /> */}
            <div className="shadow-md py-4 mt-2 rounded-lg">
                <Card className="mb-4">
                    <CardHeader>
                        <div className="flex flex-row space-x-3">
                            <CardTitle className="self-center">
                                {t("Destinations")}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">#</TableHead>
                                    <TableHead>{t("Origin")}</TableHead>
                                    <TableHead>{t("Destination")}</TableHead>
                                    <TableHead>{t("Shipments")}</TableHead>
                                    <TableHead>{t("Loaded at")}</TableHead>
                                    <TableHead>{t("View")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading &&
                                    <TableRow>
                                        <TableCell colSpan={12} className="text-center">
                                            <Loader />
                                        </TableCell>
                                    </TableRow>}
                                {tasks?.map((task, taskIndex) =>
                                    task?.destinations?.map((destination, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell>{destination.origin?.name}</TableCell>
                                            <TableCell>{destination.destination?.name}</TableCell>
                                            <TableCell>{destination.destination_shipments?.length}</TableCell>
                                            <TableCell>{destination.loaded_at}</TableCell>
                                            <TableCell>
                                                <View
                                                    tigger={
                                                        <Button
                                                            size="icon"
                                                            className="ml-1"
                                                            variant="default"
                                                        >
                                                            <Eye className="h-6 w-6" />
                                                        </Button>
                                                    }
                                                    record={destination.destination_shipments}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            {deleteAlert && (
                <DeleteAlert
                    onSubmitSuccess={handleSubmitSuccess}
                    record={selectedRecord}
                    onClose={closeDeleteAlert}
                    api={"trucks/delete"}
                />
            )}
        </div>
    );
};

export default TruckView;
