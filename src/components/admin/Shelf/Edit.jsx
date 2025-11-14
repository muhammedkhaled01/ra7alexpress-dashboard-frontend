import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { handleError } from "@/utils/helpers";
import { useDispatch, useSelector } from "react-redux";
import {
  getCities,
  getCountries,
  getStates,
} from "@/stores/features/ajaxFeature";
import Select from "@/components/misc/Select";

function Edit({ onSubmitSuccess, record, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [countryValue, _setCountryValue] = useState([]);
  const [stateValue, _setStateValue] = useState([]);
  const [cityValue, setCityValue] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const countries = useSelector((store) => store.ajax.countries);
  const states = useSelector((store) => store.ajax.states);
  const cities = useSelector((store) => store.ajax.cities);

  useEffect(() => {
    if (!countries) {
      dispatch(getCountries());
    }
    if (!states) {
      dispatch(getStates());
    }
    if (!cities) {
      dispatch(getCities());
    }

    setCountryValue({ value: record.country?.id, label: record.country?.name });
    setStateValue({ value: record.state?.id, label: record.state?.name });
    setCityValue({ value: record.city?.id, label: record.city?.name });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await axiosMerchant.post("hubs/update", formData);
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

  const setCountryValue = (value) => {
    _setCountryValue(value);
    setStateValue("");
    setCityValue("");
    setFilteredStates(
      states?.filter(
        (state) => state.country_id?.toString() == value.value?.toString()
      )
    );
  };

  const setStateValue = (value) => {
    _setStateValue(value);
    setCityValue("");
    setFilteredCities(
      cities?.filter(
        (city) => city.state_id?.toString() == value.value?.toString()
      )
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("Update Hub")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name">{t("Hub Name")}</label>
              <Input
                id="name"
                name="name"
                type="text"
                defaultValue={record.name}
                required
              />
            </div>

            <div className="input-container">
              <label htmlFor="contact_number">{t("Contact Number")}</label>
              <Input
                id="contact_number"
                name="contact_number"
                type="text"
                defaultValue={record.contact_number}
                required
              />
            </div>

            <div className="input-container">
              <label htmlFor="country_id">{t("Country")}</label>
              <Select
                name="country_id"
                options={countries?.map((country) => ({
                  value: country.id,
                  label: country.name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={countryValue}
                onChange={(value) => setCountryValue(value)}
              />
            </div>
            <div className="input-container">
              <label htmlFor="state_id">{t("State")}</label>
              <Select
                name="state_id"
                options={filteredStates?.map((state) => ({
                  value: state.id,
                  label: state.name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={stateValue}
                onChange={(value) => setStateValue(value)}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="city_id">{t("City")}</label>
              <Select
                name="city_id"
                options={filteredCities?.map((city) => ({
                  value: city.id,
                  label: city.name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={cityValue}
                onChange={(value) => setCityValue(value)}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="location">{t("Location")}</label>
              <Input
                id="location"
                name="location"
                type="text"
                defaultValue={record.location}
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
                t("Save Changes")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Edit;
