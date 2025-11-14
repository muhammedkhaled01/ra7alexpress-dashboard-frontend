import React, { useState } from "react";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import PageTitle from "../Layouts/PageTitle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Loader from "@/components/Loader";
import { can, handleError, hasRole } from "@/utils/helpers";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function UnloadShipment() {
  const [shipments, setShipments] = useState(null);
  const [trackingNo, setTrackingNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [truckBarcode, setTruckBarcode] = useState(null);

  const { t } = useTranslation();

  const handleUnload = async (e) => {
    e.preventDefault();
    if (!trackingNo || trackingNo.trim() === "") {
      toast.error("Please insert a tracking no");
      return;
    }
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.post(`sorter/unload`, {
        tracking_no: trackingNo,

        truck_barcode: truckBarcode,
      });
      setShipments(response.data.data);
      console.log(response);
    } catch (error) {
      handleError(error);
    } finally {
      setTrackingNo("");
      setLoading(false);
      document.getElementById("trackingNo")?.focus();
    }
  };

  const handleRefresh = () => {
    setShipments(null);
    setTruckBarcode(null);
    setTrackingNo("");
    setRefreshBtn(false);
  };

  const navigate = useNavigate()

  const canAccess = can("Sort access") || hasRole("Sorter")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <PageTitle
        title={
          `${t("Unload Shipments")} ${truckBarcode
            ? `| ${t("Barcode")}: ${truckBarcode}`
            : ``
          }`
        }
      />

      <div className="flex flex-col space-y-4 mt-2">
        <div className="flex flex-col md:flex-row w-full md:space-x-4 space-y-2 md:space-y-0">
          <form
            className="flex w-full items-center gap-x-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleUnload(e);
            }}
          >
            {!truckBarcode && (
              <div className="w-full">
                <Input
                  name="truck_barcode"
                  value={truckBarcode}
                  onChange={(e) => setTruckBarcode(e.target.value)}
                  placeholder={t("Scan Barcode of Truck")}
                  required
                />
              </div>
            )}
            {truckBarcode && (
              <Input
                type="text"
                id="trackingNo"
                placeholder={t("Tracking no")}
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUnload(e);
                  }
                }}
                className="flex-grow"
              />
            )}
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-x-2"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </form>

            <Button type="button" variant="refresh" onClick={handleRefresh}>
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>

        <hr />
        {shipments ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {t(
                  `Shipment Details ${shipments.tracking_no ? `| Shipment: ${shipments.tracking_no}` : ``
                  }`
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <strong className="text-3xl justify-self-center">{shipments.action}</strong>
              <br />
              <br />
            </CardContent>
          </Card>
        ) : (
          <p>{loading ? <Loader /> : ``}</p>
        )}
      </div>
    </div>
  );
}

export default UnloadShipment;
