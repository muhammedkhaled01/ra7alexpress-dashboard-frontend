import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2, Plus, Trash2Icon, Eye, EyeOff } from "lucide-react";
import { replace, useNavigate, useParams } from "react-router-dom";
import Select from "@/components/misc/Select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { can, handleError, generateTabId } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import RequiredField from "@/components/misc/RequiredField";
import { Input } from "@/components/ui/input";
import { useDispatch, useSelector } from "react-redux";
import { getCompanies, getDrivers } from "@/stores/features/ajaxFeature";
import { closeTab } from "@/stores/features/tabsFeature";
import PhoneInput from "@/components/misc/PhoneInput";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

function CreateDriver() {
  const [isLoading, setIsLoading] = useState(false);
  const [driverUser, setDriverUser] = useState(null);
  const [relativeRows, setRelativeRows] = useState([
    { id: Date.now(), value: "" },
  ]);
  const [fileRows, setFileRows] = useState([{ id: Date.now(), value: "" }]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    company_id: "",
    phone: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    company_id: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);

  // Helper to evaluate password strength
  const getPasswordStrength = (password) => {
    let strength = 0;
    const rules = [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/];
    rules.forEach((rule) => rule.test(password) && strength++);
    return strength;
  };

  useEffect(() => {
    setStrength(getPasswordStrength(formData.password));
  }, [formData.password]);
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { activeTabId } = useSelector((state) => state.tabs);

  const companies = useSelector((store) => store.ajax.companies) || []; // Initialize as empty array if undefined

  useEffect(() => {
    if (!companies.length) {
      dispatch(getCompanies());
    }
  }, [dispatch, companies]);

  const strengthColors = [
    { label: t("Very Weak"), color: "bg-red-500" },
    { label: t("Weak"), color: "bg-orange-500" },
    { label: t("Fair"), color: "bg-yellow-500" },
    { label: t("Good"), color: "bg-blue-500" },
    { label: t("Strong"), color: "bg-green-500" },
  ];

  const validateForm = () => {
    const newErrors = {
      username: formData.username ? "" : t("Username is required"),
      name: formData.name ? "" : t("Name is required"),
      // email: formData.email ? '' : t('Email is required'),
      phone: formData.phone ? "" : t("Phone is required"),
      password: formData.password ? "" : t("Password is required"),
      company_id: formData.company_id ? "" : t("Company is required"),
    };

    if (formData.password && formData.password.length < 8) {
      newErrors.password = t("Password must be at least 8 characters");
    } else if (formData.password && strength < 3) {
      newErrors.password = t("Password is too weak");
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      form.append("phone", formData.phone);
      const response = await axiosMerchant.post(`users/store_driver`, form);
      toast.success(response.data.message);
      dispatch(getDrivers());

      const currentTabId = generateTabId("/users/create-driver");
      navigate("/drivers", { state: { closeTabId: currentTabId } });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRelative = () => {
    setRelativeRows([...relativeRows, { id: Date.now(), value: "" }]);
  };

  const handleRemoveRelative = (id) => {
    setRelativeRows(relativeRows.filter((row) => row.id !== id));
  };

  const handleAddFile = () => {
    setFileRows([...fileRows, { id: Date.now(), value: "" }]);
  };

  const handleRemoveFile = (id) => {
    setFileRows(fileRows.filter((row) => row.id !== id));
  };

  const canAccess = can("Drivers create");

  if (!canAccess) {
    navigate("/unauthorized");
    return null;
  }

  return (
    <div>
      <Card className="">
        <CardHeader>
          <CardTitle>{t("Create Driver")}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="input-container">
                <label htmlFor="name">
                  {t("Name")} <RequiredField />
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder={t("Enter driver's name...")}
                  error={errors.name}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="username">
                  {t("Username")} <RequiredField />
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder={t("Enter driver's username...")}
                  error={errors.name}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="company_id">
                  {t("Company")} <RequiredField />
                </label>
                <Select
                  name="company_id"
                  options={[
                    { value: "", label: t("Select Company") },
                    ...companies?.map((company) => ({
                      value: company.id,
                      label: company.name,
                    })),
                  ].filter((opt) => opt.value !== "")}
                  className="basic-multi-select"
                  placeholder={t("Select Company...")}
                  classNamePrefix="select"
                  value={{
                    value: formData.company_id,
                    label: companies?.find((c) => c.id === formData.company_id)
                      ?.name,
                  }}
                  onChange={(opt) =>
                    setFormData((prev) => ({ ...prev, company_id: opt.value }))
                  }
                  error={errors.company_id}
                />
                {errors.company_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.company_id}
                  </p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="phone">
                  {t("Phone")} <RequiredField />
                </label>
                <PhoneInput
                  country={"eg"}
                  value={formData.phone}
                  onChange={(phone) =>
                    setFormData((prev) => ({ ...prev, phone: phone }))
                  }
                  enableSearch={true}
                  inputClass="!bg-background !text-foreground"
                  buttonClass="!bg-muted"
                  error={errors.phone}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="email">{t("Email")}</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder={t("E.g. driver@example.com")}
                  error={errors.email}
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
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder={t("e.g Aa@123456")}
                  error={errors.password}
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
                <label htmlFor="license">{t("License")}</label>
                <Input
                  name="license"
                  type="file"
                  placeholder={t("Select driver's license...")}
                />
              </div>
              <div className="input-container">
                <label htmlFor="id_card">{t("ID Card")}</label>
                <Input
                  name="id_card"
                  type="file"
                  placeholder={t("Select ID card...")}
                />
              </div>
              <div className="input-container">
                <label htmlFor="car_ownership_id">
                  {t("Car Ownership ID")}
                </label>
                <Input
                  name="car_ownership_id"
                  type="file"
                  placeholder={t("Select car ownership document...")}
                />
              </div>

              {/* <div className="input-container">
                <label htmlFor="role">{t("Role")}</label>
                <Select
                  name="role"
                  options={roles?.map(role => ({ value: role.id, label: role.name }))}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div> */}
              {/* <div className="input-container">
                <label htmlFor="driver_id">{t("Driver")}</label>
                <Select
                  name="driver_id"
                  options={drivers?.map(driver => ({ value: driver.id, label: driver.name }))}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div> */}
              {/* <div className="input-container">
                <label htmlFor="image">Profile Image</label>
                <Input name="image" type="file" />
              </div> */}
            </div>
            <div className="grid grid-cols-12 gap-4 mt-2">
              <Card className="mt-4 col-span-12 md:col-span-7">
                <CardHeader>
                  <div className="flex flex-row justify-between align-center">
                    <CardTitle className="self-center">
                      {t("Relatives")}
                    </CardTitle>
                    <Button
                      className=" dark:bg-gray-700 dark:hover:bg-gray-900 dark:text-white"
                      type="button"
                      onClick={handleAddRelative}
                      variant="add"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {relativeRows.map((row, index) => (
                    <div
                      key={row.id}
                      className="flex flex-col md:flex-row gap-4"
                    >
                      <div className="input-container">
                        <label className="dark:text-gray-400" htmlFor="name">
                          {t("Relative Name")}
                        </label>
                        <Input
                          id="name"
                          name="relative_name[]"
                          type="text"
                          placeholder={t("Enter Relative name...")}
                        />
                      </div>
                      <div className="input-container">
                        <label
                          className="dark:text-gray-400"
                          htmlFor="relative_phone"
                        >
                          {t("Phone")}
                        </label>
                        <Input
                          id="relative_phone"
                          name="relative_phone[]"
                          type="text"
                          placeholder={t("Type Phone...")}
                        />
                      </div>
                      <div className="input-container">
                        <label
                          className="dark:text-gray-400"
                          htmlFor="relation"
                        >
                          {t("Relation")}
                        </label>
                        <Input
                          id="relation"
                          name="relation[]"
                          type="text"
                          placeholder={t("e.g. brother, father")}
                        />
                      </div>

                      <div className="flex items-end justify-end">
                        <Button
                          type="button"
                          variant="delete"
                          onClick={() => handleRemoveRelative(row.id)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="mt-4 col-span-12 md:col-span-5">
                <CardHeader>
                  <div className="flex flex-row justify-between align-center">
                    <CardTitle className="self-center">{t("Files")}</CardTitle>
                    <Button
                      className=" dark:bg-gray-700 dark:hover:bg-gray-900 dark:text-white"
                      type="button"
                      onClick={handleAddFile}
                      variant="add"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {fileRows.map((row, index) => (
                    <div
                      key={row.id}
                      className="flex flex-col md:flex-row gap-4"
                    >
                      <div className="input-container">
                        <label className="dark:text-gray-400" htmlFor="name">
                          {t("Name")}
                        </label>
                        <Input
                          id="name"
                          name="file_name[]"
                          type="text"
                          placeholder={t("Enter File name...")}
                        />
                      </div>
                      <div className="input-container">
                        <label className="dark:text-gray-400" htmlFor="name">
                          {t("File")}
                        </label>
                        <Input
                          id="files"
                          className="h-[42px]"
                          name="files[]"
                          type="file"
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <Button
                          type="button"
                          variant="delete"
                          onClick={() => handleRemoveFile(row.id)}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="mt-4 ml-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("Save Changes")
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default CreateDriver;
