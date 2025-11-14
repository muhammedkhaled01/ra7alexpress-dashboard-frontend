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
import PhoneInput from "@/components/misc/PhoneInput";
import Select from "@/components/misc/Select";
import {
  getCountries,
  getGovernorates,
  getPlaces,
  getShippers,
  getStates,
} from "@/stores/features/ajaxFeature";
import { Textarea } from "@/components/ui/textarea";
import RequiredField from "@/components/misc/RequiredField";

function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [countryValue, _setCountryValue] = useState([]);
  const [governorateValue, _setGovernorateValue] = useState([]);
  const [filteredGovernorates, setFilteredGovernorates] = useState([]);
  const [stateValue, _setStateValue] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [placeValue, _setPlaceValue] = useState([]);
  const [errors, setErrors] = useState({
    name: "",
    contact: "",
    country_id: "",
    state_id: "",
    address: "",
    failed_ofd_count: "",
    rto_days: "",
  });
  const [contact, setContact] = useState("");
  const [alternativePhone, setAlternativePhone] = useState("");

  const countries = useSelector((store) => store.ajax.countries);
  const governorates = useSelector((store) => store.ajax.governorates);
  const states = useSelector((store) => store.ajax.states);
  const places = useSelector((store) => store.ajax.places);

  useEffect(() => {
    if (!countries) dispatch(getCountries());
    if (!governorates) dispatch(getGovernorates());
    if (!states) dispatch(getStates());
    if (!places) dispatch(getPlaces());
  }, [countries]);

  useEffect(() => {
    const defaultCountry = countries?.find(
      (country) => country.name === "Egypt"
    );
    if (defaultCountry) {
      console.log(defaultCountry);
      setCountryValue({ value: defaultCountry.id, label: defaultCountry.name });
    }
  }, [countries]);

  const validateForm = (form) => {
    const newErrors = {
      name: form.get("name") ? "" : t("Shipper Name is required"),
      email: form.get("email") ? "" : t("Shipper Email is required"),
      contact: contact ? "" : t("Contact Number is required"),
      country_id: form.get("country_id") ? "" : t("Country is required"),
      governorate_id: form.get("governorate_id")
        ? ""
        : t("Governorate is required"),
      state_id: form.get("state_id") ? "" : t("State is required"),
      address: form.get("address") ? "" : t("Address is required"),
      failed_ofd_count: form.get("failed_ofd_count")
        ? ""
        : t("Failed OFD Count is required"),
      rto_days: form.get("rto_days") ? "" : t("RTO Days is required"),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!validateForm(form)) return;
    setIsLoading(true);
    try {
      form.append("contact", contact);
      form.append("alternative_contact", alternativePhone);
      const response = await axiosMerchant.post("shippers/store", form);
      toast.success(response.data.message);
      await dispatch(getShippers());
      if (onSubmitSuccess) onSubmitSuccess();
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
    // Reset all dependent values and filters
    _setGovernorateValue(null);
    _setStateValue(null);
    _setPlaceValue(null);
    setFilteredGovernorates(
      value?.value
        ? governorates?.filter(
            (governorate) =>
              governorate.country_id?.toString() === value.value.toString()
          ) || []
        : []
    );
    setFilteredStates([]);
    setFilteredPlaces([]);
  };

  const setGovernorateValue = (value) => {
    _setGovernorateValue(value);
    // Reset dependent values and filters
    _setStateValue(null);
    _setPlaceValue(null);
    setFilteredStates(
      value?.value
        ? states?.filter(
            (state) =>
              state.governorate_id?.toString() === value.value.toString()
          ) || []
        : []
    );
    setFilteredPlaces([]);
  };

  const setStateValue = (value) => {
    _setStateValue(value);
    _setPlaceValue(null);
    // Reset dependent filter
    setFilteredPlaces(
      value?.value
        ? places?.filter(
            (place) => place.state_id?.toString() === value.value.toString()
          ) || []
        : []
    );
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{t("Create Shipper")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>
            {t("Create Shipper")} <RequiredField />
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name">
                {t("Name")} <RequiredField />
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={t("Enter Name")}
                error={errors.name}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="email">
                {t("Email")} 
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("Enter Email")}
                error={errors.email}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="contact">
                {t("Contact Number")} <RequiredField />
              </label>
              <PhoneInput
                country={"eg"}
                value={contact}
                onChange={setContact}
                countrySelectorPlacement="start"
                enableSearch={true}
                inputClass="!bg-background !text-foreground"
                buttonClass="!bg-muted"
              />
              {errors.contact && (
                <p className="mt-1 text-sm text-red-500">{errors.contact}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="alternativePhone">{t("Alternative Phone")}</label>
              <PhoneInput
                country={"eg"}
                value={alternativePhone}
                onChange={setAlternativePhone}
                countrySelectorPlacement="start"
                enableSearch={true}
                inputClass="!bg-background !text-foreground"
                buttonClass="!bg-muted"
              />
            </div>
            {/* Country Selection */}
            <div className="input-container">
              <label htmlFor="country_id">
                {t("Country")} <RequiredField />
              </label>
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
                placeholder={t("Select Country")}
                error={errors.country_id}
              />
              {errors.country_id && (
                <p className="mt-1 text-sm text-red-500">{errors.country_id}</p>
              )}
            </div>

            {/* Show Governorate if country is Egypt */}
            <div className="input-container">
              <label htmlFor="governorate_id">
                {t("governorate")} <RequiredField />
              </label>
              <Select
                name="governorate_id"
                options={filteredGovernorates?.map((governorate) => ({
                  value: governorate.id,
                  label: `${governorate.en_name} / ${
                    governorate.ar_name ?? ""
                  }`,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={governorateValue}
                onChange={(value) => setGovernorateValue(value)}
                placeholder={t("Select Governorate")}
                error={errors.governorate_id}
              />
              {errors.governorate_id && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.governorate_id}
                </p>
              )}
            </div>

            {/* State Selection (Always Show) */}
            <div className="input-container">
              <label htmlFor="state_id">
                {t("State")} <RequiredField />
              </label>
              <Select
                name="state_id"
                options={filteredStates?.map((state) => ({
                  value: state.id,
                  label:
                    countryValue?.label === "Egypt"
                      ? `${state.en_name} / ${state.ar_name ?? ""}`
                      : state.en_name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={stateValue}
                onChange={(value) => setStateValue(value)}
                placeholder={t("Select State")}
                error={errors.state_id}
              />
              {errors.state_id && (
                <p className="mt-1 text-sm text-red-500">{errors.state_id}</p>
              )}
            </div>

            {/* Show Place if country is Egypt */}
            <div className="input-container">
              <label htmlFor="place_id">{t("Place")}</label>
              <Select
                name="place_id"
                options={filteredPlaces?.map((place) => ({
                  value: place.id,
                  label: `${place.en_name} / ${place.ar_name ?? ""}`,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={placeValue}
                onChange={(value) => _setPlaceValue(value)}
                placeholder={t("Select Place")}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-1 lg:grid-cols-4 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="failed_ofd_count">
                {t("Failed OFD Count")} <RequiredField />
              </label>
              <Input
                id="failed_ofd_count"
                name="failed_ofd_count"
                type="number"
                placeholder={t("Enter Failed OFD Count")}
                error={errors.failed_ofd_count}
              />
              {errors.failed_ofd_count && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.failed_ofd_count}
                </p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="rto_days">
                {t("RTO Days")} <RequiredField />
              </label>
              <Input
                id="rto_days"
                name="rto_days"
                type="number"
                placeholder={t("Enter RTO Days")}
                error={errors.rto_days}
              />
              {errors.rto_days && (
                <p className="mt-1 text-sm text-red-500">{errors.rto_days}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="website">{t("Website")}</label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder={t("Enter Website")}
              />
            </div>
            <div className="input-container">
              <label htmlFor="zip_code">{t("ZIP Code")}</label>
              <Input
                id="zip_code"
                name="zip_code"
                type="text"
                placeholder={t("Enter ZIP Code")}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div className="input-container mt-2">
              <label htmlFor="address">
                {t("Address")} <RequiredField />
              </label>
              <Textarea
                id="address"
                name="address"
                type="text"
                placeholder={t("Enter Address")}
                error={errors.address}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">{errors.address}</p>
              )}
            </div>
            <div className="input-container mt-2">
              <label htmlFor="notes">{t("Notes")}</label>
              <Textarea
                id="notes"
                name="notes"
                type="text"
                placeholder={t("Enter Notes")}
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
