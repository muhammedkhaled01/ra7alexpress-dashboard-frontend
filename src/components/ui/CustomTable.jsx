import * as React from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageProvider";

const CustomTable = React.forwardRef(({ className, ...props }, ref) => {
  const { language } = useLanguage();

  return (
    <div className="relative w-full overflow-x-auto rounded-lg mb-4">
      <table
        ref={ref}
        dir={language === "ar" ? "rtl" : "ltr"}
        className={cn(
          "min-w-full divide-y divide-gray-200 dark:divide-gray-700",
          className
        )}
        {...props}
      />
    </div>
  );
});
CustomTable.displayName = "CustomTable";

const createTableComponent = (Tag, baseClasses, displayName) =>
  React.forwardRef(({ className, ...props }, ref) => {
    const { language } = useLanguage();

    return (
      <Tag
        ref={ref}
        className={cn(
          baseClasses,
          language === "ar" ? "text-right" : "text-left",
          className
        )}
        {...props}
      />
    );
  });

const CustomTableHeader = createTableComponent(
  "thead",
  "bg-gray-50 dark:bg-gray-800",
  "CustomTableHeader"
);

const CustomTableBody = createTableComponent(
  "tbody",
  "divide-y divide-gray-200 dark:divide-gray-700",
  "CustomTableBody"
);

const CustomTableRow = createTableComponent(
  "tr",
  "transition-colors hover:bg-gray-50 dark:hover:bg-gray-700",
  "CustomTableRow"
);

const CustomTableHead = React.forwardRef(
  ({ className, isFixed = false, ...props }, ref) => {
    CustomTableHead.propTypes = {
      className: PropTypes.string,
      isFixed: PropTypes.bool,
    };
    const { language } = useLanguage();

    return (
      <th
        ref={ref}
        className={cn(
          "px-3 py-2 whitespace-nowrap font-medium text-gray-900 bg-gray-100 dark:text-gray-100 dark:bg-gray-900",
          isFixed
            ? language === "ar"
              ? "sticky right-0 z-20 min-w-[150px]"
              : "sticky left-0 z-20 min-w-[150px]"
            : "",
          className
        )}
        {...props}
      />
    );
  }
);
CustomTableHead.displayName = "CustomTableHead";

const CustomTableCell = React.forwardRef(
  ({ className, isFixed, ...props }, ref) => {
    CustomTableCell.propTypes = {
      className: PropTypes.string,
      isFixed: PropTypes.bool,
    };
    const { language } = useLanguage();

    return (
      <td
        ref={ref}
        className={cn(
          "px-3 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100",
          isFixed
            ? language === "ar"
              ? "sticky right-0 z-10 bg-background min-w-[150px] "
              : "sticky left-0 z-10 bg-background min-w-[150px] "
            : "",
          className
        )}
        {...props}
      />
    );
  }
);
CustomTableCell.displayName = "CustomTableCell";

export {
  CustomTable,
  CustomTableHeader,
  CustomTableBody,
  CustomTableRow,
  CustomTableHead,
  CustomTableCell,
};
