import React, { useState } from "react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Phone } from "lucide-react";
import axiosMerchant from "@/axios";
import { toast } from "react-toastify";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

function DeliveryProof({ record, onClose, fetchShipments }) {
    const [loading, setLoading] = useState(false)
    const { t } = useTranslation()

    const handleSubmit = async (e) => {
        e.preventDefault()
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px]">

                <DialogHeader id="no-print">
                    <DialogTitle>Proof of Delivery</DialogTitle>
                </DialogHeader>
                <Separator />
                <form onSubmit={handleSubmit}>
                    <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4">
                        <div className="input-container">
                            <label htmlFor="name">{t("Hub Name")}</label>
                            <Input id="name" name="name" type="text" required />
                        </div>
                    </div>
                </form>
                <Separator />
                <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}

export default DeliveryProof;
