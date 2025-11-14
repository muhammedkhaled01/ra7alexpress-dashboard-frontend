import React from "react";
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
import { useTranslation } from "react-i18next";

function View({ record, onClose }) {
    const { t } = useTranslation()
    console.log(record,'record')
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[1000px]">
                <DialogHeader id="no-print">
                    <DialogTitle>{t("Consignee")}</DialogTitle>
                </DialogHeader>
                <Separator />
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <ul className="grid gap-3">
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">{t("Name")}</span>
                                <span>{record.name}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">{t("Email")}</span>
                                <span>{record.email}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">{t("Cell Phone")}</span>
                                <span>{record.cellphone ?? "_"}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">{t("Alternate Phone")}</span>
                                <span>{record.alternatePhone ?? "_"}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">{t("District")}</span>
                                <span>{record.district ?? "_"}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">{t("Zip Code")}</span>
                                <span>{record.zipcode ?? "_"}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">{t("Identify")}</span>
                                <span>{record.identify ?? "_"}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">{t("Tax Number")}</span>
                                <span>{record.taxNumber ?? "_"}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">{t("Street Address")}</span>
                                <span>{record.streetAddress ?? "_"}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">{t("Country")}</span>
                                <span>{record.country?.name}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">{t("State")}</span>
                                <span>{record.state?.en_name}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">{t("City")}</span>
                                <span>{record.city?.name}</span>
                            </li>
                        </ul>
                    </div>
                </div>
                <Separator />
                <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            {t("Close")}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default View;
