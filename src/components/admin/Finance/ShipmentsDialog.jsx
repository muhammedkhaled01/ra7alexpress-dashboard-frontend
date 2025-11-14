import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    CustomTable,
    CustomTableBody,
    CustomTableCell,
    CustomTableHead,
    CustomTableHeader,
    CustomTableRow,
} from "@/components/ui/CustomTable";
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Check, Copy, X } from "lucide-react";

const ShipmentsDialog = ({
    isOpen,
    onClose,
    title,
    shipments,
    loading,
    t
}) => {
    const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);
    const handleCopy = async (trackingNo) => {
        await navigator.clipboard.writeText(trackingNo);
        setCopiedTrackingNo(trackingNo);

        setTimeout(() => {
            setCopiedTrackingNo(null);
        }, 2000);
    };
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {t('Total shipments')}: {shipments?.length || 0}
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {loading ? (
                        <Loader />
                    ) : shipments && shipments.length > 0 ? (
                        <CustomTable>
                            <CustomTableHeader>
                                <CustomTableRow>
                                    <CustomTableHead>{t('Tracking Number')}</CustomTableHead>
                                    <CustomTableHead>{t('Total Amount')}</CustomTableHead>
                                    <CustomTableHead>{t('Payment Method')}</CustomTableHead>
                                </CustomTableRow>
                            </CustomTableHeader>
                            <CustomTableBody>
                                {shipments.map((shipment, index) => (
                                    <CustomTableRow key={index}>
                                        <CustomTableCell>
                                            <div className="flex items-start gap-2">
                                                <div className="flex-shrink-0 flex items-start gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCopy(shipment?.tracking_no);
                                                        }}
                                                        className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors mt-1"
                                                        aria-label="Copy tracking number"
                                                    >
                                                        {copiedTrackingNo === shipment?.tracking_no ? (
                                                            <Check size={16} className="text-green-500" />
                                                        ) : (
                                                            <Copy size={16} />
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-x-2 mb-2">
                                                        <span className="font-bold text-sm truncate">
                                                            {shipment?.tracking_no}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CustomTableCell>
                                        <CustomTableCell>
                                            {shipment.shipment?.amount || shipment.amount}
                                        </CustomTableCell>
                                        <CustomTableCell>
                                            {shipment.payment_method || shipment.payment_type}
                                        </CustomTableCell>
                                    </CustomTableRow>
                                ))}
                            </CustomTableBody>
                        </CustomTable>
                    ) : (
                        <NoRecordFound />
                    )}
                </div>

                <div className="flex justify-end mt-4">
                    <Button onClick={onClose} variant="outline">
                        <X className="w-4 h-4 mr-2" />
                        {t('Close')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ShipmentsDialog;