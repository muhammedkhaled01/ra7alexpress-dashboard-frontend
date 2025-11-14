"use merchant"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageProvider"
import PropTypes from 'prop-types';

const Tabs = React.forwardRef(({ className, ...props }, ref) => {
  const { language } = useLanguage();
  return (
    <TabsPrimitive.Root
      ref={ref}
      dir={language === "ar" ? "rtl" : "ltr"}
      className={cn(
        className
      )}
      {...props} />
  );
});
Tabs.displayName = TabsPrimitive.Root.displayName;

Tabs.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  defaultValue: PropTypes.string,
  value: PropTypes.string,
  onValueChange: PropTypes.func,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  loop: PropTypes.bool,
  manual: PropTypes.bool,
  ...TabsPrimitive.Root.propTypes
};

const TabsList = React.forwardRef(({ className, ...props }, ref) => {
  const { language } = useLanguage();
  return (
    <TabsPrimitive.List
      ref={ref}
      dir={language === "ar" ? "rtl" : "ltr"}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md gap-1 bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props} />
  );
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => {
  const { language } = useLanguage();
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      dir={language === "ar" ? "rtl" : "ltr"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      {...props} />
  );
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => {
  const { language } = useLanguage();
  return (
    <TabsPrimitive.Content
      ref={ref}
      dir={language === "ar" ? "rtl" : "ltr"}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props} />
  );
})
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
