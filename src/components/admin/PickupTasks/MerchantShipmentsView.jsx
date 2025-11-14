import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { capitalize, consigneeAddress } from "@/utils/helpers";
import { Badge } from "@/components/ui/badge";

function MerchantShipmentsView({ trigger, shipments, merchantName }) {
  const { t } = useTranslation();
  
  return (
    <Sheet>
      <SheetTrigger>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:w-1/2 p-4 space-y-4">
        <SheetHeader>
          <SheetTitle>{t("Merchant Shipments")} - {merchantName}</SheetTitle>
          <SheetDescription>{t("Shows all created shipments for the selected merchant")}</SheetDescription>
        </SheetHeader>
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-row justify-between">
              {t("Shipments")} ({shipments?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="min-w-full">
              <thead>
                <tr className="font-bold">
                  <td className="px-4 py-2 border-b">{t("Tracking no")}</td>
                  <td className="px-4 py-2 border-b">{t("Consignee")}</td>
                  <td className="px-4 py-2 border-b">{t("Address")}</td>
                  <td className="px-4 py-2 border-b">{t("Amount")}</td>
                  <td className="px-4 py-2 border-b">{t("Payment Type")}</td>
                  <td className="px-4 py-2 border-b">{t("Status")}</td>
                  <td className="px-4 py-2 border-b">{t("Created At")}</td>
                </tr>
              </thead>
              <tbody>
                {shipments?.map((shipment, index) => {
                  return (
                    <tr key={index}>
                      <td className="px-4 py-2 border-b">{shipment.tracking_no}</td>
                      <td className="px-4 py-2 border-b">{shipment.consignee?.name}</td>
                      <td className="px-4 py-2 border-b">{consigneeAddress(shipment.consignee)}</td>
                      <td className="px-4 py-2 border-b">{shipment.amount}</td>
                      <td className="px-4 py-2 border-b">{shipment.payment_type}</td>
                      <td className="px-4 py-2 border-b">
                        <Badge>{capitalize(shipment.status)}</Badge>
                      </td>
                      <td className="px-4 py-2 border-b">
                        {new Date(shipment.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {(!shipments || shipments.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-2 border-b text-center">
                      {t("No shipments found")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet>
  );
}

export default MerchantShipmentsView; 