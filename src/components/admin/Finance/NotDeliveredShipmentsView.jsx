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
function NotDeliveredShipmentsView({ tigger, record }) {
  const { t } = useTranslation();


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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="min-w-full  ">
              <thead>
                <tr className="font-bold">
                  <td className="px-4 py-2 border-b">{t("Tracking no")}</td>
                  <td className="px-4 py-2 border-b">{t("Consignee")}</td>
                  <td className="px-4 py-2 border-b">{t("Type")}</td>
                  <td className="px-4 py-2 border-b">{t("Amount")}</td>
                </tr>
              </thead>
              <tbody>
                {record?.map((shipment, index) => {
                  return <tr key={index}>
                    <td className="px-4 py-2 border-b">{shipment.shipment?.tracking_no}</td>
                    <td className="px-4 py-2 border-b">{shipment.shipment?.consignee?.name}</td>
                    <td className="px-4 py-2 border-b">{shipment.shipment?.payment_type}</td>
                    <td className="px-4 py-2 border-b">{shipment.shipment?.amount}</td>
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

export default NotDeliveredShipmentsView;
