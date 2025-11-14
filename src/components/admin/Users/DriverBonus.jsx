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
import { useNavigate, useParams } from "react-router-dom";
import {
  can,
  formatDecimalValue,
  handleError,
  isAuthorized,
} from "@/utils/helpers";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Loader2, Zap } from "lucide-react";
import { useSelector } from "react-redux";

const DriverBonus = () => {
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState([]);
  const [driverData, setDriverData] = useState(null);
  const [btnLoading, setBtnLoading] = useState(null);
  const [formData, setFormData] = useState({});
  const [defaultBonus, setDefaultBonus] = useState(0);
  const params = useParams();
  const { decimalPrecision } = useSelector((state) => state.setting);

  const { t } = useTranslation();

  useEffect(() => {
    fetchDriverData();
    fetchBonuses();
  }, []);
  useEffect(() => {
    if (states.length > 0) {
      const updatedFormData = {};
      Object.entries(formData).forEach(([stateId, bonuses]) => {
        updatedFormData[stateId] = {
          delivery_bonus: formatDecimalValue(
            bonuses.delivery_bonus,
            decimalPrecision
          ),
          pickup_bonus: formatDecimalValue(
            bonuses.pickup_bonus,
            decimalPrecision
          ),
        };
      });
      setFormData(updatedFormData);
      setDefaultBonus(formatDecimalValue(defaultBonus, decimalPrecision));
    }
  }, [decimalPrecision]);

  const fetchDriverData = async () => {
    try {
      const response = await axiosMerchant.get("drivers/getSingle", {
        params: { driver_id: params.driver_id },
      });

      const initialFormData = {};
      response.data.data.states.forEach((state) => {
        initialFormData[state.id] = {
          delivery_bonus: formatDecimalValue(0, decimalPrecision),
          pickup_bonus: formatDecimalValue(0, decimalPrecision),
        };
      });

      setStates(response.data.data.states);
      setDriverData(response.data.data);
      setFormData(initialFormData);
    } catch (error) {
      console.error("Error fetching driver data:", error);
    }
  };

  const fetchBonuses = async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get("driver_bonuses", {
        params: { driver_id: params.driver_id },
      });

      const initialFormData = {};
      response.data.data.forEach((commission) => {
        initialFormData[commission.state_id] = {
          delivery_bonus: formatDecimalValue(
            commission.delivery_bonus,
            decimalPrecision
          ),
          pickup_bonus: formatDecimalValue(
            commission.pickup_bonus,
            decimalPrecision
          ),
        };
      });

      setFormData(initialFormData);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const validateDecimalInput = (value) => {
    const regex = new RegExp(`^\\d*\\.?\\d{0,${decimalPrecision || 3}}$`);
    return regex.test(value);
  };

  const handleInputChange = (stateId, value, type) => {
    if (!validateDecimalInput(value)) {
      return;
    }

    const parts = value.split(".");

    if (parts.length === 2 && parts[1].length > (decimalPrecision || 3)) {
      value = `${parts[0]}.${parts[1].substring(0, decimalPrecision || 3)}`;
    }

    setFormData((prev) => ({
      ...prev,
      [stateId]: {
        ...prev[stateId],
        [type]: value,
      },
    }));
  };

  const handleDefaultBonus = (type) => {
    const formattedBonus = formatDecimalValue(defaultBonus, decimalPrecision);
    setFormData((prev) => {
      const newFormData = { ...prev };
      states.forEach((state) => {
        newFormData[state.id] = {
          ...prev[state.id],
          [type]: formattedBonus,
        };
      });
      return newFormData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBtnLoading(true);

    // تحويل القيم إلى أرقام قبل الإرسال
    const payload = {
      driver_id: params.driver_id,
      bonuses: Object.entries(formData).map(([state_id, bonus]) => ({
        state_id,
        delivery_bonus: parseFloat(bonus.delivery_bonus) || 0,
        pickup_bonus: parseFloat(bonus.pickup_bonus) || 0,
      })),
    };

    console.log(payload);

    try {
      const response = await axiosMerchant.post("driver_bonuses/store", payload);
      toast.success(response.data.message);
      fetchBonuses();
      navigate("/drivers");
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading(false);
    }
  };

  const navigate = useNavigate();

  const canAccess = can("Driver Bonus access");

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <div className="flex flex-row justify-between">
        <PageTitle
          title={`Driver Bonuses ${driverData ? ` | ${driverData.name}` : ""}`}
        />
        <div className="flex gap-x-2 items-center">
          <Button type="button" onClick={handleSubmit} disabled={btnLoading}>
            {btnLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t("Save")
            )}
          </Button>
          <Input
            name="defaultBonus"
            type="text"
            className="w-[200px]"
            placeholder={t("Default Bonus")}
            value={defaultBonus}
            onChange={(e) => {
              const value = e.target.value;
              if (validateDecimalInput(value)) {
                setDefaultBonus(value);
              }
            }}
            onBlur={(e) => {
              setDefaultBonus(
                formatDecimalValue(e.target.value, decimalPrecision)
              );
            }}
          />

          <Button
            type="button"
            variant="refresh"
            onClick={() => handleDefaultBonus("delivery_bonus")}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {t("Apply All Delivery Bonus")}
          </Button>
          <Button
            type="button"
            variant="refresh"
            onClick={() => handleDefaultBonus("pickup_bonus")}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {t("Apply All Pickup Bonus")}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 shadow-md py-4 mt-2 rounded-lg flex flex-col">
          <form onSubmit={handleSubmit}>
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="px-2 py-1">#</TableHead>
                  <TableHead className="px-2 py-1">{t("State")}</TableHead>
                  <TableHead className="px-2 py-1">
                    {t("Delivery Bonus")}
                  </TableHead>
                  <TableHead className="px-2 py-1">
                    {t("Pickup Bonus")}
                  </TableHead>
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
                          type="text"
                          className="w-24 h-8 text-xs px-1"
                          value={
                            formData[state.id]?.delivery_bonus ||
                            formatDecimalValue(0, decimalPrecision)
                          }
                          onChange={(e) =>
                            handleInputChange(
                              state.id,
                              e.target.value,
                              "delivery_bonus"
                            )
                          }
                          onBlur={(e) => {
                            handleInputChange(
                              state.id,
                              formatDecimalValue(
                                e.target.value,
                                decimalPrecision
                              ),
                              "delivery_bonus"
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <Input
                          type="text"
                          className="w-24 h-8 text-xs px-1"
                          value={
                            formData[state.id]?.pickup_bonus ||
                            formatDecimalValue(0, decimalPrecision)
                          }
                          onChange={(e) =>
                            handleInputChange(
                              state.id,
                              e.target.value,
                              "pickup_bonus"
                            )
                          }
                          onBlur={(e) => {
                            handleInputChange(
                              state.id,
                              formatDecimalValue(
                                e.target.value,
                                decimalPrecision
                              ),
                              "pickup_bonus"
                            );
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-2">
                      No states found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="mt-4">
              <Button type="submit" disabled={btnLoading}>
                {btnLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("Save")
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DriverBonus;
