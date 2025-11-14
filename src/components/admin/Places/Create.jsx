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
import { useDispatch, useSelector } from "react-redux";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import { getCountries, getStates } from "@/stores/features/ajaxFeature";

function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    country_id: null,
    state_id: null,
    en_name: '',
    ar_name: ''
  });
  const [errors, setErrors] = useState({
    country_id: '',
    state_id: '',
    en_name: '',
    ar_name: ''
  });

  const [countryValue, _setCountryValue] = useState({ label: "Egypt", value: "165" });
  const [filteredStates, setFilteredStates] = useState([]);
  const [stateValue, setStateValue] = useState(null);

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const countries = useSelector((store) => store.ajax.countries);
  const states = useSelector((store) => store.ajax.states);

  // Set initial filtered states to show all states
  useEffect(() => {
    if (states) {
      setFilteredStates(states);
    }
  }, [states]);

  useEffect(() => {
    if (!countries) {
      dispatch(getCountries());
    }
    if (!states) {
      dispatch(getStates());
    }
  }, []);

  const validateForm = () => {
    const newErrors = {
      country_id: formData.country_id ? '' : t('Country is required'),
      state_id: formData.state_id ? '' : t('State is required'),
      en_name: formData.en_name ? '' : t('English name is required'),
      ar_name: '' // Arabic name is optional
    };
    
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      const response = await axiosMerchant.post("places/store", form);
      toast.success(response.data.message);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      setShowDialog(false);
    } catch (error) {
      handleError(error);
      setShowDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const setCountryValue = (value) => {
    _setCountryValue(value);
    setStateValue(null); // Clear the state value when country changes
    setFilteredStates(
      states?.filter(
        (state) => state.country_id.toString() == value.value.toString()
      )
    );
    setFormData(prev => ({ ...prev, country_id: value?.value, state_id: null }));
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{t("Create Place")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("Create Place")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="en_name">{t("englishName")} <RequiredField /></label>
              <Input
                id="en_name"
                name="en_name"
                type="text"
                value={formData.en_name}
                onChange={(e) => setFormData(prev => ({ ...prev, en_name: e.target.value }))}
                placeholder={t("Enter English name...")}
                error={errors.en_name}
              />
              {errors.en_name && (
                <p className="mt-1 text-sm text-red-500">{errors.en_name}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="ar_name">
                {t("arabicName")} <span className="text-xs">({t("optional")})</span>
              </label>
              <Input
                id="ar_name"
                name="ar_name"
                type="text"
                value={formData.ar_name}
                onChange={(e) => setFormData(prev => ({ ...prev, ar_name: e.target.value }))}
                placeholder={t("Enter Arabic name...")}
                error={errors.ar_name}
              />
              {errors.ar_name && (
                <p className="mt-1 text-sm text-red-500">{errors.ar_name}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="country_id">{t("Country")} <RequiredField /></label>
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
                value={countryValue}
                onChange={(value) => {
                  setCountryValue(value);
                  setFormData(prev => ({ ...prev, country_id: value?.value, state_id: null }));
                }}
                defaultValue={
                  countries?.find((country) => country.name === "Egypt") && {
                    value: countries.find((country) => country.name === "Egypt")
                      .id,
                    label: "Egypt",
                  }
                }
                error={errors.country_id}
              />
              {errors.country_id && (
                <p className="mt-1 text-sm text-red-500">{errors.country_id}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="state_id">{t("State")} <RequiredField /></label>
              <Select
                name="state_id"
                options={filteredStates?.map((state) => ({
                  value: state.id,
                  label: state.en_name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                placeholder={t("Select a State")}
                aria-label={t("State")}
                value={stateValue} // Add value prop
                onChange={(value) => {
                  setStateValue(value);
                  setFormData(prev => ({ ...prev, state_id: value?.value }));
                }}
                error={errors.state_id}
              />
              {errors.state_id && (
                <p className="mt-1 text-sm text-red-500">{errors.state_id}</p>
              )}
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
                t("Save Changes")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Create;
