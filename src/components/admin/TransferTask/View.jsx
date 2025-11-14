import { useEffect, useState } from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Navigate, useParams } from "react-router-dom";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Eye, Plus } from "lucide-react";
import View from "./DestinationShipmentsView";
import Loader from "@/components/Loader";
import { can, capitalize, handleError } from "@/utils/helpers";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

function TransferTaskView() {
    const { t } = useTranslation()
    const params = useParams()

    const [loading, setLoading] = useState(true)
    const [task, setTask] = useState({})
    const [transferAreas, setTransferAreas] = useState([]);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        axiosMerchant.post("transfer_tasks/edit/" + params.id).then((response) => {
            setTask(response.data.data)
            setLoading(false)
        });

        axiosMerchant.get("transfer_areas").then((response) => {
            setTransferAreas(response.data.data);
        });
    }, [refresh])

    const addDestination = async (data) => {
        data.transfer_task_id = params.id;
        setLoading(true);
        try {
            const response = await axiosMerchant.post("transfer_tasks/add_destination", data);
            toast.success(response.data.message);
            setRefresh(refresh + 1)
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    }

    const canAccess = can("Transfer Task access")

    if (!canAccess) {
        return <Navigate to="/unauthorized" replace />;
    }

    if (loading) {
        return <Loader className="" />
    }

    return (
        <div>
            <Card className="mb-4">
                <CardHeader>
                    <div className="flex flex-row gap-x-3">
                        <CardTitle className="self-center">
                            {t("Destinations")}
                        </CardTitle>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button"   >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {transferAreas?.map(area => (
                                    <DropdownMenuItem key={area.id} onClick={() => addDestination(area)}>{`${area.owner} - ${area.shipments_count}`}</DropdownMenuItem>
                                ))}

                                {transferAreas?.length == 0 && <DropdownMenuItem>{t("No Destinations")}</DropdownMenuItem>}

                            </DropdownMenuContent>
                        </DropdownMenu>
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
                                <TableHead>{t("Status")}</TableHead>
                                <TableHead>{t("View")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {task?.destinations?.map((destination, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>{destination.origin?.name}</TableCell>
                                    <TableCell>{destination.destination?.name}</TableCell>
                                    <TableCell>{destination.destination_shipments?.length}</TableCell>
                                    <TableCell><Badge>{capitalize(destination.status)}</Badge></TableCell>
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
                            ))}

                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("Truck Information")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell><b>{t("Number Plate")}</b></TableCell>
                                    <TableCell className="text-right">{task?.truck?.number_plate}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-center"><b>{t("Company")}</b></TableCell>
                                    <TableCell className="text-right">{task?.truck?.company}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className=""><b>{t("Color")}</b></TableCell>
                                    <TableCell className="text-right">{task?.truck?.color}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className=""><b>{t("Notes")}</b></TableCell>
                                    <TableCell className="text-right">{task?.truck?.notes ?? "N/A"}</TableCell>
                                </TableRow>

                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card className="">
                    <CardHeader>
                        <CardTitle>{t("Truck Driver Information")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell><b>{t("Name")}</b></TableCell>
                                    <TableCell className="text-right">{task?.truck_driver?.user?.name}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-center"><b>{t("Phone Number")}</b></TableCell>
                                    <TableCell className="text-right">
                                        {String(task.truck_driver?.country_code ?? "") + String(task.truck_driver?.phone_number ?? "")}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className=""><b>{t("ID Card Number")}</b></TableCell>
                                    <TableCell className="text-right">{task?.truck_driver?.id_card_number}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className=""><b>{t("Company")}</b></TableCell>
                                    <TableCell className="text-right">{task?.truck_driver?.company}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div >
    )

}

export default TransferTaskView;
