import { useEffect, useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import axiosMerchant from "@/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { handleError } from "@/utils/helpers";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import Select from "@/components/misc/Select"
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getCountries, getStates } from "@/stores/features/ajaxFeature";

function Edit({ onSubmitSuccess, record, onClose }) {
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
  }, [countries, states, record])

  const setCountryValue = (value) => {
    _setCountryValue(value);
    setFilteredStates(
      states?.filter(
        (state) => state.country_id.toString() == value.value.toString()
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {

      const form = new FormData(e.currentTarget);
      form.append('merchant_id', params.id)
      const response = await axiosMerchant.post("merchant_commissions/update", form);
      toast.success(response.data.message);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader id="no-print">
          <DialogTitle>{t("Edit Commission")}</DialogTitle>
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
              defaultValue={{ label: record.state.en_name, value: record.state.id }}
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
                defaultValue={record.delivery_fee}
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
                defaultValue={record.return_fee}
                required
              />
            </div>
          </div>
          <input type="hidden" name="id" value={record.id} />
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

export default Edit;
