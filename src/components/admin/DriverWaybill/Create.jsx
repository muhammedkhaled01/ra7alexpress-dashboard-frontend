import React, { useEffect, useState } from "react";
import axiosMerchant from "@/axios";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Select from "@/components/misc/Select";
import { Input } from "@/components/ui/input";
import RequiredField from "@/components/misc/RequiredField";
import { toast } from "react-hot-toast";
import { can, handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";

export default function DriverWaybillCreate() {
  const [isLoading, setIsLoading] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [errors, setErrors] = useState({ driver_id: "", quantity: "" });
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    axiosMerchant
      .get("/drivers/all")
      .then((res) => {
        setDrivers(res.data?.data || []);
      })
      .catch(handleError);
  }, []);

  const validateForm = (form) => {
    const newErrors = {
      driver_id: form.get("driver_id") ? "" : t("Driver is required"),
      quantity: form.get("quantity") ? "" : t("Quantity is required"),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!validateForm(form)) return;
    setIsLoading(true);
    try {
      const res = await axiosMerchant.post("driver_waybills/store", form);
      toast.success(res.data.message);
      navigate("/driver/waybills/");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const canAccess = can("Driver Waybill create");
  if (!canAccess) return navigate("/unauthorized");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Create Waybills for Driver")}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="driver_id">
                {t("Driver")} <RequiredField />
              </label>
              <Select
                name="driver_id"
                options={drivers?.map((d) => ({ value: d.user.id, label: d.user.name }))}
                placeholder={t("Select Driver...")}
                error={errors.driver_id}
              />
              {errors.driver_id && (
                <p className="mt-1 text-sm text-red-500">{errors.driver_id}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="quantity">
                {t("Quantity")} <RequiredField />
              </label>
              <Input
                name="quantity"
                type="number"
                placeholder={t("Enter quantity")}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="mt-4 ml-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("Save Changes")
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
