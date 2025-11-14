import React, { useState, useEffect } from "react";

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
import { toast } from 'react-hot-toast';
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { handleError } from "@/utils/helpers";
import Select from "@/components/misc/Select";
import { useDispatch, useSelector } from "react-redux";
import { getCountries, getGovernorates, getStates, getPlaces } from "@/stores/features/ajaxFeature";

function Edit({ onSubmitSuccess, record, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [countryValue, _setCountryValue] = useState([]);
  const [governorateValue, _setGovernorateValue] = useState([]);
  const [stateValue, _setStateValue] = useState([]);
  const [placeValue, setPlaceValue] = useState([]);
  const [filteredGovernorates, setFilteredGovernorates] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { countries, governorates, states, places, loading } = useSelector((store) => store.ajax);

  useEffect(() => {
    if (!countries) dispatch(getCountries());
    if (!governorates) dispatch(getGovernorates());
    if (!states) dispatch(getStates());
    if (!places) dispatch(getPlaces());
  }, [dispatch, countries, governorates, states, places]);

  useEffect(() => {
    if (record && countries && governorates && states && places) {
      initializeForm();
    }
  }, [record, countries, governorates, states, places]);

  const initializeForm = () => {
    if (record.country_id) {
      const countryOption = countries.find(country => country.id === record.country_id);
      if (countryOption) {
        const countrySelect = { value: countryOption.id, label: countryOption.name };
        _setCountryValue(countrySelect);
        
        if (countryOption.name === "Egypt") {
          const filteredGovs = governorates?.filter(
            (governorate) => governorate.country_id?.toString() === countryOption.id.toString()
          );
          setFilteredGovernorates(filteredGovs);
          
          if (record.governorate_id) {
            const governorateOption = governorates.find(gov => gov.id === record.governorate_id);
            if (governorateOption) {
              const govSelect = { 
                value: governorateOption.id, 
                label: `${governorateOption.en_name} / ${governorateOption.ar_name ?? ""}` 
              };
              _setGovernorateValue(govSelect);
              
              const filteredStatesData = states?.filter(
                (state) => state.governorate_id?.toString() === governorateOption.id.toString()
              );
              setFilteredStates(filteredStatesData);
              
              if (record.state_id) {
                const stateOption = states.find(state => state.id === record.state_id);
                if (stateOption) {
                  const stateSelect = { 
                    value: stateOption.id, 
                    label: `${stateOption.en_name} / ${stateOption.ar_name ?? ""}` 
                  };
                  _setStateValue(stateSelect);
                  
                  const filteredPlacesData = places?.filter(
                    (place) => place.state_id?.toString() === stateOption.id.toString()
                  );
                  setFilteredPlaces(filteredPlacesData);
                  
                  if (record.place_id) {
                    const placeOption = places.find(place => place.id === record.place_id);
                    if (placeOption) {
                      const placeSelect = { 
                        value: placeOption.id, 
                        label: `${placeOption.en_name} / ${placeOption.ar_name ?? ""}` 
                      };
                      setPlaceValue(placeSelect);
                    }
                  }
                }
              }
            }
          }
        } else {
          // For non-Egypt countries
          const filteredStatesData = states?.filter(
            (state) => state.country_id?.toString() === countryOption.id.toString()
          );
          setFilteredStates(filteredStatesData);
          
          if (record.state_id) {
            const stateOption = states.find(state => state.id === record.state_id);
            if (stateOption) {
              const stateSelect = { value: stateOption.id, label: stateOption.en_name };
              _setStateValue(stateSelect);
            }
          }
        }
      }
    }
  };

  const setCountryValue = (value) => {
    _setCountryValue(value);
    _setGovernorateValue([]);
    _setStateValue([]);
    setPlaceValue([]);
    
    if (value && value.label === "Egypt") {
      setFilteredGovernorates(
        governorates?.filter(
          (governorate) =>
            governorate.country_id?.toString() === value.value.toString()
        )
      );
      setFilteredStates([]);
      setFilteredPlaces([]);
    } else if (value) {
      setFilteredGovernorates([]);
      setFilteredPlaces([]);
      setFilteredStates(
        states?.filter(
          (state) => state.country_id?.toString() === value.value.toString()
        )
      );
    } else {
      setFilteredGovernorates([]);
      setFilteredStates([]);
      setFilteredPlaces([]);
    }
  };

  const setGovernorateValue = (value) => {
    _setGovernorateValue(value);
    _setStateValue([]);
    setPlaceValue([]);
    
    if (value) {
      setFilteredStates(
        states?.filter(
          (state) => state.governorate_id?.toString() === value.value.toString()
        )
      );
      setFilteredPlaces([]);
    } else {
      setFilteredStates([]);
      setFilteredPlaces([]);
    }
  };

  const setStateValue = (value) => {
    _setStateValue(value);
    setPlaceValue([]);
    
    if (value && countryValue?.label === "Egypt") {
      setFilteredPlaces(
        places?.filter(
          (place) => place.state_id?.toString() === value.value.toString()
        )
      );
    } else {
      setFilteredPlaces([]);
    }
  };

  const validateForm = (formData) => {
    const newErrors = {};
    
    if (!formData.get('name')) newErrors.name = t('Name is required');
    if (!formData.get('cellphone')) newErrors.cellphone = t('Cell phone is required');
    if (!countryValue || !countryValue.value) newErrors.country_id = t('Country is required');
    if (countryValue?.label === "Egypt" && (!governorateValue || !governorateValue.value)) {
      newErrors.governorate_id = t('Governorate is required');
    }
    if (!stateValue || !stateValue.value) newErrors.state_id = t('State is required');
    if (!formData.get('streetAddress')) newErrors.streetAddress = t('Street address is required');
    
    const email = formData.get('email');
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('Email must be a valid email address');
    }
    
    const locationUrl = formData.get('location_url');
    if (locationUrl && !/^https?:\/\/.+/.test(locationUrl)) {
      newErrors.location_url = t('Location URL must be a valid URL');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      
      // Add selected location data to form
      if (countryValue && countryValue.value) formData.append('country_id', countryValue.value);
      if (governorateValue && governorateValue.value) formData.append('governorate_id', governorateValue.value);
      if (stateValue && stateValue.value) formData.append('state_id', stateValue.value);
      if (placeValue && placeValue.value) formData.append('place_id', placeValue.value);
      
      const isValid = validateForm(formData);
      
      if (!isValid) {
        setIsLoading(false);
        return;
      }

      const response = await axiosMerchant.post(`merchant/address_book/${record.id}/update`, formData);
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader id="no-print">
          <DialogTitle>{t("Update Address Book")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name">{t("Name")} *</label>
              <Input
                id="name"
                name="name"
                type="text"
                defaultValue={record.name}
                placeholder={t("Enter name")}
                error={errors.name}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            
            <div className="input-container">
              <label htmlFor="email">{t("Email")}</label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={record.email || ''}
                placeholder={t("Enter email address")}
                error={errors.email}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            <div className="input-container">
              <label htmlFor="cellphone">{t("Cell Phone")} *</label>
              <Input
                id="cellphone"
                name="cellphone"
                type="text"
                defaultValue={record.cellphone}
                placeholder={t("Enter cell phone")}
                error={errors.cellphone}
              />
              {errors.cellphone && (
                <p className="mt-1 text-sm text-red-500">{errors.cellphone}</p>
              )}
            </div>
            
            <div className="input-container">
              <label htmlFor="alternatePhone">{t("Alternate Phone")}</label>
              <Input
                id="alternatePhone"
                name="alternatePhone"
                type="text"
                defaultValue={record.alternatePhone || ''}
                placeholder={t("Enter alternate phone")}
                error={errors.alternatePhone}
              />
              {errors.alternatePhone && (
                <p className="mt-1 text-sm text-red-500">{errors.alternatePhone}</p>
              )}
            </div>
            
            <div className="input-container">
              <label htmlFor="country_id">{t("Country")} *</label>
              <Select
                name="country_id"
                options={countries?.map((country) => ({
                  value: country.id,
                  label: country.name,
                }))}
                value={countryValue}
                onChange={setCountryValue}
                placeholder={t("Select Country")}
                error={errors.country_id}
              />
              {errors.country_id && (
                <p className="mt-1 text-sm text-red-500">{errors.country_id}</p>
              )}
            </div>
            
            {/* Show Governorate if country is Egypt */}
            {countryValue?.label === "Egypt" && (
              <div className="input-container">
                <label htmlFor="governorate_id">{t("governorate")} *</label>
                <Select
                  name="governorate_id"
                  options={filteredGovernorates?.map((governorate) => ({
                    value: governorate.id,
                    label: `${governorate.en_name} / ${governorate.ar_name ?? ""}`,
                  }))}
                  value={governorateValue}
                  onChange={setGovernorateValue}
                  placeholder={t("Select Governorate")}
                  isDisabled={!countryValue}
                  error={errors.governorate_id}
                />
                {errors.governorate_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.governorate_id}</p>
                )}
              </div>
            )}
            
            <div className="input-container">
              <label htmlFor="state_id">{t("State")} *</label>
              <Select
                name="state_id"
                options={filteredStates?.map((state) => ({
                  value: state.id,
                  label: countryValue?.label === "Egypt"
                    ? `${state.en_name} / ${state.ar_name ?? ""}`
                    : state.en_name,
                }))}
                value={stateValue}
                onChange={setStateValue}
                placeholder={t("Select State")}
                isDisabled={countryValue?.label === "Egypt" ? !governorateValue : !countryValue}
                error={errors.state_id}
              />
              {errors.state_id && (
                <p className="mt-1 text-sm text-red-500">{errors.state_id}</p>
              )}
            </div>
            
            {/* Show Place if country is Egypt */}
            {countryValue?.label === "Egypt" && (
              <div className="input-container">
                <label htmlFor="place_id">{t("Place")}</label>
                <Select
                  name="place_id"
                  options={filteredPlaces?.map((place) => ({
                    value: place.id,
                    label: `${place.en_name} / ${place.ar_name ?? ""}`,
                  }))}
                  value={placeValue}
                  onChange={setPlaceValue}
                  placeholder={t("Select Place")}
                  isDisabled={!stateValue}
                  error={errors.place_id}
                />
                {errors.place_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.place_id}</p>
                )}
              </div>
            )}
            
            <div className="input-container">
              <label htmlFor="zipcode">{t("Zipcode")}</label>
              <Input
                id="zipcode"
                name="zipcode"
                type="text"
                defaultValue={record.zipcode || ''}
                placeholder={t("Enter zipcode")}
                error={errors.zipcode}
              />
              {errors.zipcode && (
                <p className="mt-1 text-sm text-red-500">{errors.zipcode}</p>
              )}
            </div>
            
            <div className="input-container lg:col-span-2">
              <label htmlFor="streetAddress">{t("Street Address")} *</label>
              <Input
                id="streetAddress"
                name="streetAddress"
                type="text"
                defaultValue={record.streetAddress}
                placeholder={t("Enter street address")}
                error={errors.streetAddress}
              />
              {errors.streetAddress && (
                <p className="mt-1 text-sm text-red-500">{errors.streetAddress}</p>
              )}
            </div>
            
            <div className="input-container lg:col-span-2">
              <label htmlFor="location_url">{t("Location URL")}</label>
              <Input
                id="location_url"
                name="location_url"
                type="url"
                defaultValue={record.location_url || ''}
                placeholder={t("Enter location URL")}
                error={errors.location_url}
              />
              {errors.location_url && (
                <p className="mt-1 text-sm text-red-500">{errors.location_url}</p>
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

export default Edit;
