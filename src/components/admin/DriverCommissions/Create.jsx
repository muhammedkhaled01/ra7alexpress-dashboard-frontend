import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2, Plus } from "lucide-react";
import { authUser, handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Select from "@/components/misc/Select"
import { getCountries, getStates } from "@/stores/features/ajaxFeature";
import { useParams } from "react-router-dom";


function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [countryValue, _setCountryValue] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);

  const params = useParams()
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const countries = useSelector(store => store.ajax.countries)
  const states = useSelector(store => store.ajax.states)

  useEffect(() => {
    if (!countries) dispatch(getCountries())
    if (!states) dispatch(getStates())
  }, [])

  useEffect(() => {
    const defaultCountry = countries?.find(
      (country) => country.name === "Egypt"
    );
    if (defaultCountry) {
      setCountryValue({ value: defaultCountry.id, label: defaultCountry.name });
    }
  }, [countries])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {

      const form = new FormData(e.currentTarget);
      form.append('merchant_id', params.id)
      const response = await axiosMerchant.post("merchant_commissions/store", form);
      toast.success(response.data.message);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      setShowDialog(false);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCountryValue = (value) => {
    _setCountryValue(value);
    setFilteredStates(
      states?.filter(
        (state) => state.country_id.toString() == value.value.toString()
      )
    );
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{t("Create Merchant Commission")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("Create Commission")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className=" mt-2">
            <label htmlFor="country_id">{t("Country")}</label>
            <Select
              name="country_id"
              options={countries?.map((country) => ({
                value: country.id,
                label: country.name,
              }))}
              className="basic-multi-select"
              classNamePrefix="select"
              placeholder={t("Select a Country")}
              aria-label={t("Country")}
              required
              value={countryValue}
              onChange={(value) => setCountryValue(value)}
              defaultValue={
                countries?.find((country) => country.name === "Egypt") && {
                  value: countries.find((country) => country.name === "Egypt")
                    .id,
                  label: "Egypt",
                }
              }
            />
          </div>
          <div className="mt-2">
            <label htmlFor="state_id">{t("State")}</label>
            <Select
              name="state_id"
              options={filteredStates?.map((state) => ({
                value: state.id,
                label: state.en_name,
              }))}
              className="basic-multi-select"
              classNamePrefix="select"
            />
          </div>

          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="delivery_fee">{t("Delivery fee")}</label>
              <Input
                id="delivery_fee"
                name="delivery_fee"
                type="text"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="return_fee">{t("Return fee")}</label>
              <Input
                id="return_fee"
                name="return_fee"
                type="text"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-x-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("Close")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("Create Commission")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Create;
