import React, { useState } from "react";
import axiosMerchant from "@/axios";
import Barcode from "react-barcode";
import { useTranslation } from "react-i18next";
import PageTitle from "../Layouts/PageTitle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeIcon,
  LucideLoader,
  PrinterIcon,
  RefreshCcw,
  Search,
  TrashIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/Loader";
import View from "./View";
import { can, isAuthorized, printLabel } from "@/utils/helpers";
import { useNavigate } from "react-router-dom";

function RealtimeTracking() {
  const [shipments, setShipments] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const { t } = useTranslation();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search || search.trim() === "") {
      return;
    }
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.get(`/shipments/getSingle`, {
        params: { tracking_no: search },
      });
      setShipments(response.data.data);
    } catch (error) {
      console.error("Error fetching shipment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    setShipments(null);
  };

  const handlePrint = async (shipment) => {
    try {
      setIsPrinting((prev) => ({ ...prev, [shipment.id]: true }));
      const response = await axiosMerchant.get(`/shipments/printShipment`, {
        params: { tracking_no: shipment.tracking_no },
      });

      printLabel(response.data.html); // print backend html response
      setIsPrinting((prev) => ({ ...prev, [shipment.id]: false }));
    } catch (error) {
      setIsPrinting((prev) => ({ ...prev, [shipment.id]: false }));
      console.error("Error fetching shipment data for printing:", error);
    }
  };

  const navigate = useNavigate()

  const canAccess = can("Realtime Query access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }
  return (
    <div>
      <PageTitle title={t("Real Time Tracking")} />
      <div className="flex flex-col space-y-4 mt-2">
        <div className="flex flex-col md:flex-row w-full md:space-x-4 space-y-2 md:space-y-0">
          <form
            onSubmit={(e) => {
              e.preventDefault(); // Prevent the form from submitting
              handleSearch(e); // Call the search function manually
            }}
            className="flex w-full items-center gap-x-2"
          >
            <Input
              type="text"
              placeholder={t("Search by tracking ID")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // Prevent submission when Enter is pressed
                  handleSearch(e); // Trigger the search function
                }
              }}
              className="flex-grow"
            />
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-x-2"
            >
              <Search className="w-5 h-5" />
            </Button>
          </form>

          {refreshBtn && (
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        <hr />
        {shipments && shipments.length > 0 ? (
          shipments.map((shipment, index) => (
            <Card>
              <CardHeader>
                <CardTitle>{t("Shipment Details")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <strong>{t("Tracking No")}</strong>
                    <span>{shipment.tracking_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>{t("PayType")}</strong>
                    <span>{shipment.payment_type || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>{t("Delivery Fee")}</strong>
                    <span>{shipment.delivery_fee || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>{t("COD")}</strong>
                    <span>{shipment.amount || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>Package ID</strong>
                    <span>{shipment.package_id || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>In Warehouse</strong>
                    <span>{shipment.in_warehouse ? "Y" : "N"}</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>Note</strong>
                    <span>{shipment.note || "-"}</span>
                  </div>
                </div>
              </CardContent>
              <div className="flex justify-start p-4">
                <View
                  record={shipment}
                  tigger={
                    <Button size="icon" className="mr-2" variant="default">
                      <Eye className="h-6 w-6" />
                    </Button>
                  }
                />
                <Button
                  onClick={() => handlePrint(shipment)}
                  disabled={isPrinting[shipment.id]}
                >
                  <PrinterIcon className="h-6 w-6" />{" "}
                  {isPrinting[shipment.id] && (
                    <LucideLoader className="h-4 w-4 animate-spin mr-2 inline-block" />
                  )}
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <p>{loading ? <Loader /> : t("No shipment found.")}</p>
        )}
      </div>
    </div>
  );
}

export default RealtimeTracking;
