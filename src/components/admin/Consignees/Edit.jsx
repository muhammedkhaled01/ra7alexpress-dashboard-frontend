import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PhoneInput from "@/components/misc/PhoneInput";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import {
  getCities,
  getCountries,
  getGovernorates,
  getStates,
} from "@/stores/features/ajaxFeature";

Edit.propTypes = {
  onSubmitSuccess: PropTypes.func,
  record: PropTypes.shape({
    country_key_cellphone: PropTypes.string,
    cellphone: PropTypes.string,
    country_key_alternatePhone: PropTypes.string,
    alternatePhone: PropTypes.string,
    country: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string
    }),
    governorate: PropTypes.shape({
      id: PropTypes.number,
      en_name: PropTypes.string
    }),
    state: PropTypes.shape({
      id: PropTypes.number,
      en_name: PropTypes.string
    }),
    city: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string
    })
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

function Edit({ onSubmitSuccess, record, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [countryValue, _setCountryValue] = useState([]);
  const [governorateValue, _setGovernorateValue] = useState([]);
  const [stateValue, _setStateValue] = useState([]);
  const [cityValue, setCityValue] = useState([]);
  const [filteredGovernorates, setFilteredGovernorates] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    cellphone: '',
    country_id: '',
    governorate_id: '',
    state_id: '',
    city_id: '',
    streetAddress: ''
  });
  const [cellphone, setCellphone] = useState(String(record?.country_key_cellphone ?? "") + String(record?.cellphone ?? ""));
  const [alternatePhone, setAlternatePhone] = useState(String(record?.country_key_alternatePhone ?? "") + String(record?.alternatePhone ?? ""));

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const countries = useSelector((store) => store.ajax.countries);
  const governorates = useSelector((store) => store.ajax.governorates);
  const states = useSelector((store) => store.ajax.states);
  const cities = useSelector((store) => store.ajax.cities);

  useEffect(() => {
    if (!countries) {
      dispatch(getCountries());
    }
    if (!governorates) {
      dispatch(getGovernorates());
    }
    if (!states) {
      dispatch(getStates());
    }
    if (!cities) {
      dispatch(getCities());
    }
    console.log(record,'record')
    setCountryValue({ value: record?.country?.id, label: record?.country?.name });
    setGovernorateValue({ value: record?.governorate?.id, label: record?.governorate?.en_name });
    setStateValue({ value: record?.state?.id, label: record?.state?.en_name });
    setCityValue({ value: record?.city?.id, label: record?.city?.name });
    
    // Initialize phone numbers
    setCellphone(String(record?.country_key_cellphone ?? "") + String(record?.cellphone ?? ""));
    setAlternatePhone(String(record?.country_key_alternatePhone ?? "") + String(record?.alternatePhone ?? ""));
  }, []);

  useEffect(() => {
    if (countryValue?.value?.toString() === '165' && governorates) {
      setFilteredGovernorates(
        governorates.filter(
          (governorate) => governorate.country_id?.toString() === countryValue.value?.toString()
        )
      );
    }
  }, [governorates, countryValue]);

  const validateForm = (form) => {
    const newErrors = {
      name: form.get('name') ? '' : t('Consignee Name is required'),
      email: form.get('email') ? '' : t('Email is required'),
      cellphone: cellphone ? '' : t('Cell Phone is required'),
      country_id: form.get('country_id') ? '' : t('Country is required'),
      governorate_id: countryValue?.value?.toString() === '165' && !form.get('governorate_id') 
        ? t('Governorate is required for Egypt') 
        : '',
      state_id: form.get('state_id') ? '' : t('State is required'),
      city_id: form.get('city_id') ? '' : t('City is required'),
      streetAddress: form.get('streetAddress') ? '' : t('Street Address is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const setCountryValue = (value) => {
    _setCountryValue(value);
    // Reset all dependent values and filters
    _setGovernorateValue(null);
    _setStateValue(null);
    setCityValue(null);
    
    if (value?.value?.toString() === '165') {
      setFilteredGovernorates(
        value?.value 
          ? governorates?.filter(governorate => 
              governorate.country_id?.toString() === value.value?.toString()
            ) || []
          : []
      );
    } else {
      setFilteredStates(
        value?.value 
          ? states?.filter(state => 
              state.country_id?.toString() === value.value?.toString()
            ) || []
          : []
      );
    }
    setFilteredCities([]);
  };

  const setGovernorateValue = (value) => {
    _setGovernorateValue(value);
    // Reset dependent values and filters
    _setStateValue(null);
    setCityValue(null);
    setFilteredStates(
      value?.value 
        ? states?.filter(state => 
            state.governorate_id?.toString() === value.value?.toString()
          ) || []
        : []
    );
    setFilteredCities([]);
  };

  const setStateValue = (value) => {
    _setStateValue(value);
    // Reset city value and filter
    setCityValue(null);
    setFilteredCities(
      value?.value 
        ? cities?.filter(city => 
            city.state_id?.toString() === value.value?.toString()
          ) || []
        : []
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!validateForm(form)) return;
    setIsLoading(true);

    try {
      if (countryValue?.value?.toString() === '165') {
        form.append("governorate_id", governorateValue?.value);
      }
      form.append("cellphone", cellphone);
      form.append("alternatePhone", alternatePhone);
      const response = await axiosMerchant.post("consignees/update", form);
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
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[1000px]">
        <DialogHeader id="no-print">
          <DialogTitle>{t("Update Consignee")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name">{t("Name")} <RequiredField /></label>
              <Input
                id="name"
                name="name"
                type="text"
                defaultValue={record?.name}
                placeholder={t("Enter Name")}
                error={errors.name}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="email">{t("Email")} </label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={record?.email}
                placeholder={t("Enter Email")}
                error={errors.email}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="cellphone">{t("Cell Phone")} <RequiredField /></label>
              <PhoneInput
                country="eg"
                value={cellphone}
                onChange={setCellphone}
                enableSearch={true}
                inputClass="!bg-background !text-foreground"
                buttonClass="!bg-muted"
                error={errors.cellphone}
              />
              {errors.cellphone && (
                <p className="mt-1 text-sm text-red-500">{errors.cellphone}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="alternatePhone">{t("Alternate Phone")}</label>
              <PhoneInput
                country="eg"
                value={alternatePhone}
                onChange={setAlternatePhone}
                enableSearch={true}
                inputClass="!bg-background !text-foreground"
                buttonClass="!bg-muted"
              />
            </div>
            <div className="input-container">
              <label htmlFor="district">{t("District")}</label>
              <Input
                id="district"
                name="district"
                type="text"
                defaultValue={record?.district}
                placeholder={t("Enter District")}
              />
            </div>
            <div className="input-container">
              <label htmlFor="zipcode">{t("Zip Code")}</label>
              <Input
                id="zipcode"
                name="zipcode"
                type="text"
                defaultValue={record?.zipcode}
                placeholder={t("Enter Zip Code")}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="streetAddress">{t("Street Address")} <RequiredField /></label>
              <Input
                id="streetAddress"
                name="streetAddress"
                type="text"
                defaultValue={record?.streetAddress}
                placeholder={t("Enter Street Address")}
                error={errors.streetAddress}
              />
              {errors.streetAddress && (
                <p className="mt-1 text-sm text-red-500">{errors.streetAddress}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="latitude">{t("Latitude")}</label>
              <Input
                id="latitude"
                name="latitude"
                type="text"
                defaultValue={record?.latitude}
                placeholder={t("Latitude")}
              />
            </div>
            <div className="input-container">
              <label htmlFor="longitude">{t("Longitude")}</label>
              <Input
                id="longitude"
                name="longitude"
                type="text"
                defaultValue={record?.longitude}
                placeholder={t("Longitude")}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-4 mt-2 mb-4">
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
                onChange={(value) => setCountryValue(value)}
                error={errors.country_id}
              />
              {errors.country_id && (
                <p className="mt-1 text-sm text-red-500">{errors.country_id}</p>
              )}
            </div>
            {countryValue?.value?.toString() === '165' && (
              <div className="input-container">
                <label htmlFor="governorate_id">{t("Governorate")} <RequiredField /></label>
                <Select
                  name="governorate_id"
                  options={filteredGovernorates?.map((governorate) => ({
                    value: governorate.id,
                    label: governorate.en_name,
                  }))}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  value={governorateValue}
                  onChange={(value) => setGovernorateValue(value)}
                  error={errors.governorate_id}
                />
                {errors.governorate_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.governorate_id}</p>
                )}
              </div>
            )}
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
                onChange={(value) => setStateValue(value)}
                error={errors.state_id}
              />
              {errors.state_id && (
                <p className="mt-1 text-sm text-red-500">{errors.state_id}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="city_id">{t("City")} <RequiredField /></label>
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
                error={errors.city_id}
              />
              {errors.city_id && (
                <p className="mt-1 text-sm text-red-500">{errors.city_id}</p>
              )}
            </div>
          </div>
          <input type="hidden" name="id" value={record?.id} />
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
