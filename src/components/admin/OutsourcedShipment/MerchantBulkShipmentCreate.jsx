import React, { useState, createRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MerchantShipmentCreate from "./MerchantShipmentCreate";
import { Plus, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { generateTabId } from "@/utils/helpers";

function MerchantBulkShipmentCreate() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [shipmentForms, setShipmentForms] = useState([{ id: Date.now(), ref: createRef() }]);

    const addShipmentForm = () => {
        setShipmentForms((prev) => [...prev, { id: Date.now(), ref: createRef() }]);
    };

    const removeShipmentForm = (id) => {
        setShipmentForms((prev) => prev.filter((f) => f.id !== id));
    };

    const handleSaved = (id) => {
        // Once an shipment is saved, we can remove the form or keep it – for now, remove it
        removeShipmentForm(id);
    };

    const [isSavingAll, setIsSavingAll] = useState(false);
    const handleSaveAll = async () => {
        setIsSavingAll(true);
        try {
            for (const form of shipmentForms) {
                if (form.ref?.current?.submitShipment) {
                    await form.ref.current.submitShipment();
                }
            }
            toast.success(t("All shipments saved"));
            const currentTabId = generateTabId("/merchant/shipments/bulk-shipments-create");
            navigate("/shipments", { state: { closeTabId: currentTabId } });
        } catch (err) {
            // errors are already handled inside each form
        } finally {
            setIsSavingAll(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between py-3 border-b">
                <h2 className="text-2xl font-semibold dark:text-white">
                    {t("Bulk Shipment Creation")}
                </h2>
                {/* <div className="flex gap-2">
                    <Button onClick={addShipmentForm} variant="outline">
                        <Plus className="w-4 h-4 mr-2" /> {t("Add Shipment")}
                    </Button>
                    <Button onClick={handleSaveAll} disabled={isSavingAll}>
                        {isSavingAll ? t("Saving...") : t("Save All")}
                    </Button>
                </div> */}
            </div>

            {/* Scrollable Forms */}
            {shipmentForms.map((form, idx) => (
                <Card key={form.id} className="mb-4">
                    <CardHeader className="flex flex-row items-center justify-between py-2">
                        <CardTitle>
                            {t("Shipment")} #{idx + 1}
                        </CardTitle>
                        {shipmentForms.length > 1 && (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeShipmentForm(form.id)}
                            >
                                <Trash2Icon className="w-4 h-4 text-red-500" />
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <MerchantShipmentCreate
                            ref={form.ref}
                            bulkMode
                            onShipmentSaved={() => handleSaved(form.id)}
                        />
                    </CardContent>
                </Card>
            ))}

            {/* Floating Action Buttons */}
            <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
                <Button onClick={addShipmentForm} variant="outline" className="shadow-lg">
                    <Plus className="w-4 h-4 mr-2" /> {t("Add Shipment")}
                </Button>
                <Button onClick={handleSaveAll} disabled={isSavingAll} className="shadow-lg">
                    {isSavingAll ? t("Saving...") : t("Save All")}
                </Button>
            </div>
        </div>
    );
}

export default MerchantBulkShipmentCreate; 