import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Loader from "@/components/Loader";
import { statusOptions } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Select from "@/components/misc/Select";
import { useSelector, useDispatch } from "react-redux";
import { getFacilities } from "@/stores/features/ajaxFeature";
import { setShipmentFilters, clearShipmentFilters } from "@/stores/features/shipmentFiltersFeature";
import moment from "@/utils/moment.js";
import { DateTimeRangePicker } from '@/components/misc/DateTimeRangePicker';

function ShipmentFilters({ isOpen, setIsOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const { facilities } = useSelector((state) => state.ajax);
  const filters = useSelector((state) => state.shipmentFilters);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // Fetch facilities if not already loaded
  useEffect(() => {
    if (!facilities) {
      setLoading(true);
      dispatch(getFacilities()).finally(() => setLoading(false));
    }
  }, [dispatch, facilities]);

  // Handle "Today Only" toggle
  useEffect(() => {
    if (filters.todayOnly) {
      const today = moment().format("YYYY-MM-DD");
      dispatch(
        setShipmentFilters({
          ...filters,
          from: today,
          to: today,
          from_time: "00:00",
          to_time: "23:59",
        })
      );
    }
  }, [filters.todayOnly, dispatch]);

  const handleFilterChange = (key, value) => {
    // إذا تم تغيير التاريخ أو الوقت، قم بإلغاء تحديد "Today Only"
    if (["from", "to", "from_time", "to_time"].includes(key)) {
      dispatch(
        setShipmentFilters({
          ...filters,
          [key]: value,
          todayOnly: false,
        })
      );
    } else {
      dispatch(setShipmentFilters({ ...filters, [key]: value }));
    }
  };

  const handleApply = () => {
    dispatch(setShipmentFilters({ ...filters }));
    onClose();
  };

  const handleClear = () => {
    dispatch(clearShipmentFilters());
    onClose();
  };

  const mapToOptions = (arr) =>
    arr?.map((item) => ({
      value: item.id,
      label: item.name,
      type: item.type,
    })) || [];

  const facilityGroups = [
    {
      label: t("Hubs"),
      options: mapToOptions(facilities?.hubs),
    },
    {
      label: t("Stations"),
      options: mapToOptions(facilities?.stations),
    },
    {
      label: t("Branches"),
      options: mapToOptions(facilities?.branches),
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={() => setIsOpen(false)}>
      <SheetContent className="w-full sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("Filters")}</SheetTitle>
        </SheetHeader>
        {loading ? (
          <Loader />
        ) : (
          <div className="p-4 border-t space-y-3">
            <div className="grid grid-cols-1 gap-3">
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
                <label className="text-sm font-medium">{t("Date and Time Range")}</label>
                <div className="flex flex-col gap-2">
                  <DateTimeRangePicker
                    filters={{
                      from: filters.from,
                      to: filters.to,
                      from_time: filters.from_time,
                      to_time: filters.to_time,
                    }}
                    onChange={handleFilterChange}
                    t={t}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.todayOnly}
                      onChange={(e) => handleFilterChange("todayOnly", e.target.checked)}
                    />
                    <label className="text-sm">{t("Today Only")}</label>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">{t("Facility")}</label>
                <Select
                  name="facility"
                  placeholder={t("Select facility...")}
                  options={facilityGroups}
                  onChange={(option) => handleFilterChange("facility", option)}
                  isClearable
                  value={filters.facility}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={handleClear}>
                {t("Clear Filters")}
              </Button>
              <Button variant="default" size="sm" onClick={handleApply}>
                {t("Apply Filters")}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default ShipmentFilters;