import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { can, handleError, generateTabId } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { getRoles, getStations } from "@/stores/features/ajaxFeature";
import { useDispatch, useSelector } from "react-redux";
import { closeTab } from "@/stores/features/tabsFeature";
import PhoneInput from "@/components/misc/PhoneInput";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

function StationUserCreate() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    station_id: "",
    phone: "",
  });
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // Helper to evaluate password strength
  const getPasswordStrength = (password) => {
    let strength = 0;
    const rules = [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/];
    rules.forEach((rule) => rule.test(password) && strength++);
    return strength;
  };

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    station_id: "",
  });

  useEffect(() => {
    setStrength(getPasswordStrength(formData.password));
  }, [formData.password]);

  const strengthColors = [
    { label: t("Very Weak"), color: "bg-red-500" },
    { label: t("Weak"), color: "bg-orange-500" },
    { label: t("Fair"), color: "bg-yellow-500" },
    { label: t("Good"), color: "bg-blue-500" },
    { label: t("Strong"), color: "bg-green-500" },
  ];

  const stations = useSelector((store) => store.ajax.stations);

  useEffect(() => {
    if (!stations) dispatch(getStations());
  }, [dispatch, stations]);

  const validateForm = (formData) => {
    const newErrors = {
      name: formData.get("name") ? "" : t("Name is required"),
      // email: formData.get("email") ? "" : t("Email is required"),
      password: formData.get("password") ? "" : t("Password is required"),
      station_id: formData.get("station_id") ? "" : t("Station is required"),
      phone: phone ? "" : t("Phone is required"),
    };

    const password = formData.get("password");
    if (password && password.length < 8) {
      newErrors.password = t("Password must be at least 8 characters");
    } else if (password && strength < 3) {
      newErrors.password = t("Password is too weak");
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!validateForm(formData)) {
      return;
    }

    const stationIds = formData.getAll("station_id");
    setIsLoading(true);

    try {
      const payload = {
        name: formData.get("name"),
        username: formData.get("username"),
        email: formData.get("email"),
        password: formData.get("password"),
        phone: phone,
        station_id: stationIds,
      };

      const response = await axiosMerchant.post(
        `users/store_station_admin/`,
        payload
      );
      toast.success(response.data.message);
      // Navigate to users list and pass tab ID to close
      const currentTabId = generateTabId("/create-station-admin");
      navigate("/users", { state: { closeTabId: currentTabId } });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const canAccess = can("User create");

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <Card className="">
        <CardHeader>
          <CardTitle>{t("Create Station Admin")}</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mt-2">
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
                <label htmlFor="username">
                  {t("Username")} <RequiredField />
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder={t("Enter Username")}
                  error={errors.username}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="email">{t("Email")} </label>
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
                <label htmlFor="station_id">
                  {t("Station")} <RequiredField />
                </label>
                <Select
                  name="station_id"
                  options={stations?.map((station) => ({
                    value: station.id,
                    label: station.name,
                  }))}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder={t("Select Station")}
                  error={errors.station_id}
                />
                {errors.station_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.station_id}
                  </p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="phone">
                  {t("Phone")} <RequiredField />
                </label>
                <PhoneInput
                  country={"eg"}
                  value={phone}
                  onChange={setPhone}
                  enableSearch={true}
                  inputClass="!bg-background !text-foreground"
                  buttonClass="!bg-muted"
                />
              </div>
              {/* <div>
                <label htmlFor="image">Profile Image</label>
                <Input name="image" type="file" />
              </div> */}
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

export default StationUserCreate;
