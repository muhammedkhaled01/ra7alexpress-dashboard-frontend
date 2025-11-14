import * as React from "react"
import { cn } from "@/lib/utils"
import PropTypes from 'prop-types';

const Textarea = React.forwardRef(({ className, error = null, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "peer w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-400",
        error
          ? "border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600"
          : "border-zinc-300 dark:border-zinc-700",
        className
      )}
      {...props} />
  );
})
Textarea.displayName = "Textarea"

Textarea.propTypes = {
  className: PropTypes.string,
  error: PropTypes.bool,
};

export { Textarea }
