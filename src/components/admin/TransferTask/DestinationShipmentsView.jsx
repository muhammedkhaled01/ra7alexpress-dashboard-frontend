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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";

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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Tracking no")}</TableHead>
                  <TableHead>{t("Consignee")}</TableHead>
                  <TableHead>{t("Address")}</TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Transfered on")}</TableHead>
                  <TableHead>{t("Type")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {record?.map((shipment, index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell>{shipment.shipment?.tracking_no}</TableCell>
                      <TableCell>{shipment.shipment.consignee?.name}</TableCell>
                      <TableCell colSpan={6}>{consigneeAddress(shipment.shipment.consignee)}</TableCell>
                      <TableCell>
                        <Badge>{capitalize(shipment.status)}</Badge>
                      </TableCell>
                      <TableCell>{new Date(shipment.created_at).toLocaleString()}</TableCell>
                      <TableCell>{shipment.shipment.payment_type}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet >
  );
}

export default View;
