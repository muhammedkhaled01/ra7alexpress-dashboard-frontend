import React, { useState } from "react";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from 'react-hot-toast';
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { convertBoolean, handleError } from "@/utils/helpers";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import DriverAccounts from "../Users/DriverAccounts";
import Select from "@/components/misc/Select"

function DriverEditProofDialog({ onSubmitSuccess, company, onClose }) {
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [drivers, setDrivers] = useState([]);

    console.log(company)
    const { t } = useTranslation()

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(event.currentTarget)
            const response = await axiosMerchant.post("companies/drivers_status_update", formData);
            toast.success(response.data.message);
            if (onSubmitSuccess) {
                onSubmitSuccess();
            }
            onClose()
        } catch (error) {
            handleError(error)
            console.error("Failed to submit data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleEditProof = async (driver, checked) => {
        setLoading(true)
        const updatedValue = checked ? 1 : 0;
        try {
            await axiosMerchant.post(`drivers/change_edit_proof/${driver.user.id}`, { status: updatedValue });
            toast.success("Ability updated successfully.");
            onSubmitSuccess();
            onClose();
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false)
        }
    };

    const [selectAll, setSelectAll] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);

    const handleSelectAll = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);

        const updatedDrivers = company.drivers?.map((driver) => ({
            ...driver,
            checked: newSelectAll,
        }));

        setDrivers(updatedDrivers);

        const updatedSelectedRows = newSelectAll
            ? updatedDrivers?.map((driver) => driver.id)
            : [];

        setSelectedRows(updatedSelectedRows);
    };

    const handleTaskCheckboxChange = (id) => {
        const updatedDrivers = company.drivers?.map((driver) => {
            if (driver.id === id) {
                return { ...driver, checked: !driver.checked };
            }
            return driver;
        });

        setDrivers(updatedDrivers);

        const updatedSelectedRows = updatedDrivers
            ?.filter((driver) => driver.checked)
            ?.map((driver) => driver.id);

        setSelectedRows(updatedSelectedRows);
        setSelectAll(updatedDrivers.every((driver) => driver.checked));
    };

    const statuses = [
        { value: "1", label: "Allowed" },
        { value: "0", label: "Not Allowed" }
    ];

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px]">
                <DialogHeader id="no-print">
                    <DialogTitle>{t("Driver Settings")}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    {selectedRows.length > 0 && <>
                        <div className="flex felx-row items-center space-x-3">
                            <strong>Status</strong>
                            <Select
                                name="status"
                                options={statuses}
                            />
                        </div>
                    </>}
                    <br />
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableHead>
                                    <Checkbox
                                        id="select-all"
                                        checked={selectAll}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableCell className="font-bold">{t("Driver")}</TableCell>
                                <TableCell className="font-bold">{t("Can Edit Proof")}</TableCell>
                            </TableRow>
                            {company.drivers && company.drivers.map((driver, index) => {
                                return <TableRow>
                                    <TableCell>
                                        <Checkbox
                                            id={driver.user.id.toString()}
                                            name="driver_ids[]"
                                            value={driver.user.id}
                                            checked={selectAll || driver.checked}
                                            onCheckedChange={() => handleTaskCheckboxChange(driver.user.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="">{driver.user?.name}</TableCell>
                                    <TableCell className="">{convertBoolean(driver.settings?.edit_proof)}</TableCell>
                                    <TableCell className="">
                                        <Switch
                                            id={`edit-proofs-${driver.user.id}`}
                                            checked={driver?.settings?.edit_proof === 1}
                                            onCheckedChange={(checked) =>
                                                handleToggleEditProof(driver, checked)
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            }, [])}

                        </TableBody>
                    </Table>
                    <input type="hidden" name="id" value={company.id} />
                    <div className="flex justify-end gap-x-2 mt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                {t("Close")}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isLoading}>
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

export default DriverEditProofDialog;
