import { useEffect, useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import axiosMerchant from "@/axios";
import { default as Select } from "@/components/misc/Select";
import { Button } from "@/components/ui/button";
import {
  getBranches,
  getEmployees,
  getHubs,
  getStations,
} from "@/stores/features/ajaxFeature";
import { handleError } from "@/utils/helpers";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

function Edit({ onSubmitSuccess, record, onClose, feature }) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [morphableType, _setMorphableType] = useState([]);
  const [morphableId, _setMorphableId] = useState(null);
  const [employee, _setEmployee] = useState([]);

  const employees = useSelector((store) => store.ajax.employees);
  const hubs = useSelector((store) => store.ajax.hubs);
  const stations = useSelector((store) => store.ajax.stations);
  const branches = useSelector((store) => store.ajax.branches);

  useEffect(() => {
    if (!employees) dispatch(getEmployees());
    if (!hubs) dispatch(getHubs());
    if (!stations) dispatch(getStations());
    if (!branches) dispatch(getBranches());

    setMorphableType({
      value: record.morphable_type.toLowerCase(),
      label: record.morphable_type,
    });
    setMorphableId({
      value: record.morphable_id,
      label: record.name,
    });
    setEmployee({
      value: record.employee?.id,
      label: record.employee?.name,
    });
  }, []);

  const setMorphableType = (v) => {
    _setMorphableId(null);
    _setMorphableType(v);
  };
  const setMorphableId = (v) => {
    _setMorphableId(v);
  };
  const setEmployee = (employee) => {
    _setEmployee(employee);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await axiosMerchant.post(
        `${feature.baseEndpoint}/update`,
        formData
      );
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
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader id="no-print">
          <DialogTitle>{feature.editTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            {/* Employable Type */}
            <div className="input-container">
              <label htmlFor="morphable_type">{t("Morphable Type")}</label>
              <Select
                name="morphable_type"
                options={[
                  { value: "hub", label: t("Hub") },
                  { value: "station", label: t("Station") },
                  { value: "branch", label: t("Branch") },
                ]}
                className="basic-multi-select"
                classNamePrefix="select"
                value={morphableType}
                onChange={(value) => setMorphableType(value)}
              />
            </div>

            {/* Employable ID (based on employable type) */}
            <div className="input-container">
              <label htmlFor="morphable_id">{t("Morphable ID")}</label>
              <Select
                name="morphable_id"
                options={
                  morphableType?.value
                    ? morphableType?.value === "hub"
                      ? hubs?.map((hub) => ({
                        value: hub.id,
                        label: hub.name,
                      }))
                      : morphableType?.value === "station"
                        ? stations?.map((station) => ({
                          value: station.id,
                          label: station.name,
                        }))
                        : stations?.map((station) => ({
                          value: station.id,
                          label: station.name,
                        }))
                    : []
                }
                className="basic-multi-select"
                classNamePrefix="select"
                value={morphableId}
                onChange={(value) => setMorphableId(value)}
              />
            </div>

            {/* Employee */}
            <div className="input-container">
              <label htmlFor="employee_id">{t("Employee")}</label>
              <Select
                name="employee_id"
                options={employees?.map((manager) => ({
                  value: manager.id,
                  label: manager.name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={employee}
                onChange={(value) => setEmployee(value)}
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
