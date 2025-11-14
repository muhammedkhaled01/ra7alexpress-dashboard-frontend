import { useState } from "react";
import { Button } from "../ui/button";
import PageTitle from "./Layouts/PageTitle";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "react-hot-toast";
import axiosMerchant from "@/axios";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { can, handleError, isAuthorized } from "@/utils/helpers";
import { useNavigate } from "react-router-dom";

export default function AdminProfile() {
  const { t } = useTranslation()

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });
  const [errors, setErrors] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });

  const validateForm = () => {
    const newErrors = {
      current_password: formData.current_password ? '' : t('Current password is required'),
      password: formData.password ? '' : t('New password is required'),
      password_confirmation: formData.password_confirmation ? '' : t('Confirm new password is required')
    };
    
    if (formData.password && formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = t('Passwords do not match');
    }
    
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget)
      const response = await axiosMerchant.post("profile/update_password", form);
      toast.success(response.data.message);
      e.currentTarget.reset();
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false);
    }
  };

  const navigate = useNavigate()

  const canAccess = can("Setting access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <>
      <PageTitle title={t("Update Profile")} />
      <div className="shadow-md p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-2">{t("Update Password")}</h2>
        <form className="flex flex-col gap-4" onSubmit={handlePasswordSubmit}>
          <div className="input-container">
            <Label htmlFor="current_password">{t("Current Password")}</Label>
            <Input
              type="password"
              id="current_password"
              name="current_password"
              value={formData.current_password}
              onChange={(e) => setFormData(prev => ({ ...prev, current_password: e.target.value }))}
              error={errors.current_password}
            />
            {errors.current_password && (
              <p className="mt-1 text-sm text-red-500">{errors.current_password}</p>
            )}
          </div>
          <div className="input-container">
            <Label htmlFor="password">{t("New Password")}</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              error={errors.password}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <div className="input-container">
            <Label htmlFor="password_confirmation">{t("Confirm New Password")}</Label>
            <Input
              type="password"
              id="password_confirmation"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={(e) => setFormData(prev => ({ ...prev, password_confirmation: e.target.value }))}
              error={errors.password_confirmation}
            />
            {errors.password_confirmation && (
              <p className="mt-1 text-sm text-red-500">{errors.password_confirmation}</p>
            )}
          </div>

          <Button type="submit" className="mt-2 ml-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("Save Changes")
            )}
          </Button>
        </form>
      </div>
    </>
  );
}
