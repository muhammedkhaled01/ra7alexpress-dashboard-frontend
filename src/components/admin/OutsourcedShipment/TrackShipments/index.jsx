import { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShipmentDetails from './ShipmentDetails';
import Timeline from './Timeline';
import { useSearchParams } from 'react-router-dom';
import Loader from '@/components/Loader';

export default function TrackShipment() {
    const { t } = useTranslation();
    const [trackingNumber, setTrackingNumber] = useState("");
    const [shipmentData, setShipmentData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchParams] = useSearchParams();


    const handleTrackShipment = useCallback(async (e) => {
        if (!searchParams.get('tracking_no')) e.preventDefault();
        if (!trackingNumber) return;
        setLoading(true);
        setError("");
        try {
            const response = await axiosMerchant.get(`/shipments/track/${trackingNumber}`);
            if (response.data.success) {
                setShipmentData(response.data.data);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(t("Failed to track shipment. Please try again."));
        } finally {
            setLoading(false);
        }
    }, [trackingNumber, t, searchParams]);
    useEffect(() => {
        const trackingNo = searchParams.get('tracking_no');
        if (trackingNo) {
            setTrackingNumber(trackingNo);
            handleTrackShipment();
        }
    }, [searchParams, handleTrackShipment]);
    useEffect(() => {
        const trackingNo = searchParams.get('tracking_no');
        if (trackingNo) {
            setTrackingNumber(trackingNo);
            handleTrackShipment();
        }
    }, [searchParams, handleTrackShipment]);
    return (
        <div className="space-y-6">
            {!searchParams.get('tracking_no') && (
                <div className="flex flex-col md:flex-row gap-4">
                    <Input
                        type="text"
                        placeholder={t("Enter Tracking Number")}
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="flex-1"
                    />
                    <Button onClick={handleTrackShipment} disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            t("Track Shipment")
                        )}
                    </Button>
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                    {error}
                </div>
            )}
            {loading ? (
                <Loader />
            ) : shipmentData && (
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">{t("Shipment Details")}</TabsTrigger>
                        <TabsTrigger value="timeline">{t("Timeline")}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details">
                        <ShipmentDetails shipmentData={shipmentData} />
                    </TabsContent>
                    <TabsContent value="timeline">
                        <Timeline shipmentData={shipmentData} />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
