import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import Loader from "@/components/Loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { can, handleError } from "@/utils/helpers";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { ArrowUp, Loader2, Plus, Sheet, Zap } from "lucide-react";

const CompanyCommission = () => {
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [companyData, setCompanyData] = useState(null);
  const [formData, setFormData] = useState({});
  const [btnLoading, setBtnLoading] = useState(false);
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(0);
  const [defaultPickupFee, setDefaultPickupFee] = useState(0);

  const params = useParams();
  const dispatch = useDispatch();

  const { t } = useTranslation();

  useEffect(() => {
    fetchCompanyData();
    fetchCommissions();
  }, []);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get("companies/view", {
        params: { company_id: params.company_id },
      });

      const initialFormData = {};
      response.data.data.states.forEach((state) => {
        initialFormData[state.id] = 0;
      });

      setStates(response.data.data.states);
      setCompanyData(response.data.data);
      setFormData(initialFormData);
    } catch (error) {
      console.error("Error fetching company data:", error);
    }
  };

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get("companies/commissions", {
        params: { company_id: params.company_id },
      });

      setCommissions(response.data.data);

      const initialFormData = {};
      response.data.data.forEach((commission) => {
        initialFormData[commission.state_id] = {
          delivery_fee: commission.delivery_fee,
          pickup_fee: commission.pickup_fee,
        };
      });

      setFormData(initialFormData);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (stateId, value, type) => {
    setFormData((prev) => ({
      ...prev,
      [stateId]: {
        ...prev[stateId],
        [type]: value,
      },
    }));
  };

  const handleDefaultCommissions = async () => {
    if ((!defaultDeliveryFee || defaultDeliveryFee <= 0) && (!defaultPickupFee || defaultPickupFee <= 0)) {
      toast.error(t("Please enter valid default commission values"));
      return;
    }

    setFormData((prev) => {
      const newFormData = { ...prev };
      // Apply to all states
      states.forEach(state => {
        newFormData[state.id] = {
          delivery_fee: parseFloat(defaultDeliveryFee) || 0,
          pickup_fee: parseFloat(defaultPickupFee) || 0,
        };
      });
      return newFormData;
    });
  };

  const handleExport = async () => {
    setBtnLoading(true);
    try {
      const response = await axiosMerchant.get(
        `companies/export_commissions/${params.company_id}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", "commissions.csv");
      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t("Commissions downloaded successfully."));
    } catch (error) {
      console.error("Download failed:", error);
      handleError(error);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();

    const payload = {
      company_id: params.company_id,
      commissions: Object.entries(formData).map(([state_id, fee]) => ({
        state_id,
        delivery_fee: fee.delivery_fee || 0,
        pickup_fee: fee.pickup_fee || 0,
      })),
    };

    console.log(payload);

    try {
      const response = await axiosMerchant.post(
        "companies/store_commissions",
        payload
      );
      toast.success(response.data.message);
      fetchCommissions();
    } catch (error) {
      handleError(error);
    }
  };

  const navigate = useNavigate()

  const canAccess = can("Company access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <div className="flex justify-between">
        <PageTitle
          title={t("Company Commissions") + (companyData ? ` | ${companyData.name}` : "")}
        />
        <div className="flex flex-row gap-x-2">
          <Button disabled={btnLoading} onClick={(e) => handleExport()}>
            {btnLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sheet />
                {t("Export")}
              </>
            )}
          </Button>
          <Link to={"import"}>
            <Button type="button" className="flex items-center space-x-1">
              <ArrowUp className="w-4 h-4" />
              <span>{t("Import")}</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-row justify-end mt-4">
        <div className="flex gap-x-2 items-center">
          <Input
            name="defaultDeliveryFee"
            type="number"
            className="w-[100px]"
            placeholder={t("Default Delivery Fee")}
            value={defaultDeliveryFee}
            onChange={(e) => setDefaultDeliveryFee(e.target.value)}
            min="0"
            step="0.01"
          />
          <Input
            name="defaultPickupFee"
            type="number"
            className="w-[100px]"
            placeholder={t("Default Pickup Fee")}
            value={defaultPickupFee}
            onChange={(e) => setDefaultPickupFee(e.target.value)}
            min="0"
            step="0.01"
          />
          <Button
            type="button"
            variant="refresh"
            onClick={handleDefaultCommissions}
            title={t("Apply to All States")}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {t("Apply to All")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 shadow-md py-4 mt-2 rounded-lg flex flex-col">
          <form onSubmit={handleSubmit}>
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="px-2 py-1">{t("#")}</TableHead>
                  <TableHead className="px-2 py-1">{t("State")}</TableHead>
                  <TableHead className="px-2 py-1">
                    {t("Delivery Fee")}
                  </TableHead>
                  <TableHead className="px-2 py-1">{t("Pickup Fee")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-2">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : states.length > 0 ? (
                  states.map((state, index) => (
                    <TableRow key={state.id} className="text-xs">
                      <TableCell className="px-2 py-1">{index + 1}</TableCell>
                      <TableCell className="px-2 py-1">
                        {state.en_name}/{state.ar_name}
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <Input
                          type="number"
                          className="w-24 h-8 text-xs px-1"
                          value={formData[state.id]?.delivery_fee || 0}
                          onChange={(e) =>
                            handleInputChange(
                              state.id,
                              e.target.value,
                              "delivery_fee"
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <Input
                          type="number"
                          className="w-24 h-8 text-xs px-1"
                          value={formData[state.id]?.pickup_fee || 0}
                          onChange={(e) =>
                            handleInputChange(
                              state.id,
                              e.target.value,
                              "pickup_fee"
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-2">
                      {t("No states found.")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="mt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("Confirm")
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanyCommission;
