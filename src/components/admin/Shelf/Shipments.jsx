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
import { can, handleError } from "@/utils/helpers";
import toast from "react-hot-toast";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageProvider";

function ShelfShipments() {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [shipments, setShipments] = useState(null)
  const [shipmentCount, setShipmentCount] = useState(null)

  const params = useParams()
  const { t } = useTranslation()
  const { language } = useLanguage()

  useEffect(() => {
    fetchShipments()
  }, [])

  const fetchShipments = async () => {
    setLoading(true)
    try {
      const response = await axiosMerchant.post("assign_shipment_to_shelf/shipments/" + params.barcode);
      setShipments(response.data.data.shipments.data)
      setLinks(response.data.data.shipments.links)
      setShipmentCount(response.data.data.count)
      setLoading(false)
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = () => {
    fetchShipments();
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const navigate = useNavigate()

  const canAccess = can("Shelf access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }


  return (
    <div>
      <Card className="">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("Shelf Shipments")} {params.barcode ? `| ${params.barcode}` : ``} {shipmentCount ? `- Shipments: ${shipmentCount}` : ``}</CardTitle>
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">#</TableHead>
                  <TableHead isFixed>{t("Tracking no")}</TableHead>
                  <TableHead>{t("Assigned by")}</TableHead>
                  <TableHead>{t("Assigned at")}</TableHead>
                  <TableHead>{t("Address")}</TableHead>
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
                      <TableCell isFixed>{shipment.shipment?.tracking_no}</TableCell>
                      <TableCell>{shipment.assigned_by?.name}</TableCell>
                      <TableCell>{new Date(shipment.shipment?.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {shipment?.shipment?.consignee?.governorate && (
                          <>
                            <b>{t("Governorate: ")}</b>
                            {language === 'en' ? shipment?.shipment?.consignee?.governorate?.en_name : shipment?.shipment?.consignee?.governorate?.ar_name}
                            <br />
                          </>
                        )}
                        {shipment?.shipment?.consignee?.state && (
                          <>
                            <b>{t("State: ")}</b>
                            {language === 'en' ? shipment?.shipment?.consignee?.state?.en_name : shipment?.shipment?.consignee?.state?.ar_name}
                            <br />
                          </>
                        )}
                        {shipment?.shipment?.consignee?.place && (
                          <>
                            <b>{t("Place: ")}</b>
                            {language === 'en' ? shipment?.shipment?.consignee?.place?.en_name : shipment?.shipment?.consignee?.place?.ar_name}
                            <br />
                          </>
                        )}
                      </TableCell>
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

export default ShelfShipments;