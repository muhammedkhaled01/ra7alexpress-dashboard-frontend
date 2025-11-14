import React, { useEffect, useState } from "react";
import { Copy, Check, RefreshCcw } from "lucide-react";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import PageTitle from "../Layouts/PageTitle";
import toast from "react-hot-toast";
import { can, handleError, isAuthorized } from "@/utils/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LucideLoader,
} from "lucide-react";
import Loader from "@/components/Loader";
import NoRecordFound from "@/components/NoRecordFound";
import { Input } from "@/components/ui/input";
import ImagePreview from "@/components/misc/ImagePreview";
import { useNavigate } from "react-router-dom";

function ShipmentProblems() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingShipmentId, setLoadingShipmentId] = useState(null);
  const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);

  const { t } = useTranslation();

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get("/shipments/not_deliver");
      setShipments(response.data.data);
    } catch (error) {
      toast.error("Error fetching shipments");
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleCopy = async (trackingNo) => {
    await navigator.clipboard.writeText(trackingNo);
    setCopiedTrackingNo(trackingNo);
    setTimeout(() => {
      setCopiedTrackingNo(null);
    }, 2000);
  };

  const markResolved = async (shipment) => {
    setLoadingShipmentId(shipment.id);
    try {
      const response = await axiosMerchant.post("shipments/mark_resolved", {
        id: shipment.id,
      });
      toast.success(response.data.message || "Shipment marked as resolved");
      setShipments((prev) =>
        prev.map((o) => (o.id === shipment.id ? { ...o, status: "Resolved" } : o))
      );
      fetchShipments()
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingShipmentId(null);
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    fetchShipments();
  };

  const filteredShipments = shipments.filter(
    (shipment) =>
      shipment.tracking_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.merchant?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.consignee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigate = useNavigate()

  const canAccess = can("Problems access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div className="p-4">
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0">
          <CardTitle>
            <PageTitle title={t("Not Deliver (Problems)")} />
          </CardTitle>
          <div className="flex gap-x-2 items-center">
            <Input
              name="search"
              type="text"
              className="w-[200px]"
              value={searchTerm}
              placeholder={t("Search")}
              onChange={(e) => setSearchTerm(e.target.value)}
              // icon={
              //   <RefreshCcw className="w-4 h-4 cursor-pointer" onClick={handleRefresh} />
              // }
            />
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead isFixed>{t("Tracking No")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("Proof")}</TableHead>
                {/* <TableHead>{t("Merchant")}</TableHead> */}
                {/* <TableHead>{t("Consignee")}</TableHead> */}
                <TableHead>{t("Action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    <Loader />
                  </TableCell>
                </TableRow>
              ) : filteredShipments.length > 0 ? (
                filteredShipments.map((shipment, index) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell isFixed>
                      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-x-2">
                        <button
                          onClick={() => handleCopy(shipment.tracking_no)}
                          className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                          aria-label="Copy tracking number"
                        >
                          {copiedTrackingNo === shipment.tracking_no ? (
                            <Check size={18} className="text-green-500" />
                          ) : (
                            <Copy size={18} />
                          )}
                        </button>
                        <span className="font-medium">{shipment.tracking_no}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Badge
                        variant={shipment.in_exception ? "destructive" : "outline"}
                        className="hover:cursor-pointer"
                      >
                        {shipment?.core_exception?.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex items-center justify-center">{shipment?.in_exception ? <ImagePreview style={{ width: '100px', height: '100px' }} src={shipment?.core_exception?.proof} /> : ''}</TableCell>
                    {/* <TableCell>
                      {shipment?.is_walkin ? (
                        <div>
                          {shipment?.customer_name} <br /> {shipment?.customer_phone}
                        </div>
                      ) : (
                        <div>{shipment?.merchant?.name}</div>
                      )}
                    </TableCell>
                    <TableCell>{shipment.consignee?.name}</TableCell> */}
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => markResolved(shipment)}
                        disabled={loadingShipmentId === shipment.id}
                      >
                        {loadingShipmentId === shipment.id ? (
                          <LucideLoader className="animate-spin h-4 w-4" />
                        ) : (
                          t("Mark Resolved")
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    <NoRecordFound />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default ShipmentProblems;
