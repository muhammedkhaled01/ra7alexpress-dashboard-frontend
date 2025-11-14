import React, { useEffect, useState } from "react";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import axiosMerchant from "@/axios";
import { toast } from 'react-hot-toast';
import { Loader2 } from "lucide-react";
import { default as Select } from "@/components/misc/Select"
import { handleError } from "@/utils/helpers";
import { t } from "i18next";
import { Input } from "@/components/ui/input";

function Status({ onSubmitSuccess, record, onClose }) {
    const [isLoading, setIsLoading] = useState(false);
    const [statusValue, setStatusValue] = useState({
        value: record.status,
        label: (record.status == 'pending' ? 'Pending' : (record.status == 'paid' ? 'Paid' : "Rejected"))
    })

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(event.currentTarget)
            const response = await axiosMerchant.post("invoices/change_status", formData);
            toast.success(response.data.message);
            if (onSubmitSuccess) {
                onSubmitSuccess();
            }
            onClose();
        } catch (error) {
            handleError(error)
        } finally {
            setIsLoading(false);
        }
    };

    const statuses = [
        { value: "paid", label: "Paid" },
        { value: "pending", label: "Pending" },

    ]

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader id="no-print">
                    <DialogTitle>{t("Update Status")}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    <div>
                        <label htmlFor="status">{t("Status")}</label>
                        <Select
                            name="status"
                            options={statuses?.map(status => ({ value: status.value, label: status.label }))}
                            className="basic-multi-select"
                            classNamePrefix="select"
                            defaultValue={statusValue}
                        />
                    </div>
                    {record && record.invoiceable?.driver?.company?.payment_proof_required &&
                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-2">
                                {t("Proof")}
                            </label>
                            <Input
                                type="file"
                                name="driver_payment_proof"
                                className="form-input w-full"
                            />
                        </div>}
                    <input type="hidden" name="id" value={record.id} />
                    <div className="flex justify-end gap-x-2 mt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Close
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default Status;