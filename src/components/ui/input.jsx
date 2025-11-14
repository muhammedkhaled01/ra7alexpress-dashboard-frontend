import * as React from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageProvider";

const InputIcon = React.memo(({ language, icon }) => {
  return (
    <span
      className={`absolute ${language !== "ar" ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 text-muted-foreground`}
    >
      {icon}
    </span>
  );
});

InputIcon.displayName = "InputIcon";

const InputComponent = React.forwardRef(
  ({ className, type, error = null, icon = null, ...props }, ref) => {
    const { language } = useLanguage();

    return (
      <div className="w-full relative">
        {icon && <InputIcon language={language} icon={icon} />}
        <input
          type={type}
          ref={ref}
          className={cn(
            "peer w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-400",
            error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600"
              : "border-zinc-300 dark:border-zinc-700",
            icon ? (language !== "ar" ? "pr-9" : "pl-9") : "",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

InputComponent.displayName = "Input";

// Memoize the main component to prevent unnecessary re-renders
const Input = React.memo(InputComponent);

export { Input };