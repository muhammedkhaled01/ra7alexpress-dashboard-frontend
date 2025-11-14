"use merchant"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import PropTypes from 'prop-types'
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, error, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Base styles - مربع تماماً
      "peer h-6 w-6 shrink-0 border-2 transition-all duration-200 ease-in-out",
      "flex items-center justify-center",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      
      // إزالة أي زوايا مدورة لجعله مربعاً تماماً
      "rounded-none",
      
      // Normal state
      !error
        ? [
            "border-gray-300 bg-white",
            "hover:border-blue-500",
            "focus-visible:ring-blue-400",
            "data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500",
            "data-[state=checked]:hover:bg-blue-600 data-[state=checked]:hover:border-blue-600",
            "dark:border-gray-600 dark:bg-gray-800",
            "dark:hover:border-blue-400",
            "dark:data-[state=checked]:bg-blue-400 dark:data-[state=checked]:border-blue-400"
          ]
        : [
            "border-red-400 bg-white",
            "hover:border-red-500",
            "focus-visible:ring-red-400",
            "data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500",
            "data-[state=checked]:hover:bg-red-600 data-[state=checked]:hover:border-red-600",
            "dark:border-red-500 dark:bg-gray-800",
            "dark:hover:border-red-400",
            "dark:data-[state=checked]:bg-red-400 dark:data-[state=checked]:border-red-400"
          ],
      
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        "flex items-center justify-center transition-all duration-200 ease-in-out",
        "scale-0 data-[state=checked]:scale-100"
      )}
    >
      <Check className="h-4 w-4 text-white stroke-[3]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))

Checkbox.displayName = CheckboxPrimitive.Root.displayName

Checkbox.propTypes = {
  className: PropTypes.string,
  error: PropTypes.bool,
  checked: PropTypes.bool,
  onCheckedChange: PropTypes.func,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  id: PropTypes.string,
  name: PropTypes.string,
}

export { Checkbox }