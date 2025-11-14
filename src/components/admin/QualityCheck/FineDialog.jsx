import React, { useEffect, useState } from "react";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from 'react-hot-toast';
import { Loader2, Plus, TestTubeDiagonalIcon } from "lucide-react";
import { driverName, handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";

function FineDialog({ shipment, onSubmitSuccess }) {
    const [showDialog, setShowDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // const [cash, setCash] = useState(false);
    // const [isPaymentValid, setIsPaymentValid] = useState(false);

    const { t } = useTranslation()

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            e.preventDefault()
            const form = new FormData(e.currentTarget)
            form.append('shipment_tracking_no', shipment?.tracking_no)
            form.append('driver_id', shipment?.current_assignment?.driver_id)
            const response = await axiosMerchant.post("fines/store", form);
            toast.success(response.data.message);
            if (onSubmitSuccess) {
                onSubmitSuccess();
            }
            setShowDialog(false);
        } catch (error) {
            handleError(error)
            setShowDialog(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
                <Button variant="destructive">{t("Fine")}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t(`Fine - ${shipment.tracking_no}`)}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
                        <div className="input-container">
                            <label htmlFor="amount">
                                {t("Amount")}:
                            </label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                            // value={cash}
                            // onChange={(e) => setCash(e.target.value)}
                            />
                        </div>
                        <div className="input-container">
                            <label htmlFor="notes">
                                {t("Notes")}:
                            </label>
                            <Textarea name="notes" />
                        </div>
                    </div><br />
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

export default FineDialog;