import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "text-white font-semibold bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-blue-800 dark:hover:bg-blue-700 dark:focus:ring-blue-500 shadow-lg transition-all duration-300 ease-in-out",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "text-white font-semibold bg-[#031d4e] hover:bg-[#031d4e] focus:outline-none focus:ring-2 focus:ring-[#031d4e] dark:bg-[#031d4e] dark:hover:bg-[#031d4e] dark:focus:ring-[#031d4e] shadow-lg transition-all duration-300 ease-in-out",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // password: "ml-1 text-gray-600 dark:text-gray-300 bg-transparent dark:bg-gray-700 hover:text-white hover:bg-gray-600 border border-gray-600 dark:hover:bg-gray-500 group",
        // show: "ml-1 text-gray-600 dark:text-gray-300 bg-transparent dark:bg-gray-700 hover:text-white hover:bg-gray-600 border border-gray-600 dark:hover:bg-gray-500 group",
        show: "ml-1 text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-transparent dark:bg-gray-700 hover:text-white hover:bg-gray-600 border border-gray-300 dark:hover:bg-gray-500 group",
        print:
          "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-transparent dark:bg-amber-700 hover:text-white hover:bg-amber-600 border border-amber-300 dark:hover:bg-amber-500 group",
        filter:
          "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-transparent dark:bg-blue-700 hover:text-white hover:bg-blue-600 border border-blue-300 dark:hover:bg-blue-500 group",
        upload:
          "text-green-700 bg-green-100 dark:text-green-400 dark:bg-transparent dark:bg-green-700 hover:text-white hover:bg-green-600 border border-green-300 dark:hover:bg-green-500 group",
        confirm:
          "text-green-700 bg-green-100 dark:text-green-400 dark:bg-transparent dark:bg-green-700 hover:text-white hover:bg-green-600 border border-green-300 dark:hover:bg-green-500 group",
        hold:
          "text-red-700 bg-red-100 dark:text-red-400 dark:bg-transparent dark:bg-red-700 hover:text-white hover:bg-red-600 border border-red-300 dark:hover:bg-red-500 group",
        download: "text-sky-700 bg-sky-100 dark:text-sky-400 dark:bg-transparent dark:bg-sky-800 hover:text-white hover:bg-sky-600 border border-sky-300 dark:hover:bg-sky-500 group",
        refresh:
          "text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-transparent dark:bg-orange-800 hover:text-white hover:bg-orange-600 border border-orange-300 dark:hover:bg-orange-400 group",
        save:
          "text-green-700 bg-green-100 dark:text-green-400 dark:bg-transparent dark:bg-green-700 hover:text-white hover:bg-green-600 border border-green-300 dark:hover:bg-green-500 shadow-sm group",
        undo:
          "text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-transparent dark:bg-yellow-700 hover:text-white hover:bg-yellow-600 border border-yellow-300 dark:hover:bg-yellow-500 shadow-sm group",
        delete:
          "text-red-700 bg-red-100 dark:text-red-400 dark:bg-transparent dark:bg-red-700 hover:text-white hover:bg-red-600 border border-red-300 dark:hover:bg-red-500 group",
        edit: "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-transparent dark:bg-emerald-800 hover:text-white hover:bg-emerald-600 border border-emerald-300 dark:hover:bg-emerald-500 group",
        add: "text-purple-600 dark:text-purple-400 bg-transparent dark:bg-purple-700 hover:text-white hover:bg-purple-600 border group border-purple-600 dark:hover:bg-purple-500",
        settings: "text-indigo-700 bg-indigo-100 dark:text-white dark:bg-indigo-800 dark:border-indigo-700 hover:text-white hover:bg-indigo-600 dark:hover:bg-indigo-700 border border-indigo-300 dark:hover:bg-indigo-500 group transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm dark:shadow-indigo-900/20",
        sidebarAdd:
          "text-purple-700 dark:text-purple-300 bg-white dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-800 hover:text-purple-900 dark:hover:text-white border border-purple-500  transition-colors duration-200 rounded-md !px-1 py-2 font-semibold group",
        close:
          "text-red-600 dark:text-red-400 bg-transparent dark:bg-red-700 hover:text-white hover:bg-red-600 border group border-red-600 dark:hover:bg-red-500 shadow-sm",
        password:
          "text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-transparent dark:bg-blue-700 hover:text-white hover:bg-blue-600 border border-blue-300 dark:hover:bg-blue-500 group",
        export:
          "text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-transparent dark:bg-purple-800 hover:text-white hover:bg-purple-600 border border-purple-300 dark:hover:bg-purple-500 group",
      },
      size: {
        default: "h-10 px-3 md:px-4 py-2",
        xs: "h-5 rounded-md px-1",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const getChildEnhancementClass = (variant) => {
  switch (variant) {
    case "filter":
    case "confirm":
    case "upload":
      return "w-4 h-4 dark:text-gray-100 dark:group-hover:text-white";
    case "refresh":
    case "edit":
    case "password":
    case "print":
    case "add":
    case "sidebar":
    case "delete":
    case "hold":
      return "h-6 w-6 dark:text-gray-300 dark:group-hover:text-white";
    default:
      return "";
  }
};

const variantsWithTooltip = [
  "refresh",
  "filter",
  "upload",
  "download",
  "password",
  "print",
  "delete",
  "edit",
  "hold",
  "confirm",
  "add",
  "save",
  "settings",
  "close",
  "password",
  "export",
  "undo",
];

import { useTranslation } from "react-i18next";

const Button = React.forwardRef(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      children,
      tooltipLabel,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();
    const Comp = asChild ? Slot : "button";
    const enhancementClass = getChildEnhancementClass(variant);

    const enhancedChildren = React.Children.map(children, (child) =>
      React.isValidElement(child)
        ? React.cloneElement(child, {
          className: cn(child.props.className, enhancementClass),
        })
        : child
    );

    const buttonElement = (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {enhancedChildren}
      </Comp>
    );

    if (variantsWithTooltip.includes(variant)) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
          <TooltipContent side="top" align="center">
            {t(tooltipLabel ? tooltipLabel : variant)}
          </TooltipContent>
        </Tooltip>
      );
    }

    return buttonElement;
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
