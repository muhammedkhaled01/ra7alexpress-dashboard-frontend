import React from "react";
import { PhoneNumberUtil } from "google-libphonenumber";
import { cn } from "@/lib/utils";
import CustomPhoneInput from "./CustomPhoneInput"; // ✅ default export

const phoneUtil = PhoneNumberUtil.getInstance();

export const isPhoneValid = (phone) => {
  try {
    return phoneUtil.isValidNumber(phoneUtil.parseAndKeepRawInput(phone));
  } catch {
    return false;
  }
};

export default function PhoneInput({
  state,
  setState,
  value,
  onChange,
  error,
  showError = false,
  className,
  ...props
}) {
  const phoneValue = value ?? state;
  const phoneOnChange = onChange ?? setState;
  return (
    <div className={cn("relative", className)}>
      <CustomPhoneInput
        defaultCountry="eg"
        value={phoneValue}
        onChange={phoneOnChange}
        className={`w-full ${error
          ? "!border-red-500 !focus:ring-red-500 !focus:border-red-500 !dark:border-red-600"
          : "border-zinc-300 dark:border-zinc-700"}`}
        inputClassName=""
        {...props}
      />
      {error && showError && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
