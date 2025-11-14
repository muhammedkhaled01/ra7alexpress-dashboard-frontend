import React, { useState } from "react";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import PageTitle from "../Layouts/PageTitle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Loader from "@/components/Loader";
import { handleError } from "@/utils/helpers";
import toast from "react-hot-toast";

function WarehouseSort() {
  const [data, setData] = useState(null);
  const [trackingNo, setTrackingNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshBtn, setRefreshBtn] = useState(false);

  const { t } = useTranslation();

  const handleSort = async (e) => {
    e.preventDefault();
    if (!trackingNo || trackingNo.trim() === "") {
      toast.error("Please insert a tracking no");
      return;
    }
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.post(`sorter/warehouse_sort`, {
        tracking_no: trackingNo,
      });
      setData(response.data.data);
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
    setTrackingNo("");
    setRefreshBtn(false);
  };

  return (
    <div>
      <PageTitle title={t(`Warehouse Sort`)} />
      <div className="flex flex-col space-y-4 mt-2">
        <div className="flex flex-col md:flex-row w-full md:space-x-4 space-y-2 md:space-y-0">
          <form
            className="flex w-full items-center gap-x-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSort(e);
            }}
          >
            <Input
              type="text"
              id="trackingNo"
              placeholder={t("Tracking no")}
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSort(e);
                }
              }}
              className="flex-grow"
            />
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-x-2"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </form>

          {refreshBtn && (
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        <hr />
        {data ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {t(
                  `Shipment Details ${
                    data.shipment?.tracking_no
                      ? `| Shipment: ${data.shipment?.tracking_no}`
                      : ``
                  }`
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl justify-self-center">{`${data.action} - ${data.area}`}</p>
              <br />
              <br />
            </CardContent>
          </Card>
        ) : (
          <p>{loading ? <Loader /> : t("No shipment found.")}</p>
        )}
      </div>
    </div>
  );
}

export default WarehouseSort;
