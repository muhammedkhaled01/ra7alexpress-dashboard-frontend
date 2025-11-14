import React, { useEffect, useState } from "react";
import axiosMerchant from "@/axios";
import { useNavigate, useParams } from "react-router-dom";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useTranslation } from "react-i18next";
import Pagination from "@/components/Pagination";
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";
import { can } from "@/utils/helpers";

function ZoneShipments() {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [shipments, setShipments] = useState(null)
  const [shipmentCount, setShipmentCount] = useState(null)
  const params = useParams()
  const { t } = useTranslation()

  useEffect(() => {
    axiosMerchant.post("zones/shipments/" + params.id).then((response) => {
      setShipments(response.data.data.data)
      setShipmentCount(response.data.success.count)
      setLoading(false)
    });
  }, [])

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const navigate = useNavigate()

  const canAccess = can("Zone access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <Card className="">
        <CardHeader>
          <CardTitle>Zone Shipments {shipmentCount ? `- ${shipmentCount}` : ``}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">#</TableHead>
                  <TableHead>{t("Tracking no")}</TableHead>
                  <TableHead>{t("governorate")}</TableHead>
                  <TableHead>{t("State")}</TableHead>
                  <TableHead>{t("Place")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>

                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : shipments && shipments.length > 0 ? (
                  shipments.map((shipment, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{shipment.shipment?.tracking_no}</TableCell>
                      <TableCell>{`${shipment.shipment?.consignee?.governorate?.en_name} / ${shipment.shipment?.consignee?.governorate?.ar_name}`}</TableCell>
                      <TableCell>{`${shipment.shipment?.consignee?.state?.en_name} / ${shipment.shipment?.consignee?.state?.ar_name}`}</TableCell>
                      <TableCell>{`${shipment.shipment?.consignee?.place?.en_name} / ${shipment.shipment?.consignee?.place?.ar_name}`}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
                      <NoRecordFound />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Pagination
              links={links}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        </CardContent>
      </Card>
    </div >
  );
}

export default ZoneShipments;