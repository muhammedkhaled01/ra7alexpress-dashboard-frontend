import * as React from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageProvider";

const Modal = React.forwardRef(
  ({ className, isOpen, onClose, children, size = "md", ...props }, ref) => {
    const modalContentRef = React.useRef(null);
    const {language} = useLanguage()
    React.useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener("keydown", handleKeyDown);
      }
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [isOpen, onClose]);
    if (!isOpen) return null;
    const sizeClasses = {
      sm: "max-w-[400px]",
      md: "max-w-[600px]",
      lg: "max-w-[1000px]",
      xl: "max-w-[1200px]",
    };
    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div
          ref={ref || modalContentRef}
          className={cn(
            "relative mx-auto w-full max-h-[90vh] overflow-auto rounded-lg bg-background p-6 shadow-lg",
            sizeClasses[size],
            className
          )}
          dir={language === "ar" ? "rtl" : "ltr"}
          {...props}
        >
          {children}
          <button
            onClick={onClose}
            className={cn(
              "absolute top-4 text-gray-500 hover:text-gray-900 dark:hover:text-white",
              language === "ar" ? "left-4" : "right-4"
            )}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }
);
Modal.displayName = "Modal";
const ModalHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 border-b pb-4", className)}
    {...props}
  />
));
ModalHeader.displayName = "ModalHeader";
const ModalTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-xl font-semibold tracking-tight", className)}
    {...props}
  />
));
ModalTitle.displayName = "ModalTitle";

const ModalContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("py-4", className)} {...props} />
));
ModalContent.displayName = "ModalContent";
const ModalFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex justify-end gap-x-2 pt-4", className)}
    {...props}
  />
));
ModalFooter.displayName = "ModalFooter";
export { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter };
