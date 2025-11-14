import React, { useState } from "react";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import PageTitle from "../Layouts/PageTitle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw, Package, Warehouse, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/Loader";
import { can, handleError, hasRole } from "@/utils/helpers";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function SorterDashboard() {
  const [results, setResults] = useState({
    inbound: null,
    warehouse: null,
    ofd: null
  });
  const [trackingInputs, setTrackingInputs] = useState({
    inbound: "",
    warehouse: "",
    ofd: ""
  });
  const [loading, setLoading] = useState({
    inbound: false,
    warehouse: false,
    ofd: false
  });
  const [refreshBtns, setRefreshBtns] = useState({
    inbound: false,
    warehouse: false,
    ofd: false
  });

  const { t } = useTranslation();
  const navigate = useNavigate();

  const canAccess = can("Sort access") || hasRole("Sorter");

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  const handleSort = async (type, e) => {
    e.preventDefault();
    const trackingNo = trackingInputs[type];
    
    if (!trackingNo || trackingNo.trim() === "") {
      toast.error(t("Please insert a tracking no"));
      return;
    }

    setLoading(prev => ({ ...prev, [type]: true }));
    setRefreshBtns(prev => ({ ...prev, [type]: true }));

    try {
      let endpoint = "";
      switch (type) {
        case "inbound":
          endpoint = "sorter/inbound_sort";
          break;
        case "warehouse":
          endpoint = "sorter/warehouse_sort";
          break;
        case "ofd":
          endpoint = "sorter/sort_ofd";
          break;
        default:
          return;
      }

      const response = await axiosMerchant.post(endpoint, {
        tracking_no: trackingNo,
      });

      setResults(prev => ({ ...prev, [type]: response.data.data }));
      toast.success(response.data.message);
    } catch (error) {
      handleError(error);
    } finally {
      setTrackingInputs(prev => ({ ...prev, [type]: "" }));
      setLoading(prev => ({ ...prev, [type]: false }));
      document.getElementById(`trackingNo-${type}`)?.focus();
    }
  };

  const handleRefresh = (type) => {
    setResults(prev => ({ ...prev, [type]: null }));
    setTrackingInputs(prev => ({ ...prev, [type]: "" }));
    setRefreshBtns(prev => ({ ...prev, [type]: false }));
  };

  const handleInputChange = (type, value) => {
    setTrackingInputs(prev => ({ ...prev, [type]: value }));
  };

  const renderSortCard = (type, title, icon, description) => {
    const isLoading = loading[type];
    const trackingNo = trackingInputs[type];
    const result = results[type];
    const showRefresh = refreshBtns[type];

    return (
      <Card key={type} className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {t(title)}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t(description)}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Form */}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSort(type, e);
            }}
          >
            <Input
              type="text"
              id={`trackingNo-${type}`}
              placeholder={t("Tracking no")}
              value={trackingNo}
              onChange={(e) => handleInputChange(type, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSort(type, e);
                }
              }}
              className="flex-grow"
            />
            <Button
              type="submit"
              disabled={isLoading}
              size="sm"
            >
              <Plus className="w-4 h-4" />
            </Button>
            {showRefresh && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => handleRefresh(type)}
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>
            )}
          </form>

          {/* Results */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader />
            </div>
          ) : result ? (
            <div className="space-y-3">
              {/* Action Display */}
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {type === 'inbound' && `${result.action} - ${result.area}`}
                  {type === 'warehouse' && `${result.action}${result.area ? ` - ${result.area}` : ""}`}
                  {type === 'ofd' && result.action}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                {type === 'inbound' && result.shipment?.tracking_no && (
                  <div className="flex justify-between">
                    <strong>{t("Tracking No")}</strong>
                    <span>{result.shipment.tracking_no}</span>
                  </div>
                )}
                
                {type === 'warehouse' && result.shipment?.tracking_no && (
                  <div className="flex justify-between">
                    <strong>{t("Tracking No")}</strong>
                    <span>{result.shipment.tracking_no}</span>
                  </div>
                )}
                
                {type === 'ofd' && (
                  <>
                    {result.tracking_no && (
                      <div className="flex justify-between">
                        <strong>{t("Tracking No")}</strong>
                        <span>{result.tracking_no}</span>
                      </div>
                    )}
                    {result.delivery_exception && (
                      <div className="flex justify-between">
                        <strong>{t("Delivery Exception")}</strong>
                        <span>{result.delivery_exception}</span>
                      </div>
                    )}
                    {result.description && (
                      <div className="flex justify-between">
                        <strong>{t("Description")}</strong>
                        <span>{result.description}</span>
                      </div>
                    )}
                    {result.future_delivery_date && (
                      <div className="flex justify-between">
                        <strong>{t("Future Delivery Date")}</strong>
                        <span>
                          {new Date(result.future_delivery_date).toDateString()}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <PageTitle title={t("Sorter Dashboard")} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {renderSortCard(
          "inbound",
          "Inbound Sort",
          <Package className="w-5 h-5" />,
          "Sort incoming packages to designated areas"
        )}
        
        {renderSortCard(
          "warehouse",
          "Warehouse Sort",
          <Warehouse className="w-5 h-5" />,
          "Sort packages within warehouse areas"
        )}
        
        {renderSortCard(
          "ofd",
          "OFD Sort",
          <Truck className="w-5 h-5" />,
          "Sort packages for out-for-delivery"
        )}
      </div>
    </div>
  );
}

export default SorterDashboard;
