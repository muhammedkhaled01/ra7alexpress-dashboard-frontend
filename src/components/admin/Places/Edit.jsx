import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Select from "@/components/misc/Select";
import { getCountries, getStates } from "@/stores/features/ajaxFeature";
import { handleError } from "@/utils/helpers";
import RequiredField from "@/components/misc/RequiredField";

function Edit({ onSubmitSuccess, record, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    country_id: record.state?.country?.id,
    state_id: record.state?.id,
    en_name: record.en_name,
    ar_name: record.ar_name
  });
  const [errors, setErrors] = useState({
    country_id: '',
    state_id: '',
    en_name: '',
    ar_name: ''
  });

  const [countryValue, _setCountryValue] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [stateValue, setStateValue] = useState([]);

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const countries = useSelector((store) => store.ajax.countries);
  const states = useSelector((store) => store.ajax.states);
  console.log(record,'record')
  useEffect(() => {
    if (!countries?.length) {
      dispatch(getCountries());
    }
    if (!states?.length) {
      dispatch(getStates());
    }
  }, [dispatch]);

  useEffect(() => {
    if (record?.state?.country?.id && states?.length) {
      const filtered = states.filter(
        (state) => state.country_id.toString() === record.state.country.id.toString()
      );
      setFilteredStates(filtered);
      const selectedState = filtered.find(state => state.id === record.state_id);
      if (selectedState) {
        setStateValue({
          value: selectedState.id,
          label: selectedState.en_name
        });
      }
      
      _setCountryValue({
        value: record.state?.country?.id,
        label: record.state?.country?.name,
      });
    }
  }, [record, states]);

  const validateForm = () => {
    const newErrors = {
      country_id: formData.country_id ? '' : t('Country is required'),
      state_id: formData.state_id ? '' : t('State is required'),
      en_name: formData.en_name ? '' : t('English name is required'),
      ar_name: ""
    };
    
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await axiosMerchant.post("places/update", formData);
      toast.success(response.data.message);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      handleError(error);
      console.error("Failed to submit data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCountryValue = (value) => {
    _setCountryValue(value);
    setStateValue("");
    setFilteredStates(
      states?.filter(
        (state) => state.country_id.toString() == value.value.toString()
      )
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px]">
        <DialogHeader id="no-print">
          <DialogTitle>{t("Update Place")}</DialogTitle>
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
              <label htmlFor="ar_name">{t("arabicName")} <RequiredField /></label>
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
                value={countryValue}
                onChange={(value) => {
                  setCountryValue(value);
                  setStateValue("");
                  setFilteredStates(
                    states?.filter(
                      (state) => state.country_id.toString() == value.value.toString()
                    )
                  );
                  setFormData(prev => ({ ...prev, country_id: value?.value }));
                }}
                placeholder={t("Select a Country")}
                aria-label={t("Country")}
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
                value={stateValue}
                onChange={(value) => {
                  setStateValue(value);
                  setFormData(prev => ({ ...prev, state_id: value?.value }));
                }}
                placeholder={t("Select a State")}
                aria-label={t("State")}
                error={errors.state_id}
              />
              {errors.state_id && (
                <p className="mt-1 text-sm text-red-500">{errors.state_id}</p>
              )}
            </div>
          </div>
          <input type="hidden" name="id" value={record.id} />
          <div className="flex justify-end gap-x-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("Close")}
              </Button>
            </DialogClose>
            <Button type="submit" className="" disabled={isLoading}>
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
