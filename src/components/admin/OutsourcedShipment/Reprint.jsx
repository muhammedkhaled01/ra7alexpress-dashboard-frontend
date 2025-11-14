import React, { useState, useEffect, useCallback } from 'react';
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import PageTitle from "../Layouts/PageTitle";
import { Input } from "@/components/ui/input";
// Button import removed as it was unused
import { PrinterIcon, Loader2 } from "lucide-react";
import { printLabel, handleError, isAuthorized, can } from "@/utils/helpers";
import toast from 'react-hot-toast';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

export default function Reprint() {
    const [trackingNo, setTrackingNo] = useState('');
    const [isPrinting, setIsPrinting] = useState(false);
    const { t } = useTranslation();

    const handlePrint = useCallback(async (trackingNo) => {
        if (!trackingNo || trackingNo.trim() === '') {
            toast.error(t('Please enter a tracking number'));
            return;
        }
        setIsPrinting(true);
        try {
            const response = await axiosMerchant.get(`/shipments/printShipment`, {
                params: { tracking_no: trackingNo, }
            });
            printLabel(response.data.html);
            setTrackingNo('');
            toast.success(t('Shipment printed successfully'));
        } catch (error) {
            handleError(error);
        } finally {
            setIsPrinting(false);
        }
    }, []);

    useEffect(() => {
        if (trackingNo.trim() !== '') {
            const timer = setTimeout(() => {
                handlePrint(trackingNo);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [trackingNo, handlePrint]);

    const navigate = useNavigate()

    const canAccess = can("Outsourced Shipment update")

    if (!canAccess) {
        return navigate("/unauthorized");
    }


    return (
        <div>
            <PageTitle title={t('Reprint Shipment')} />
            <div className='mt-4 input-container'>
                <Label>{t("Enter Tracking Number To Print")}</Label>
                <Input
                    type='text'
                    placeholder={t('Enter tracking no...')}
                    value={trackingNo}
                    onChange={(e) => setTrackingNo(e.target.value)}
                    className='w-full'
                    icon={
                        isPrinting ? (
                            <Loader2 className='w-4 h-4 animate-spin' />
                        ) : (
                            <PrinterIcon className='w-4 h-4' />
                        )
                    }
                />
            </div>
        </div>
    );
}
