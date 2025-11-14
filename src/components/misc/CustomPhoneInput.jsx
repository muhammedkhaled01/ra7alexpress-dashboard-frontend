/* eslint-disable react/prop-types */
import React from "react";
import * as Select from "@radix-ui/react-select";
import {
  defaultCountries,
  FlagImage,
  parseCountry,
  usePhoneInput,
} from "react-international-phone";
import { ChevronDown, Check } from "lucide-react";

/**
 * CustomPhoneInput
 * - الكود الدولي يظهر جوه زرّ العلم
 * - الانبوت بيعرض الجزء الوطني فقط
 * - onChange بيرجع E.164 (+{dial}{national})
 * - throttled بـ requestAnimationFrame علشان السرعة
 */
function CustomPhoneInput({
  value,
  onChange,
  defaultCountry = "eg",
  className = "",
  inputClassName = "",
  id,
  name,
  placeholder = "",
  disabled = false,
  required = false,
  autoFocus = false,
  onFocus,
  onBlur,
}) {
  // hook من الباكدچ — اديه defaultCountry + value
  const { inputValue, inputRef, country, setCountry } = usePhoneInput({
    defaultCountry,
    value,
    countries: defaultCountries,
  });

  // regex ثابت لكل dialCode (ما يتبنيش في كل حرف)
  const stripRegex = React.useMemo(() => {
    const dial = country?.dialCode || "";
    return new RegExp(`^\\+${dial}\\s*`);
  }, [country?.dialCode]);

  // اللي يظهر في الانبوت (غير مُسبوق بالكود)
  const national = React.useMemo(
    () => (inputValue || "").replace(stripRegex, ""),
    [inputValue, stripRegex]
  );

  // ثروتل خفيف علشان يخف lag الكتابة
  const rafId = React.useRef(0);
  const emit = React.useCallback(
    (e164) => {
      if (!onChange) return;
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => onChange(e164));
    },
    [onChange]
  );

  const onNationalChange = React.useCallback(
    (e) => {
      const raw = e.target.value || "";
      const digits = raw.replace(/\s+/g, ""); // شيل مسافات
      const dial = country?.dialCode;
      const e164 = dial ? `+${dial}${digits}` : digits;
      emit(e164);
    },
    [country?.dialCode, emit]
  );

  React.useEffect(() => () => cancelAnimationFrame(rafId.current), []);

  // قائمة الدول — متولّدة مرة واحدة
  const countryItems = React.useMemo(
    () =>
      defaultCountries.map((c) => {
        const cc = parseCountry(c);
        return (
          <Select.Item
            key={cc.iso2}
            value={cc.iso2}
            className="relative flex cursor-pointer select-none items-center gap-2
                       rounded-md px-2 py-2 text-sm text-gray-900 outline-none
                       hover:bg-gray-100 data-[state=checked]:bg-gray-100"
          >
            <Select.ItemIndicator className="absolute left-2">
              <Check className="h-4 w-4 text-blue-600" />
            </Select.ItemIndicator>

            <div className="ml-5 flex items-center gap-2">
              <FlagImage iso2={cc.iso2} className="h-4 w-6 rounded-[2px]" />
              <span className="font-medium">{cc.name}</span>
              <span className="text-gray-500">+{cc.dialCode}</span>
            </div>
          </Select.Item>
        );
      }),
    []
  );

  // قيمة الـ Select لازم تكون iso2 string — واعمل fallback لو undefined
  const iso2 = country?.iso2 || defaultCountry;

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`flex h-11 items-center rounded-lg border border-gray-300 bg-white
                   hover:border-gray-400 focus-within:border-blue-500
                   focus-within:ring-2 focus-within:ring-blue-500/30 ${className}`}
      >
        <Select.Root value={iso2} onValueChange={setCountry}>
          <Select.Trigger
            className="flex h-full items-center gap-2 rounded-l-lg px-2 focus:outline-none"
            aria-label="Select country"
            disabled={disabled}
          >
            <FlagImage iso2={iso2} className="h-4 w-6 rounded-[2px]" />
            <span className="text-sm text-gray-900">
              +{country?.dialCode || ""}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </Select.Trigger>

          <Select.Portal>
            <Select.Content
              className="z-50 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
              position="popper"
              sideOffset={6}
            >
              <Select.Viewport className="max-h-[300px] w-[min(320px,90vw)] p-1">
                {countryItems}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        {/* فاصل رأسي واحد */}
        <div className="mx-2 h-6 w-px bg-gray-300" />

        <input
          id={id}
          name={name}
          ref={inputRef}
          type="tel"
          value={national}
          onChange={onNationalChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete="tel"
          inputMode="tel"
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          className={`flex-1 bg-transparent px-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none text-left ${inputClassName}`}
        />
      </div>
    </div>
  );
}

export default React.memo(CustomPhoneInput);
