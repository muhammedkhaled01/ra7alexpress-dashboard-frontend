import { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";

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
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Select from "@/components/misc/Select";
import {
  getCountries,
  getGovernorates,
  getPlaces,
  getShippers,
  getStates,
} from "@/stores/features/ajaxFeature";
import { handleError } from "@/utils/helpers";
import RequiredField from "@/components/misc/RequiredField";
import { Textarea } from "@/components/ui/textarea";
import PhoneInput from "@/components/misc/PhoneInput";

function Edit({ onSubmitSuccess, record, onClose }) {
  Edit.propTypes = {
    onSubmitSuccess: PropTypes.func,
    record: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      contact: PropTypes.string.isRequired,
      country: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
      }).isRequired,
      governorate: PropTypes.shape({
        id: PropTypes.number.isRequired,
        en_name: PropTypes.string.isRequired,
      }).isRequired,
      state: PropTypes.shape({
        id: PropTypes.number.isRequired,
        en_name: PropTypes.string.isRequired,
      }).isRequired,
      place: PropTypes.shape({
        id: PropTypes.number.isRequired,
        en_name: PropTypes.string.isRequired,
      }).isRequired,
      zip_code: PropTypes.string,
      website: PropTypes.string,
      address: PropTypes.string,
      notes: PropTypes.string,
      setting: PropTypes.shape({
        failed_ofd_count: PropTypes.number.isRequired,
        rto_days: PropTypes.number.isRequired,
      }).isRequired,
    }).isRequired,
    onClose: PropTypes.func.isRequired,
  };

  const [isLoading, setIsLoading] = useState(false);
  const [countryValue, _setCountryValue] = useState([]);
  const [governorateValue, _setGovernorateValue] = useState([]);
  const [filteredGovernorates, setFilteredGovernorates] = useState([]);
  const [stateValue, _setStateValue] = useState([]);
  const [placeValue, setPlaceValue] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  console.log(record, "record");
  const [contact, setContact] = useState(
    String(record?.country_key_contact ?? "") + String(record?.contact ?? "")
  );
  const [alternativePhone, setAlternativePhone] = useState(
    String(record?.alternative_country_key_contact ?? "") +
      String(record?.alternative_contact ?? "")
  );

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    contact: "",
    alternative_contact: "",
    country_id: "",
    governorate_id: "",
    state_id: "",
    address: "",
    failed_ofd_count: "",
    rto_days: "",
  });

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const countries = useSelector((store) => store.ajax.countries);
  const governorates = useSelector((store) => store.ajax.governorates);
  const states = useSelector((store) => store.ajax.states);
  const places = useSelector((store) => store.ajax.places);

  const setCountryValue = useCallback(
    (value) => {
      _setCountryValue(value);
      // Reset all dependent values and filters
      _setGovernorateValue(null);
      _setStateValue(null);
      setPlaceValue(null);
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
    },
    [governorates]
  );

  const setGovernorateValue = useCallback(
    (value) => {
      _setGovernorateValue(value);
      // Reset dependent values and filters
      _setStateValue(null);
      setPlaceValue(null);
      setFilteredStates(
        value?.value
          ? states?.filter(
              (state) =>
                state.governorate_id?.toString() === value.value.toString()
            ) || []
          : []
      );
      setFilteredPlaces([]);
    },
    [states]
  );

  const setStateValue = useCallback(
    (value) => {
      _setStateValue(value);
      // Reset place value
      setPlaceValue(null);
      setFilteredPlaces(
        value?.value
          ? places?.filter(
              (place) => place.state_id?.toString() === value.value.toString()
            ) || []
          : []
      );
    },
    [places]
  );

  useEffect(() => {
    if (!countries) dispatch(getCountries());
    if (!governorates) dispatch(getGovernorates());
    if (!states) dispatch(getStates());
    if (!places) dispatch(getPlaces());

    setCountryValue({
      value: record?.country?.id,
      label: record?.country?.name,
    });
    setGovernorateValue({
      value: record?.governorate?.id,
      label: record?.governorate?.en_name,
    });
    setStateValue({ value: record?.state?.id, label: record?.state?.en_name });
    setPlaceValue({ value: record?.place?.id, label: record?.place?.en_name });
  }, [
    countries,
    dispatch,
    governorates,
    places,
    record,
    states,
    setCountryValue,
    setGovernorateValue,
    setStateValue,
  ]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!validateForm(form)) return;
    setIsLoading(true);
    try {
      form.append("contact", contact);
      form.append("alternative_contact", alternativePhone);
      const response = await axiosMerchant.post("shippers/update", form);
      toast.success(response.data.message);
      await dispatch(getShippers());
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
          <DialogTitle>{t("Update Shipper")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name">
                {t("First Name")} <RequiredField />
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                defaultValue={record?.name}
                placeholder={t("Enter First Name")}
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
              <label htmlFor="contact">
                {t("Contact")} <RequiredField />
              </label>
              <PhoneInput
                country={"eg"}
                value={contact}
                onChange={setContact}
                enableSearch={true}
                inputClass="!bg-background !text-foreground"
                buttonClass="!bg-muted"
              />
              {errors.contact && (
                <p className="mt-1 text-sm text-red-500">{errors.contact}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="alternative_contact">
                {t("Alternative Contact")}
              </label>
              <PhoneInput
                country={"eg"}
                value={alternativePhone}
                onChange={setAlternativePhone}
                enableSearch={true}
                inputClass="!bg-background !text-foreground"
                buttonClass="!bg-muted"
              />
              {errors.contact && (
                <p className="mt-1 text-sm text-red-500">{errors.contact}</p>
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
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
                error={errors.country_id}
              />
              {errors.country_id && (
                <p className="mt-1 text-sm text-red-500">{errors.country_id}</p>
              )}
            </div>

            {/* Show Governorate if country is Egypt */}
            <div className="input-container">
              <label htmlFor="governorate_id">
                {t("Governorate")} <RequiredField />
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
                onChange={(value) => setPlaceValue(value)}
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
                defaultValue={record?.setting?.failed_ofd_count}
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
                defaultValue={record?.setting?.rto_days}
                placeholder={t("Enter RTO Days")}
                error={errors.rto_days}
              />
              {errors.rto_days && (
                <p className="mt-1 text-sm text-red-500">{errors.rto_days}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="zip_code">{t("ZIP Code")}</label>
              <Input
                id="zip_code"
                name="zip_code"
                type="text"
                defaultValue={record?.zip_code}
                placeholder={t("Enter ZIP Code")}
              />
            </div>
            <div className="input-container">
              <label htmlFor="website">{t("Website")}</label>
              <Input
                id="website"
                name="website"
                type="url"
                defaultValue={record?.website}
                placeholder={t("Enter Website")}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="address">
                {t("Address")} <RequiredField />
              </label>
              <Textarea
                id="address"
                name="address"
                type="text"
                defaultValue={record?.address}
                placeholder={t("Enter Address")}
                error={errors.address}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">{errors.address}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="notes">{t("Notes")}</label>
              <Textarea
                id="notes"
                name="notes"
                type="text"
                defaultValue={record?.notes}
                placeholder={t("Enter Notes")}
              />
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
