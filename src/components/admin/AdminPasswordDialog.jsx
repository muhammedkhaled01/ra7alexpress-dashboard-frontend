import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from 'react-hot-toast';
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

// Helper to evaluate password strength
const getPasswordStrength = (password) => {
  let strength = 0;
  const rules = [
    /.{8,}/,
    /[A-Z]/,
    /[a-z]/,
    /[0-9]/,
    /[^A-Za-z0-9]/,
  ];
  rules.forEach((rule) => rule.test(password) && strength++);
  return strength;
};

const strengthColors = [
  { label: "Very Weak", color: "bg-red-500" },
  { label: "Weak", color: "bg-orange-500" },
  { label: "Fair", color: "bg-yellow-500" },
  { label: "Good", color: "bg-blue-500" },
  { label: "Strong", color: "bg-green-500" },
];

function AdminPasswordDialog({ onSubmitSuccess, userId, onClose }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    setStrength(getPasswordStrength(password));
  }, [password]);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const validateForm = () => {
    const newErrors = {};

    if (!password) {
      newErrors.password = t('Password is required');
    } else if (password.length < 8) {
      newErrors.password = t('Password must be at least 8 characters');
    } else if (strength < 3) {
      newErrors.password = t('Password is too weak');
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('Passwords do not match');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('password', password);
      formData.append('id', userId);
      
      const response = await axiosMerchant.post("users/change_password", formData);
      toast.success(response.data.message);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        errorMessages.forEach((errorMessage) => {
          toast.error(errorMessage);
        });
      } else {
        toast.error(t("An error occurred while submitting the form."));
      }
      console.error("Failed to submit data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader id="no-print">
          <DialogTitle>{t("Change Password")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 mt-2">
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block mb-1">
                {t("New Password")}
              </label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("e.g Aa@123456")}
                icon={
                  <div className="cursor-pointer" onClick={togglePasswordVisibility}>
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </div>
                }
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}

              {/* Password Strength Bar */}
              <AnimatePresence>
                {password && (
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
              {password && (
                <p className="text-sm mt-1 text-muted-foreground">
                  {t(strengthColors[strength - 1]?.label || "Too Short")}
                </p>
              )}

              {/* Guidelines */}
              <ul className="mt-2 text-xs text-muted-foreground list-disc pl-5 space-y-1">
                <li>{t("At least 8 characters")}</li>
                <li>{t("Include uppercase and lowercase letters")}</li>
                <li>{t("Include numbers")}</li>
                <li>{t("Include special characters (!@#$%)")}</li>
              </ul>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block mb-1">
                {t("Confirm Password")}
              </label>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("Confirm your new password")}
                icon={
                  <div className="cursor-pointer" onClick={toggleConfirmPasswordVisibility}>
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </div>
                }
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-x-2 mt-6">
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

AdminPasswordDialog.propTypes = {
  onSubmitSuccess: PropTypes.func,
  userId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired
};

export default AdminPasswordDialog;
