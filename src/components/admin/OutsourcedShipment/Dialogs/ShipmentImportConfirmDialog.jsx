import React, { useState } from "react";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";

function ShipmentImportPreviewDialog({ data, onSubmitSuccess, handleExcelImport, onClose }) {
    const [showDialog, setShowDialog] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Assuming handleExcelImport returns a promise
            console.log("ere you go brother")
            await handleExcelImport(e, true);

            toast.success(t("Shipments imported successfully"));
            setShowDialog(false);
            if (onSubmitSuccess) {
                onSubmitSuccess();
                onClose();
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[90vw] sm:mx-auto lg:max-w-[1000px]">
                <DialogHeader>
                    <DialogTitle>{t("Shipment Import Preview")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
                        <ScrollArea className="max-h-[300px] w-full p-2">
                            <Table>
                                <TableRow>
                                    <TableCell className="font-bold">{t("Country Channels")} <a className="inline-block" href={`/channels/country/2`} target="_blank"><ExternalLink className="ml-1 w-4 h-4" /></a></TableCell>
                                    <TableCell className="font-bold">{t("Governorate Channels")} <a className="inline-block" href={`/channels/governorate/2`} target="_blank"><ExternalLink className="ml-1 w-4 h-4" /></a></TableCell>
                                    <TableCell className="font-bold">{t("State Channels")} <a className="inline-block" href={`/channels/state/2`} target="_blank"><ExternalLink className="ml-1 w-4 h-4" /></a></TableCell>
                                </TableRow>
                                <TableBody>
                                    {Array.from({
                                        length: Math.max(
                                            data.addresses.countries.length,
                                            data.addresses.governorates.length,
                                            data.addresses.states.length
                                        )
                                    }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{data.addresses.countries[index] || "-"}</TableCell>
                                            <TableCell>{data.addresses.governorates[index] || "-"}</TableCell>
                                            <TableCell>{data.addresses.states[index] || "-"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
                                <Table>
                                    <TableCell className="font-bold">{t("Importable Shipments")}</TableCell>
                                    <TableBody>
                                        {data.data.importableShipments.map((shipment) => (
                                            <TableRow>
                                                <TableCell><Badge variant={"delivered"}>{shipment || "-"}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Table>
                                    <TableCell className="font-bold">{t("Problematic Shipments")}</TableCell>
                                    <TableBody>
                                        {data.data.unimportableShipments.map((shipment) => (
                                            <TableRow>
                                                <TableCell><Badge variant={"destructive"}>{shipment || "-"}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Table>
                                    <TableCell className="font-bold">{t("Missing Commissions")} <a className="inline-block" href={`/shippers/commissions/2`} target="_blank"><ExternalLink className="ml-1 w-4 h-4" /></a></TableCell>
                                    <TableBody>
                                        {data.data.commissions.map((state) => (
                                            <TableRow>
                                                <TableCell><Badge variant={"exception"}>{state || "-"}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </ScrollArea>
                    </div><br />
                    <div className="flex flex-row gap-x-2 justify-end">
                        <DialogClose className="" asChild>
                            <Button type="button" variant="secondary">
                                {t("Close")}
                            </Button>
                        </DialogClose>
                        <Button type="submit" className="ml-2" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                t("Save Changes")
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default ShipmentImportPreviewDialog;