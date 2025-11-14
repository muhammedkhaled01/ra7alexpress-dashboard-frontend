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
import { toast } from 'react-hot-toast';
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
    country_id: record.state?.country?.id || null,
    state_id: record.state?.id || null,
    name: record.name || ''
  });
  const [errors, setErrors] = useState({
    country_id: '',
    state_id: '',
    name: ''
  });

  const [countryValue, _setCountryValue] = useState([])
  const [filteredStates, setFilteredStates] = useState([])
  const [stateValue, setStateValue] = useState([])

  const dispatch = useDispatch()
  const { t } = useTranslation()

  const countries = useSelector(store => store.ajax.countries)
  const states = useSelector(store => store.ajax.states)

  useEffect(() => {
    if (!countries?.length) {
      dispatch(getCountries())
    }
    if (!states?.length) {
      dispatch(getStates())
    }

    // Initialize country and state values
    const countryId = record.state?.country?.id;
    const stateId = record.state?.id;
    
    // Filter states based on the current country
    const filtered = states?.filter(state => state.country_id.toString() === countryId?.toString());
    setFilteredStates(filtered);

    // Find the selected state from the filtered states
    const selectedState = filtered?.find(state => state.id.toString() === stateId?.toString());
    
    // Set the initial values
    setStateValue(selectedState ? { value: selectedState.id, label: selectedState.en_name } : null)
    _setCountryValue({ value: countryId, label: record.state?.country?.name })
    setFormData({
      country_id: countryId,
      state_id: stateId,
      name: record.name
    });

  }, [dispatch, countries, states, record])

  const validateForm = () => {
    const newErrors = {
      country_id: formData.country_id ? '' : t('Country is required'),
      state_id: formData.state_id ? '' : t('State is required'),
      name: formData.name ? '' : t('City name is required')
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
      const formData = new FormData(event.currentTarget)
      const response = await axiosMerchant.post("cities/update", formData,);
      toast.success(response.data.message);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose()
    } catch (error) {
      handleError(error)
      console.error("Failed to submit data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCountryValue = (value) => {
    _setCountryValue(value)
    setStateValue("")
    setFilteredStates(states?.filter(state => state.country_id.toString() == value.value.toString()));
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px]">
        <DialogHeader id="no-print">
          <DialogTitle>{t("Update City")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name">{t("City")} <RequiredField /></label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t("Enter city name...")}
                error={errors.name}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="country_id">{t("Country")} <RequiredField /></label>
              <Select
                name="country_id"
                options={countries?.map(country => ({ value: country.id, label: country.name }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={countryValue}
                onChange={(value) => {
                  setCountryValue(value);
                  setStateValue(null);
                  setFilteredStates(states?.filter(state => state.country_id.toString() == value.value.toString()));
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
                options={filteredStates?.map(state => ({ value: state.id, label: state.en_name }))}
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
