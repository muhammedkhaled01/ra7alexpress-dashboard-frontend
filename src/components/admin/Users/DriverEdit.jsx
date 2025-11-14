import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Select from "@/components/misc/Select";
import { Button } from "@/components/ui/button";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { can, handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { getRoles, getCompanies } from "@/stores/features/ajaxFeature";
import PhoneInput from "@/components/misc/PhoneInput";
import RequiredField from "@/components/misc/RequiredField";
import ImagePreview from "@/components/misc/ImagePreview";

function DriverEdit({ onSubmitSuccess, record, onClose }) {
  console.log(record, "record");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState(
    String(record?.driver?.country_code ?? "") +
      String(record?.driver?.phone ?? "")
  );
  const [imagePreviews, setImagePreviews] = useState({
    license: null,
    id_card: null,
    car_ownership_id: null,
  });
  const [errors, setErrors] = useState({
    name: "",
    username: "",
    email: "",
    company_id: "",
    phone: "",
  });

  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const roles = useSelector((store) => store.ajax.roles);
  const companies = useSelector((store) => store.ajax.companies);
  console.log(record?.driver?.is_guest, "record?.driver?.is_guest");
  const [selectedGuest, setSelectedGuest] = useState({
    value: record?.driver?.is_guest ? 1 : 0,
    label: record?.driver?.is_guest ? t("Guest") : t("Not Guest"),
  });

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => ({
          ...prev,
          [type]: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (form) => {
    const newErrors = {
      name: form.get("name") ? "" : t("Name is required"),
      username: form.get("username") ? "" : t("Username is required"),
      // email: form.get("email") ? "" : t("Email is required"),
      phone: form.get("phone") ? "" : t("Phone is required"),
      company_id:
        selectedGuest?.value === 0
          ? form.get("company_id")
            ? ""
            : t("Company is required")
          : "",
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!validateForm(form)) return;
    form.append("id", user.id);
    form.append("is_guest", selectedGuest?.value);
    if (selectedGuest?.value === 1 && record?.driver?.company_id) {
      form.append("company_id", record.driver.company_id);
    }
    setIsLoading(true);
    try {
      const response = await axiosMerchant.post(
        `drivers/update/${user.id}`,
        form
      );
      toast.success(response.data.message);
      onSubmitSuccess();
      onClose();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const canAccess = can("User update");

  useEffect(() => {
    if (!companies?.length) {
      dispatch(getCompanies());
    }
    if (record) {
      setUser(record);
    } else if (params.id) {
      axiosMerchant.get(`users/${params.id}`).then((response) => {
        setUser(response.data.data);
      });
    }
  }, [record, params.id]);

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  const renderImageField = (type, label) => {
    const currentImage = user?.driver?.[type];
    const newPreview = imagePreviews[type];

    return (
      <div className="input-container">
        <label htmlFor={type}>{t(label)}</label>
        <Input
          name={type}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageChange(e, type)}
          className="cursor-pointer"
        />
        <div className="mt-2">
          {newPreview ? (
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {t("New Image Preview:")}
              </p>
              <ImagePreview
                src={newPreview}
                alt={`New ${label}`}
                fileName={currentImage}
              />
            </div>
          ) : currentImage ? (
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {t("Current Image:")}
              </p>
              <ImagePreview
                src={`${currentImage}`}
                alt={label}
                fileName={currentImage}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("No image uploaded")}
            </p>
          )}
        </div>
      </div>
    );
  };
  console.log(selectedGuest, "selectedGuest");
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>{t("Update Driver")}</DialogTitle>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 gap-4 mt-2">
                <div className="input-container">
                  <label htmlFor="driver_type">{t("Driver Type")}</label>
                  <Select
                    name="is_guest"
                    options={[
                      { value: 0, label: t("Not Guest") },
                      { value: 1, label: t("Guest") },
                    ]}
                    value={selectedGuest}
                    onChange={(selectedOption) => {
                      setSelectedGuest(selectedOption);
                    }}
                  />
                </div>
                <div className="input-container">
                  <label htmlFor="name">{t("Name")}</label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    defaultValue={user?.name}
                    error={errors.name}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>
                <div className="input-container">
                  <label htmlFor="username">{t("Username")}</label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    defaultValue={user?.username}
                    error={errors.username}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                  )}
                </div>
                <div className="input-container">
                  <label htmlFor="email">{t("Email")}</label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={user?.email}
                    error={errors.email}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                <div className="input-container">
                  <label htmlFor="contact_no">{t("Phone")}</label>
                  <PhoneInput
                    country={"eg"}
                    value={phone}
                    onChange={setPhone}
                    enableSearch={true}
                    inputClass="!bg-background !text-foreground"
                    buttonClass="!bg-muted"
                  />
                  <input type="hidden" name="phone" value={phone} />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>
                {selectedGuest?.value === 0 && (
                  <div className="input-container">
                    <label htmlFor="company_id">{t("Company")}</label>
                    <Select
                      name="company_id"
                      options={
                        companies?.map((company) => ({
                          value: company.id,
                          label: company.name,
                        })) || []
                      }
                      defaultValue={
                        record?.driver?.company_id
                          ? {
                              value: record.driver.company_id,
                              label: companies?.find(
                                (c) => c.id === record.driver.company_id
                              )?.name,
                            }
                          : null
                      }
                      error={errors.company_id}
                    />
                    {errors.company_id && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.company_id}
                      </p>
                    )}
                  </div>
                )}
                {renderImageField("license", "License")}
                {renderImageField("id_card", "ID Card")}
                {renderImageField("car_ownership_id", "Car Ownership ID")}
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("Cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("Save Changes")
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

DriverEdit.propTypes = {
  onSubmitSuccess: PropTypes.func.isRequired,
  record: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    email: PropTypes.string,
    driver: PropTypes.shape({
      phone: PropTypes.string,
      company_id: PropTypes.number,
      license: PropTypes.string,
      id_card: PropTypes.string,
      car_ownership_id: PropTypes.string,
      is_guest: PropTypes.bool,
    }),
    roles: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
      })
    ),
  }),
  onClose: PropTypes.func.isRequired,
};

export default DriverEdit;
