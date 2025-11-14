import axiosMerchant from "@/axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getTruckDrivers, getTrucks } from "@/stores/features/ajaxFeature";
import { handleError } from "@/utils/helpers";
import { Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import PhoneInput from "@/components/misc/PhoneInput";

function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone_number: "",
    id_card_number: "",
    company: "",
    status: "active",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);

  const strengthColors = [
    { label: t("Very Weak"), color: "bg-red-500" },
    { label: t("Weak"), color: "bg-orange-500" },
    { label: t("Fair"), color: "bg-yellow-500" },
    { label: t("Good"), color: "bg-blue-500" },
    { label: t("Strong"), color: "bg-green-500" },
  ];

  const getPasswordStrength = (password) => {
    let strength = 0;
    const rules = [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/];
    rules.forEach((rule) => rule.test(password) && strength++);
    return strength;
  };

  useEffect(() => {
    setStrength(getPasswordStrength(formData.password));
  }, [formData.password]);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    phone_number: "",
    id_card_number: "",
    company: "",
    status: "",
  });

  const dispatch = useDispatch();

  const statusOptions = [
    { value: "active", label: t("Active") },
    { value: "inactive", label: t("Inactive") },
  ];

  const validateForm = () => {
    const newErrors = {
      name: formData.name ? "" : t("Name is required"),
      email: formData.email ? "" : t("Email is required"),
      password: formData.password ? "" : t("Password is required"),
      phone_number: formData.phone_number ? "" : t("Phone Number is required"),
      id_card_number: formData.id_card_number
        ? ""
        : t("ID Card Number is required"),
      company: formData.company ? "" : t("Company is required"),
      status: formData.status ? "" : t("Status is required"),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    const isValid = validateForm();
    if (!isValid) return;

    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      form.append("phone_number", formData.phone_number);
      const response = await axiosMerchant.post(`truck_drivers/store`, form);
      toast.success(response.data.message);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      setShowDialog(false);
      dispatch(getTruckDrivers());
    } catch (error) {
      handleError(error);
      setShowDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{t("Create Truck Driver")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("Create Truck Driver")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name">
                {t("Name")} <RequiredField />
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                aria-label={t("Name")}
                placeholder={t("Enter name...")}
                error={errors.name}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }));
                }}
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
                aria-label={t("Email")}
                placeholder={t("Enter email...")}
                error={errors.email}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }));
                }}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="password">
                {t("Password")} <RequiredField />
              </label>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                aria-label={t("Password")}
                placeholder={t("e.g Aa@123456")}
                error={errors.password}
                value={formData.password}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }));
                }}
                icon={
                  <div
                    className="cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </div>
                }
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}

              {/* Password Strength Bar */}
              <AnimatePresence>
                {formData.password && (
                  <motion.div
                    className="mt-2 h-2 rounded transition-all"
                    initial={{ width: 0 }}
                    animate={{ width: `${(strength / 5) * 100}%` }}
                    exit={{ width: 0 }}
                  >
                    <div
                      className={clsx(
                        "h-full rounded",
                        strengthColors[strength - 1]?.color || "bg-gray-300"
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Strength Label */}
              {formData.password && (
                <p className="text-sm mt-1 text-muted-foreground">
                  {t(strengthColors[strength - 1]?.label || "Too Short")}
                </p>
              )}

              {/* Guidelines */}
              {formData.password && (
                <ul className="mt-2 text-xs text-muted-foreground list-disc pl-5 space-y-1">
                  <li>{t("At least 8 characters")}</li>
                  <li>{t("Include uppercase and lowercase letters")}</li>
                  <li>{t("Include numbers")}</li>
                  <li>{t("Include special characters (!@#$%)")}</li>
                </ul>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="phone_number">
                {t("Phone Number")} <RequiredField />
              </label>
              <PhoneInput
                country={"eg"}
                value={formData.phone_number}
                onChange={(phone) =>
                  setFormData((prev) => ({ ...prev, phone_number: phone }))
                }
                enableSearch={true}
                inputClass="!bg-background !text-foreground"
                buttonClass="!bg-muted"
              />
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.phone_number}
                </p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="id_card_number">
                {t("ID Card Number")} <RequiredField />
              </label>
              <Input
                id="id_card_number"
                name="id_card_number"
                type="text"
                aria-label={t("ID Card Number")}
                placeholder={t("Enter ID card number...")}
                error={errors.id_card_number}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    id_card_number: e.target.value,
                  }));
                }}
              />
              {errors.id_card_number && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.id_card_number}
                </p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="company">
                {t("Company")} <RequiredField />
              </label>
              <Input
                id="company"
                name="company"
                type="text"
                aria-label={t("Company")}
                placeholder={t("Enter company...")}
                error={errors.company}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    company: e.target.value,
                  }));
                }}
              />
              {errors.company && (
                <p className="mt-1 text-sm text-red-500">{errors.company}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="status">
                {t("Status")} <RequiredField />
              </label>
              <Select
                options={statusOptions}
                name="status"
                placeholder={t("Select status...")}
                isClearable={false}
                defaultValue={statusOptions[0]}
                error={errors.status}
                onChange={(selected) => {
                  setFormData((prev) => ({
                    ...prev,
                    status: selected?.value || "",
                  }));
                }}
              />
              {errors.status && (
                <p className="mt-1 text-sm text-red-500">{errors.status}</p>
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

export default Create;
