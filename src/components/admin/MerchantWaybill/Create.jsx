import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import axiosMerchant from "@/axios";
import { toast } from 'react-hot-toast';
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import Select from "@/components/misc/Select"
import RequiredField from "@/components/misc/RequiredField"

import { can, handleError, isAuthorized } from "@/utils/helpers";
import { useTranslation } from "react-i18next";

import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { getMerchants } from "@/stores/features/ajaxFeature";

function MerchantWaybillCreate() {
  const [isLoading, setIsLoading] = useState(false);
  const [merchantWaybill, setMerchantWaybill] = useState(null)

  const params = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const merchants = useSelector(store => store.ajax.merchants)

  useEffect(() => {
    axiosMerchant.post("merchant_waybills/edit/" + params.id).then((response) => {
      setMerchantWaybill(response.data.data)
    });

    if (!merchants) dispatch(getMerchants())
  }, [])

  const [errors, setErrors] = useState({
    merchant_id: '',
    quantity: ''
  });

  const validateForm = (form) => {
    const newErrors = {
      merchant_id: form.get('merchant_id') ? '' : t('Merchant is required'),
      quantity: form.get('quantity') ? '' : t('Quantity is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!validateForm(form)) return;
    setIsLoading(true);
    try {
      const response = await axiosMerchant.post(`merchant_waybills/store`, form);
      toast.success(response.data.message);
      navigate('/merchant/waybills', { state: { from: "/create-merchant-waybill" } });
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false);
    }
  };
  const canAccess = can("Merchant Waybill create")

  if (!canAccess) {
    return navigate("/unauthorized");
  }
  
  return (
    <div>
      <Card className="">
        <CardHeader>
          <CardTitle>{t("Create Waybills for Merchant")}</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
              <div className="input-container">
                <label htmlFor="merchant_id">{t("Merchant")} <RequiredField /></label>
                <Select
                  name="merchant_id"
                  options={merchants?.map((merchant) => ({
                    value: merchant.id,
                    label: merchant.name,
                  }))}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder={t("Select Merchant...")}
                  error={errors.merchant_id}
                />
                {errors.merchant_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.merchant_id}</p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="quantity">{t("Quantity")} <RequiredField /></label>
                <Input
                  name="quantity"
                  type="number"
                  placeholder={t("Enter quantity")}
                  error={errors.quantity}
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
    </div >
  );
}

export default MerchantWaybillCreate;