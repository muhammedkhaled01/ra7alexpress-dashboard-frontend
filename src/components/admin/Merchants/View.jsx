import React, { useEffect, useState } from "react";
import axiosMerchant from "@/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { handleError, can, hasRole } from "@/utils/helpers";
import Loader from "@/components/Loader";
import { toast } from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import PageTitle from "../Layouts/PageTitle";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  MessageSquare,
  Smartphone,
  Save,
  Loader2,
  ArrowLeft,
  Lock,
  Key
} from "lucide-react";

const MerchantProfile = () => {
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [merchant, setMerchant] = useState(null);
  const [settings, setSettings] = useState({
    email: true,
    push: false
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();

  const accessAbility = can("Merchant access") || hasRole("Merchant");

  const merchantId = params.id;

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
      return;
    }
    if (merchantId) {
      fetchMerchantProfile();
      fetchMerchantSettings();
    }
  }, [merchantId, accessAbility, navigate]);

  const fetchMerchantProfile = async () => {
    try {
      const response = await axiosMerchant?.get(`merchants/${merchantId}/profile`);
      setMerchant(response.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchantSettings = async () => {
    try {
      const response = await axiosMerchant?.get(`merchant_settings/${merchantId}`);
      if (response.data.data.notifications) {
        setSettings(response.data.data.notifications);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const updateSettings = async () => {
    setSettingsLoading(true);
    try {
      // Find the actual merchant ID from the merchant object
      const actualMerchantId = merchant?.merchant?.id;
      if (!actualMerchantId) {
        toast.error("Merchant information not found");
        return;
      }
      await axiosMerchant?.post(`merchant_settings/${actualMerchantId}/update`, {
        merchant_id: actualMerchantId,
        notifications: settings
      });
      
      toast.success(t("Settings updated successfully"));
    } catch (error) {
      handleError(error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updatePassword = async () => {
    if (!password || password.length < 6) {
      toast.error(t("Password must be at least 6 characters"));
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error(t("Passwords do not match"));
      return;
    }

    setPasswordLoading(true);
    try {
      const formData = new FormData();
      formData.append('id', merchant?.id);
      formData.append('password', password);
      
      const response = await axiosMerchant?.post("users/change_password", formData);
      toast.success(response.data.message);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        errorMessages.forEach((errorMessage) => {
          toast.error(errorMessage);
        });
      } else {
        toast.error(t("An error occurred while updating password"));
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate("/merchants");
  };

  if (loading) {
    return (
      <div>
        <PageTitle title={t("Merchant Profile")} />
        <div className="flex justify-center items-center py-8">
          <Loader />
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div>
        <PageTitle title={t("Merchant Profile")} />
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t("Merchant not found")}</p>
          {/* <Button onClick={handleGoBack} variant="outlindary" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("Back to Merchants")}
          </Button> */}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTitle title={t("Merchant Profile")} />
      
      <div className="flex justify-start mb-6">
        {/* <Button onClick={handleGoBack} variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t("Back to Merchants")}
        </Button> */}
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-4 h-4" />
              {t("Basic Information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("Name")}</span>
                </div>
                <p className="text-sm pl-6">{merchant?.name}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("Email")}</span>
                </div>
                <p className="text-sm pl-6">{merchant?.email}</p>
              </div>
            </div>
            
            {merchant?.merchant?.contact_no && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("Contact Number")}</span>
                </div>
                <p className="text-sm pl-6">{String(merchant?.merchant?.country_code ?? "") + String(merchant?.merchant?.contact_no ?? "")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Information */}
        {merchant?.merchant && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-4 h-4" />
                {t("Location Information")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {merchant?.merchant?.address && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">{t("Address")}</span>
                    <p className="text-sm text-muted-foreground">{merchant?.merchant?.address}</p>
                  </div>
                )}
                {merchant?.merchant?.country && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">{t("Country")}</span>
                    <p className="text-sm text-muted-foreground">{merchant?.merchant?.country.name}</p>
                  </div>
                )}
                {merchant?.merchant?.governorate && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">{t("governorate")}</span>
                    <p className="text-sm text-muted-foreground">{merchant?.merchant?.governorate.en_name}</p>
                  </div>
                )}
                {merchant?.merchant?.state && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">{t("State")}</span>
                    <p className="text-sm text-muted-foreground">{merchant?.merchant?.state.en_name}</p>
                  </div>
                )}
                {merchant?.merchant?.place && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">{t("Place")}</span>
                    <p className="text-sm text-muted-foreground">{merchant?.merchant?.place.en_name}</p>
                  </div>
                )}
              </div>

              {merchant?.merchant?.lat && merchant?.merchant?.lng && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">{t("Coordinates")}</span>
                  <p className="text-sm text-muted-foreground">
                    {merchant?.merchant?.lat}, {merchant?.merchant?.lng}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-4 h-4" />
              {t("Notification Settings")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("Email Notifications")}</p>
                    <p className="text-xs text-muted-foreground">{t("Receive notifications via email")}</p>
                  </div>
                </div>
                <Switch
                  checked={settings.email}
                  onCheckedChange={(checked) => handleSettingChange('email', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("Whatsapp Notifications")}</p>
                    <p className="text-xs text-muted-foreground">{t("Receive whatsapp notifications")}</p>
                  </div>
                </div>
                <Switch
                  checked={settings.whatsapp}
                  onCheckedChange={(checked) => handleSettingChange('whatsapp', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Update Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="w-4 h-4" />
              {t("Change Password")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <label htmlFor="new-password" className="text-sm font-medium">
                    {t("New Password")}
                  </label>
                </div>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("Enter new password...")}
                  className="ml-6"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <label htmlFor="confirm-password" className="text-sm font-medium">
                    {t("Confirm Password")}
                  </label>
                </div>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("Confirm new password...")}
                  className="ml-6"
                />
              </div>

              <div className="ml-6 pt-2">
                <Button 
                  onClick={updatePassword} 
                  disabled={passwordLoading || !password || !confirmPassword}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  {passwordLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {t("Update Password")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-start mt-6">
        <Button 
          onClick={updateSettings} 
          disabled={settingsLoading}
          className="flex items-center gap-2"
        >
          {settingsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {t("Save Settings")}
        </Button>
      </div>
    </div>
  );
};

export default MerchantProfile;
