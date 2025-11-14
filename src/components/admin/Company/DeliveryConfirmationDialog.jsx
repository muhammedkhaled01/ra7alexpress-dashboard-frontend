import React, { useEffect, useState } from "react";

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
import { handleError } from "@/utils/helpers";
import Select from "@/components/misc/Select"
function DeliveryConfirmationDialog({ onSubmitSuccess, record, onClose }) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(event.currentTarget)
            const response = await axiosMerchant.post("companies/delivery_confirmation_method", formData);
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

    const methods = [
        { value: "otp", label: "OTP" },
        { value: "proof", label: "Proof Image" },
        { value: "otp_proof", label: "OTP + Proof Image" }
    ];


    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader id="no-print">
                    <DialogTitle>{t("Delivery Confirmation Settings")}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className="grid grid-cols-1 gap-4 mt-2">
                        <div className="input-container">
                            <strong>{t("Delivery Confirmation Method")}</strong>
                            <Select
                                name="method"
                                options={methods}
                                defaultValue={methods.find(
                                    (m) => m.value === record?.drivers[0]?.settings?.delivery_confirmation_method
                                )}
                            />

                        </div>
                    </div>
                    <input type="hidden" name="id" value={record?.id} />
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

export default DeliveryConfirmationDialog;
