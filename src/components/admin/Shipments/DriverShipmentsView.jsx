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
import { consigneeAddress } from "@/utils/helpers";
function View({ tigger, record }) {
  const { t } = useTranslation();
  const totalAmount = record?.reduce((sum, shipment) => sum + parseFloat(shipment.amount || 0), 0) || 0;
  return (
    <Sheet>
      <SheetTrigger>{tigger}</SheetTrigger>
      <SheetContent className="w-full sm:w-1/2 p-4 space-y-4">
        <SheetHeader>
          <SheetTitle>{t("Shipments")}</SheetTitle>
          <SheetDescription>{t("Shows all the shipments for the driver")}</SheetDescription>
        </SheetHeader>
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-row justify-between">
              {t("Shipments")}
              <span className="text-2xl">Total: {totalAmount}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="min-w-full  ">
              <thead>
                <tr className="font-bold">
                  <td className="px-4 py-2 border-b">{t("Tracking no")}</td>
                  <td className="px-4 py-2 border-b">{t("Consignee")}</td>
                  <td className="px-4 py-2 border-b">{t("Address")}</td>
                  <td className="px-4 py-2 border-b">{t("Assigned at")}</td>
                  <td className="px-4 py-2 border-b">{t("Type")}</td>
                  <td className="px-4 py-2 border-b">{t("Amount")}</td>
                </tr>
              </thead>
              <tbody>
                {record?.map((shipment, index) => {
                  return <tr key={index}>
                    <td className="px-4 py-2 border-b">{shipment.tracking_no}</td>
                    <td className="px-4 py-2 border-b">{shipment.consignee?.name}</td>
                    <td className="px-4 py-2 border-b">{consigneeAddress(shipment.consignee)}</td>
                    <td className="px-4 py-2 border-b">{new Date(shipment.driver_assignments[0]?.assigned_at).toLocaleString()}</td>
                    <td className="px-4 py-2 border-b">{shipment.payment_type}</td>
                    <td className="px-4 py-2 border-b">{shipment.amount}</td>
                  </tr>
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet >
  );
}

export default View;
