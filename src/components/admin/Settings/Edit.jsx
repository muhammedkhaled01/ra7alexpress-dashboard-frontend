import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import axiosMerchant from "@/axios";
import { getDefaultSettings } from "@/stores/features/settingFeature";
import Select from "@/components/misc/Select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

function Edit({ onSubmitSuccess, record, onClose }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [selectOptions, setSelectOptions] = useState([]);

  const [formData, setFormData] = useState({
    key: record.key,
    type: record.type,
    value: record.value,
  });

  const [errors, setErrors] = useState({ key: "", type: "", value: "" });
  const [jsonData, setJsonData] = useState({});
  const dispatch = useDispatch();

  const capitalizeFirstLetter = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const validateForm = () => {
    const newErrors = {
      key: formData.key ? "" : t("Action Name is required"),
      type: formData.type ? "" : t("Target Status is required"),
      value:
        formData.value !== null && formData.value !== ""
          ? formData.type === "json"
            ? (() => {
                try {
                  JSON.parse(formData.value);
                  return "";
                } catch {
                  return t("Invalid JSON format");
                }
              })()
            : ""
          : t("Value is required"),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === "");
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const payload = new FormData(e.currentTarget);
      payload.set("type", formData.type);
      payload.set("value", formData.value);
      payload.set("id", record.id);

      const response = await axiosMerchant.post("settings/update", payload);
      toast.success(response.data.message);
      
      // If the updated setting is default_decimal_precision, refresh the value in Redux
      if (
        record.key === 'default_decimal_precision' || 
        record.key === 'currency' 
      ) {
        await dispatch(getDefaultSettings()).unwrap();
      }
      
      onSubmitSuccess?.();
      onClose();
    } catch (error) {
      if (error.response?.data?.errors) {
        const msgs = Object.values(error.response.data.errors).flat();
        msgs.forEach((msg) => toast.error(msg));
      } else {
        toast.error(t("An error occurred while updating the setting."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    axiosMerchant.get("setting_select_options").then((res) => {
      setSelectOptions(res.data.data);

      // If select type, convert to object for Select input
      if (record.type === "select") {
        const found = res.data.data.find((o) => o.value === record.value);
        handleChange("value", found ? found.value : "");
      }

      // If json type, parse the JSON value
      if (record.type === "json") {
        try {
          const parsedJson = JSON.parse(record.value || "{}");
          setJsonData(parsedJson);
          handleChange("value", JSON.stringify(parsedJson));
        } catch (error) {
          console.error("Error parsing JSON:", error);
          setJsonData({});
          handleChange("value", "{}");
        }
      }
    });
  }, []);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader id="no-print">
          <DialogTitle>{t("Update Setting")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="key">{t("Action Name")}</label>
              <Input
                id="key"
                name="key"
                value={formData.key}
                disabled
              />
              {errors.key && (
                <p className="mt-1 text-sm text-red-500">{errors.key}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="value">{t("Target Status")}</label>

              {formData.type === "integer" && (
                <>
                  <Input
                    id="value"
                    name="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => handleChange("value", e.target.value)}
                  />
                  {errors.value && (
                    <p className="mt-1 text-sm text-red-500">{errors.value}</p>
                  )}
                </>
              )}

              {formData.type === "boolean" && (
                <>
                  <div className="mt-2">
                    <Checkbox
                      id="value"
                      name="value"
                      checked={formData.value === "yes"}
                      onCheckedChange={(checked) =>
                        handleChange("value", checked ? "yes" : "no")
                      }
                    />
                    <label htmlFor="value" className="ml-2">
                      {t("Enabled")}
                    </label>
                  </div>
                </>
              )}

              {formData.type === "json" && (
                <>
                  <div className="space-y-3">
                    {Object.keys(jsonData).length === 0 ? (
                      <div className="text-sm text-gray-500 italic">
                        {t("No JSON data available")}
                      </div>
                    ) : (
                      Object.entries(jsonData).map(([key, value]) => (
                        <div key={key} className="flex gap-2 items-center">
                          <label className="text-sm font-medium min-w-[120px]">
                            {key}:
                          </label>
                          <Input
                            value={value || ""}
                            onChange={(e) => {
                              const newJsonData = { ...jsonData, [key]: e.target.value };
                              setJsonData(newJsonData);
                              handleChange("value", JSON.stringify(newJsonData));
                            }}
                            placeholder={`${t("Enter value for")} ${key}`}
                            className="flex-1"
                          />
                        </div>
                      ))
                    )}
                  </div>
                  {errors.value && (
                    <p className="mt-1 text-sm text-red-500">{errors.value}</p>
                  )}
                </>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
