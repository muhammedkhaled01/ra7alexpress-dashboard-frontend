import * as React from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageProvider";

const Table = React.forwardRef(({ className, ...props }, ref) => {
  const { language } = useLanguage();

  return (
    <div className="relative w-full overflow-auto rounded-md border mb-2">
      <table
        ref={ref}
        dir={language === "ar" ? "rtl" : "ltr"}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
});
Table.displayName = "Table";

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

const TableHeader = createTableComponent("thead", "bg-muted/50", "TableHeader");
const TableBody = createTableComponent(
  "tbody",
  "[&_tr:last-child]:border-0",
  "TableBody"
);
const TableFooter = createTableComponent(
  "tfoot",
  "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
  "TableFooter"
);
const TableRow = createTableComponent(
  "tr",
  "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted dark:text-zinc-400 dark:hover:text-white",
  "TableRow"
);
const TableHead = React.forwardRef(
  ({ className, isFixed = false, ...props }, ref) => {
    const { language } = useLanguage();

    return (
      <th
        ref={ref}
        className={cn(
          "h-10 px-4 align-middle bg-background font-bold text-center [&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:px-4",
          isFixed
            ? language === "ar"
              ? "sticky right-0 min-w-[150px]  z-10 !shadow-xl"
              : "sticky left-0 min-w-[150px]  z-10 !shadow-xl"
            : "",
          className
        )}
        {...props}
      />
    );
  }
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef(
  ({ className = "", isFixed = false, hasCheckbox = false, ...props }, ref) => {
    const { language } = useLanguage();

    // Remove any existing padding classes from className
    const cleanedClassName = className
      .split(" ")
      .filter(
        (cls) =>
          !cls.startsWith("p-") &&
          !cls.startsWith("px-") &&
          !cls.startsWith("py-") &&
          !cls.startsWith("!p-") &&
          !cls.startsWith("!px-") &&
          !cls.startsWith("!py-")
      )
      .join(" ");

    return (
      <td
        ref={ref}
        className={cn(
          "py-2 align-middle text-center",
          hasCheckbox ? "px-4" : "px-2",
          isFixed
            ? language === "ar"
              ? "sticky right-0 bg-background min-w-[150px]  z-10 shadow-r-xl filter drop-shadow-r-lg"
              : "sticky left-0 bg-background min-w-[150px]  z-10 shadow-l-xl filter drop-shadow-l-lg"
            : "",
          cleanedClassName
        )}
        {...props}
      />
    );
  }
);
TableCell.displayName = "TableCell";

TableCell.propTypes = {
  className: PropTypes.string,
  isFixed: PropTypes.bool,
  hasCheckbox: PropTypes.bool,
};
const TableCaption = createTableComponent(
  "caption",
  "mt-4 text-sm text-muted-foreground",
  "TableCaption"
);

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
