// src/components/ShipmentFilters.jsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Loader from "@/components/Loader";
import { exceptionStatusOptions, statusOptions } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import Select from "@/components/misc/Select";
import PhoneInput from "@/components/misc/PhoneInput";
import { useSelector } from "react-redux";
import {
  getFacilities,
  getCountries,
  getGovernorates,
  getStates,
  getPlaces,
} from "@/stores/features/ajaxFeature";
import { DateTimeRangePicker } from "@/components/misc/DateTimeRangePicker";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFilters } from "@/contexts/ShipmentFiltersContext";
import { useDispatch } from "react-redux";

function ShipmentFilters({ isOpen, setIsOpen, onClose, facilityGroups }) {
  const { facilities, countries, governorates, states, places, loading } =
    useSelector((state) => state.ajax || {});
  const { filters, dispatch } = useFilters();
  const { t } = useTranslation();
  const defaultCountryName = "Egypt";

  // Local state for filtered location data
  const [filteredConsigneeGovernorates, setFilteredConsigneeGovernorates] =
    useState([]);
  const [filteredConsigneeStates, setFilteredConsigneeStates] = useState([]);
  const [filteredConsigneePlaces, setFilteredConsigneePlaces] = useState([]);
  const [filteredSenderGovernorates, setFilteredSenderGovernorates] = useState(
    []
  );
  const [filteredSenderStates, setFilteredSenderStates] = useState([]);
  const [filteredSenderPlaces, setFilteredSenderPlaces] = useState([]);
  const rDispatch = useDispatch();
  // Fetch data if not already loaded
  useEffect(() => {
    Promise.all([
      !facilities && getFacilities(),
      !countries && getCountries(),
      !governorates && getGovernorates(),
      !states && getStates(),
      !places && getPlaces(),
    ]);
  }, [facilities, countries, governorates, states, places, rDispatch]);

  // Set default country to Egypt for consignee and sender
  useEffect(() => {
    if (countries?.length) {
      dispatch({
        type: "SET_DEFAULT_COUNTRY",
        payload: { countries, defaultCountryName },
      });
    }
  }, [countries, dispatch]);

  // Filter governorates based on country for consignee
  useEffect(() => {
    if (
      filters?.consignee_country?.label === defaultCountryName &&
      governorates?.length
    ) {
      setFilteredConsigneeGovernorates(
        governorates?.filter(
          (g) =>
            String(g.country_id) === String(filters.consignee_country.value)
        )
      );
    } else {
      setFilteredConsigneeGovernorates([]);
    }
  }, [filters?.consignee_country, governorates]);

  // Filter governorates based on country for sender
  // useEffect(() => {
  //   if (
  //     filters?.sender_country?.label === defaultCountryName &&
  //     governorates?.length
  //   ) {
  //     setFilteredSenderGovernorates(
  //       governorates?.filter(
  //         (g) => String(g.country_id) === String(filters.sender_country.value)
  //       )
  //     );
  //   } else {
  //     setFilteredSenderGovernorates([]);
  //   }
  // }, [filters?.sender_country, governorates]);

  // Filter states based on governorate or country for consignee
  useEffect(() => {
    if (
      filters?.consignee_country?.label === defaultCountryName &&
      filters?.consignee_gov?.value
    ) {
      setFilteredConsigneeStates(
        states?.filter(
          (s) =>
            String(s.governorate_id) === String(filters.consignee_gov.value)
        )
      );
    } else if (filters?.consignee_country?.value) {
      setFilteredConsigneeStates(
        states?.filter(
          (s) =>
            String(s.country_id) === String(filters.consignee_country.value)
        )
      );
    } else {
      setFilteredConsigneeStates([]);
    }
  }, [filters?.consignee_country, filters?.consignee_gov, states]);

  // Filter states based on governorate or country for sender
  useEffect(() => {
    if (
      filters?.sender_country?.label === defaultCountryName &&
      filters?.sender_gov?.value
    ) {
      setFilteredSenderStates(
        states?.filter(
          (s) => String(s.governorate_id) === String(filters.sender_gov.value)
        )
      );
    } else if (filters?.sender_country?.value) {
      setFilteredSenderStates(
        states?.filter(
          (s) => String(s.country_id) === String(filters.sender_country.value)
        )
      );
    } else {
      setFilteredSenderStates([]);
    }
  }, [filters?.sender_country, filters?.sender_gov, states]);

  // Filter places based on state for consignee
  useEffect(() => {
    if (filters?.consignee_state?.value) {
      setFilteredConsigneePlaces(
        places?.filter(
          (p) => String(p.state_id) === String(filters.consignee_state.value)
        )
      );
    } else {
      setFilteredConsigneePlaces([]);
    }
  }, [filters?.consignee_state, places]);

  // Filter places based on state for sender
  useEffect(() => {
    if (filters?.sender_state?.value) {
      setFilteredSenderPlaces(
        places?.filter(
          (p) => String(p.state_id) === String(filters.sender_state.value)
        )
      );
    } else {
      setFilteredSenderPlaces([]);
    }
  }, [filters?.sender_state, places]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    if (
      [
        "from",
        "to",
        "from_time",
        "to_time",
        "created_from",
        "created_to",
        "delivered_from",
        "delivered_to",
        "exception_from",
        "exception_to",
      ].includes(key)
    ) {
      dispatch({ type: "SET_FILTERS", payload: { [key]: value } });
    } else if (key === "consignee_country") {
      dispatch({ type: "SET_FILTERS", payload: { consignee_country: value } });
      dispatch({ type: "RESET_CONSIGNEE_LOCATION" });
    } else if (key === "consignee_gov") {
      dispatch({ type: "SET_FILTERS", payload: { consignee_gov: value } });
      dispatch({
        type: "SET_FILTERS",
        payload: { consignee_state: null, consignee_place: null },
      });
    } else if (key === "consignee_state") {
      dispatch({ type: "SET_FILTERS", payload: { consignee_state: value } });
      dispatch({ type: "SET_FILTERS", payload: { consignee_place: null } });
    } else if (key === "sender_country") {
      dispatch({ type: "SET_FILTERS", payload: { sender_country: value } });
      dispatch({ type: "RESET_SENDER_LOCATION" });
    } else if (key === "sender_gov") {
      dispatch({ type: "SET_FILTERS", payload: { sender_gov: value } });
      dispatch({
        type: "SET_FILTERS",
        payload: { sender_state: null, sender_place: null },
      });
    } else if (key === "sender_state") {
      dispatch({ type: "SET_FILTERS", payload: { sender_state: value } });
      dispatch({ type: "SET_FILTERS", payload: { sender_place: null } });
    } else {
      dispatch({ type: "SET_FILTERS", payload: { [key]: value } });
    }
  };

  const handleApply = () => {
    onClose();
  };

  const handleClear = () => {
    dispatch({ type: "CLEAR_FILTERS" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => setIsOpen(false)}>
      <DialogContent className="!max-w-[95vw] !w-[1200px] !max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0 sticky top-0 bg-background z-10">
          <DialogTitle className="text-xl font-bold">
            {t("Shipments Filter")}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <Loader />
        ) : (
          <div className="p-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-hidden">
            {/* General Filters */}
            <Card>
              <CardHeader>
                <CardTitle>{t("General Filters")}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("Status")}</label>
                  <Select
                    name="status"
                    placeholder={t("Select status...")}
                    options={statusOptions}
                    isClearable
                    onChange={(option) => handleFilterChange("status", option)}
                    value={filters.status}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("Facility")}</label>
                  <Select
                    name="facility"
                    placeholder={t("Select facility...")}
                    options={facilityGroups}
                    onChange={(option) =>
                      handleFilterChange("facility", option)
                    }
                    isClearable
                    value={filters.facility}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Consignee Filter Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Consignee Filters")}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("Name")}</label>
                  <Input
                    value={filters.consignee_name || ""}
                    onChange={(e) =>
                      handleFilterChange("consignee_name", e.target.value)
                    }
                    placeholder={t("Enter name...")}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("Email")}</label>
                  <Input
                    value={filters.consignee_email || ""}
                    onChange={(e) =>
                      handleFilterChange("consignee_email", e.target.value)
                    }
                    placeholder={t("Enter email...")}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("Phone")}</label>
                  <PhoneInput
                    country={"eg"}
                    value={filters.consignee_phone || ""}
                    onChange={(val) =>
                      handleFilterChange("consignee_phone", val)
                    }
                    enableSearch={true}
                    inputClass="!bg-background !text-foreground"
                    buttonClass="!bg-muted"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">
                    {t("Alternate Phone")}
                  </label>
                  <PhoneInput
                    country={"eg"}
                    value={filters.consignee_alt_phone || ""}
                    onChange={(val) =>
                      handleFilterChange("consignee_alt_phone", val)
                    }
                    enableSearch={true}
                    inputClass="!bg-background !text-foreground"
                    buttonClass="!bg-muted"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("Country")}</label>
                  <Select
                    name="consignee_country_id"
                    options={
                      countries?.map((c) => ({ value: c.id, label: c.name })) ||
                      []
                    }
                    value={filters.consignee_country || null}
                    onChange={(opt) =>
                      handleFilterChange("consignee_country", opt)
                    }
                    placeholder={t("Select a country...")}
                    isClearable
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">
                    {t("Governorate")}
                  </label>
                  <Select
                    name="consignee_governorate_id"
                    options={
                      filteredConsigneeGovernorates?.map((g) => ({
                        value: g.id,
                        label: `${g.en_name} / ${g.ar_name ?? ""}`,
                      })) || []
                    }
                    value={filters.consignee_gov || null}
                    onChange={(opt) => handleFilterChange("consignee_gov", opt)}
                    placeholder={t("Select a governorate...")}
                    isClearable
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("State")}</label>
                  <Select
                    name="consignee_state_id"
                    options={
                      filteredConsigneeStates?.map((s) => ({
                        value: s.id,
                        label:
                          filters.consignee_country?.label ===
                          defaultCountryName
                            ? `${s.en_name} / ${s.ar_name ?? ""}`
                            : s.en_name,
                      })) || []
                    }
                    value={filters.consignee_state || null}
                    onChange={(opt) =>
                      handleFilterChange("consignee_state", opt)
                    }
                    placeholder={t("Select a state...")}
                    isClearable
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("Place")}</label>
                  <Select
                    name="consignee_place_id"
                    options={
                      filteredConsigneePlaces?.map((p) => ({
                        value: p.id,
                        label: `${p.en_name} / ${p.ar_name ?? ""}`,
                      })) || []
                    }
                    value={filters.consignee_place || null}
                    onChange={(opt) =>
                      handleFilterChange("consignee_place", opt)
                    }
                    placeholder={t("Select a place...")}
                    isClearable
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sender Filter Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Sender Filters")}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("Name")}</label>
                  <Input
                    value={filters.sender_name || ""}
                    onChange={(e) =>
                      handleFilterChange("sender_name", e.target.value)
                    }
                    placeholder={t("Enter name...")}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("Email")}</label>
                  <Input
                    value={filters.sender_email || ""}
                    onChange={(e) =>
                      handleFilterChange("sender_email", e.target.value)
                    }
                    placeholder={t("Enter email...")}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("Phone")}</label>
                  <PhoneInput
                    country={"eg"}
                    value={filters.sender_phone || ""}
                    onChange={(val) => handleFilterChange("sender_phone", val)}
                    enableSearch={true}
                    inputClass="!bg-background !text-foreground"
                    buttonClass="!bg-muted"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">
                    {t("Alternate Phone")}
                  </label>
                  <PhoneInput
                    country={"eg"}
                    value={filters.sender_alt_phone || ""}
                    onChange={(val) =>
                      handleFilterChange("sender_alt_phone", val)
                    }
                    enableSearch={true}
                    inputClass="!bg-background !text-foreground"
                    buttonClass="!bg-muted"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("Country")}</label>
                  <Select
                    name="sender_country_id"
                    options={
                      countries?.map((c) => ({ value: c.id, label: c.name })) ||
                      []
                    }
                    value={filters.sender_country || null}
                    onChange={(opt) =>
                      handleFilterChange("sender_country", opt)
                    }
                    placeholder={t("Select a country...")}
                    isClearable
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">
                    {t("Governorate")}
                  </label>
                  <Select
                    name="sender_governorate_id"
                    options={
                      filteredSenderGovernorates?.map((g) => ({
                        value: g.id,
                        label: `${g.en_name} / ${g.ar_name ?? ""}`,
                      })) || []
                    }
                    value={filters.sender_gov || null}
                    onChange={(opt) => handleFilterChange("sender_gov", opt)}
                    placeholder={t("Select a governorate...")}
                    isClearable
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("State")}</label>
                  <Select
                    name="sender_state_id"
                    options={
                      filteredSenderStates?.map((s) => ({
                        value: s.id,
                        label:
                          filters.sender_country?.label === defaultCountryName
                            ? `${s.en_name} / ${s.ar_name ?? ""}`
                            : s.en_name,
                      })) || []
                    }
                    value={filters.sender_state || null}
                    onChange={(opt) => handleFilterChange("sender_state", opt)}
                    placeholder={t("Select a state...")}
                    isClearable
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">{t("Place")}</label>
                  <Select
                    name="sender_place_id"
                    options={
                      filteredSenderPlaces?.map((p) => ({
                        value: p.id,
                        label: `${p.en_name} / ${p.ar_name ?? ""}`,
                      })) || []
                    }
                    value={filters.sender_place || null}
                    onChange={(opt) => handleFilterChange("sender_place", opt)}
                    placeholder={t("Select a place...")}
                    isClearable
                  />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Exception Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Delivery Exception Filters")}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">
                    {t("Exception Type")}
                  </label>
                  <Select
                    options={exceptionStatusOptions}
                    value={filters.exception_type || null}
                    onChange={(opt) =>
                      handleFilterChange("exception_type", opt)
                    }
                    isClearable
                    placeholder={t("Select exception type...")}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">
                    {t("Exception Date Range")}
                  </label>
                  <DateTimeRangePicker
                    filters={{
                      from: filters.exception_from,
                      to: filters.exception_to,
                      from_time: filters.exception_from_time,
                      to_time: filters.exception_to_time,
                    }}
                    onChange={(key, value) =>
                      handleFilterChange(`exception_${key}`, value)
                    }
                    t={t}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Date & Time Card for Specific Statuses */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Date & Time Filters by Status")}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6">
                <div className="flex flex-col gap-2 border-b pb-4">
                  <label className="text-base font-semibold">
                    {t("Created Date Range")}
                  </label>
                  <DateTimeRangePicker
                    filters={{
                      from: filters.created_from,
                      to: filters.created_to,
                      from_time: filters.created_from_time,
                      to_time: filters.created_to_time,
                    }}
                    onChange={(key, value) =>
                      handleFilterChange(`created_${key}`, value)
                    }
                    t={t}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.todayOnly}
                      onChange={(e) =>
                        dispatch({
                          type: "SET_TODAY_ONLY",
                          payload: e.target.checked,
                        })
                      }
                    />
                    <label className="text-sm">{t("Today Only")}</label>
                  </div>
                </div>
                <div className="flex flex-col gap-2 border-b pb-4">
                  <label className="text-base font-semibold">
                    {t("Delivered Date Range")}
                  </label>
                  <DateTimeRangePicker
                    filters={{
                      from: filters.delivered_from,
                      to: filters.delivered_to,
                      from_time: filters.delivered_from_time,
                      to_time: filters.delivered_to_time,
                    }}
                    onChange={(key, value) =>
                      handleFilterChange(`delivered_${key}`, value)
                    }
                    t={t}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 mt-4 items-end justify-end">
              <Button variant="outline" size="sm" onClick={handleClear}>
                {t("Clear Filters")}
              </Button>
              <Button variant="default" size="sm" onClick={handleApply}>
                {t("Apply Filters")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ShipmentFilters;
