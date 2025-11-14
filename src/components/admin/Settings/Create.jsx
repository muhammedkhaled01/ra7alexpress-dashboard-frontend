import { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import axiosMerchant from "@/axios";  
import Select from "@/components/misc/Select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

function Create({ onSubmitSuccess }) {
  const { t } = useTranslation();
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState(null);
  const [value, setValue] = useState(null);
  const [selectOptions, setSelectOptions] = useState([]);

  const [formData, setFormData] = useState({
    key: '',
    type: '',
    value: ''
  });

  const [errors, setErrors] = useState({
    key: '',
    type: '',
    value: ''
  });

  const [jsonData, setJsonData] = useState({});

  useEffect(() => {
    axiosMerchant.get("setting_select_options").then((res) => {
      setSelectOptions(res.data.data);
    });
  }, []);

  const validateForm = () => {
    const newErrors = {
      key: formData.key ? '' : t('Action Name is required'),
      type: formData.type ? '' : t('Type is required'),
      value: formData.value
        ? type?.value === "json"
          ? (() => {
              try {
                JSON.parse(formData.value);
                return "";
              } catch {
                return t("Invalid JSON format");
              }
            })()
          : ""
        : t('Target Status is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const form = new FormData(e.currentTarget);

      if (type?.value === "boolean") {
        form.set("value", value === "yes" ? "yes" : "no");
      }

      if (type?.value === "json") {
        // For JSON type, the value is already set in formData.value
        // No need to modify it as it's already a JSON string
      }

      const response = await axiosMerchant.post("settings/store", form);
      toast.success(response.data.message);

      if (onSubmitSuccess) onSubmitSuccess();

      resetForm();
      setShowDialog(false);
    } catch (error) {
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        errorMessages.forEach(msg => toast.error(msg));
      } else {
        toast.error(t("An error occurred while submitting the form."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ key: '', type: '', value: '' });
    setErrors({ key: '', type: '', value: '' });
    setType(null);
    setValue(null);
    setJsonData({});
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{t("Create Action")}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="grid-rows-[auto_1fr] min-h-[95%] md:min-h-[40%]">
        <DialogHeader>
          <DialogTitle>{t("Add New Setting")}</DialogTitle>
        </DialogHeader>

        <form className="grid content-evenly" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {/* Key Field */}
            <div className="input-container">
              <label htmlFor="key">{t("Action Name")}</label>
              <Input
                id="key"
                name="key"
                type="text"
                placeholder={t("Enter Action Name...")}
                value={formData.key}
                onChange={(e) => {
                  setFormData({ ...formData, key: e.target.value });
                  setErrors({ ...errors, key: '' });
                }}
                error={errors.key}
              />
              {errors.key && <p className="mt-1 text-sm text-red-500">{errors.key}</p>}
            </div>

            {/* Type Field */}
            <div className="input-container">
              <label htmlFor="type">{t("Type")}</label>
              <Select
                id="type"
                name="type"
                placeholder={t("Enter Type...")}
                options={[
                  { label: "Number", value: "integer" },
                  { label: "Select", value: "select" },
                  { label: "Boolean", value: "boolean" },
                  { label: "JSON", value: "json" },
                ]}
                value={type}
                onChange={(selected) => {
                  setType(selected);
                  setFormData({ ...formData, type: selected.value, value: '' });
                  setErrors({ ...errors, type: '', value: '' });
                  setValue(null);
                }}
                error={errors.type}
              />
              {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
            </div>

            {/* Value Field */}
            <div className="input-container">
              <label htmlFor="value">{t("Target Status")}</label>

              {type?.value === "integer" && (
                <>
                  <Input
                    id="value"
                    name="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => {
                      setFormData({ ...formData, value: e.target.value });
                      setErrors({ ...errors, value: '' });
                    }}
                  />
                  {errors.value && <p className="mt-1 text-sm text-red-500">{errors.value}</p>}
                </>
              )}

              {type?.value === "boolean" && (
                <>
                  <br />
                  <Checkbox
                    id="value"
                    name="value"
                    checked={value === "yes"}
                    onCheckedChange={(checked) => {
                      const val = checked ? "yes" : "no";
                      setValue(val);
                      setFormData({ ...formData, value: val });
                      setErrors({ ...errors, value: '' });
                    }}
                  />
                  {errors.value && <p className="mt-1 text-sm text-red-500">{errors.value}</p>}
                </>
              )}

              {type?.value === "json" && (
                <>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-2">{t("JSON Configuration")}</p>
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
                              setFormData({ ...formData, value: JSON.stringify(newJsonData) });
                              setErrors({ ...errors, value: '' });
                            }}
                            placeholder={`${t("Enter value for")} ${key}`}
                            className="flex-1"
                          />
                        </div>
                      ))
                    )}
                    <div className="mt-3">
                      <Input
                        placeholder={t("Enter JSON string directly")}
                        value={formData.value}
                        onChange={(e) => {
                          setFormData({ ...formData, value: e.target.value });
                          setErrors({ ...errors, value: '' });
                          try {
                            const parsed = JSON.parse(e.target.value || "{}");
                            setJsonData(parsed);
                          } catch (error) {
                            // Invalid JSON, keep current jsonData
                          }
                        }}
                      />
                    </div>
                  </div>
                  {errors.value && <p className="mt-1 text-sm text-red-500">{errors.value}</p>}
                </>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-x-2 mt-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
              >
                {t("Close")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Saving")}
                </>
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
