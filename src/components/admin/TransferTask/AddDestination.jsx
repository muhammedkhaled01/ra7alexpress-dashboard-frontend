import React, { useEffect, useState } from "react";

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

import { Link, useParams } from "react-router-dom";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Eye, Plus } from "lucide-react";
import View from "./DestinationShipmentsView";
import Loader from "@/components/Loader";
import { capitalize } from "@/utils/helpers";
import { Badge } from "@/components/ui/badge";

function TransferTaskView() {
    const [loading, setLoading] = useState(true)
    const [task, setTask] = useState({})
    const params = useParams()
    const { t } = useTranslation()

    useEffect(() => {
        axiosMerchant.post("transfer_tasks/edit/" + params.id).then((response) => {
            setTask(response.data.data)
            setLoading(false)
        });

    }, [])

    if (loading) {
        return <Loader className="" />
    }

    const handleAddDestination = () => {
        setDestinationRows((prev) => [
            ...prev,
            { id: Date.now(), selectedDestination: null },
        ]);
    };

    const handleRemoveDestination = (rowId) => {
        setDestinationRows((prev) => prev.filter((row) => row.id !== rowId));
    };

    const handleDestinationChange = (rowId, selectedOption) => {
        setDestinationRows((prevRows) =>
            prevRows.map((row) =>
                row.id === rowId ? { ...row, selectedDestination: selectedOption } : row
            )
        );
    };

    return (
        <div>
            <Card className="mb-4">
                <CardHeader>
                    <div className="flex flex-row space-x-3">
                        <CardTitle className="self-center">
                            {t("Destinations")}
                        </CardTitle>
                        <Button type="button" onClick={handleAddDestination}>
                            <Plus className="w-4 h-4" />
                        </Button>
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
            <div className="grid grid-cols-2 gap-4 mt-2">
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
                                    <TableCell className="text-left"><b>{t("Company")}</b></TableCell>
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
                                    <TableCell className="text-right">{task?.truck_driver?.name}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-left"><b>{t("Phone Number")}</b></TableCell>
                                    <TableCell className="text-right">{task?.truck_driver?.phone_number}</TableCell>
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
