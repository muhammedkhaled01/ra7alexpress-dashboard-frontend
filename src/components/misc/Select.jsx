import { useTheme } from "@/contexts/ThemeProvider";
import Select from "react-select";
import PropTypes from 'prop-types';
import { useTranslation } from "react-i18next";

const customStyles = (error) => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "hsl(var(--background))",
    borderColor: error
      ? "hsl(var(--destructive))"
      : state.isFocused
        ? "hsl(var(--ring))"
        : "hsl(var(--input))",
    borderRadius: "var(--radius)",
    boxShadow: state.isFocused
      ? error
        ? "0 0 0 2px hsl(var(--destructive))"
        : "0 0 0 2px hsl(var(--ring))"
      : "none",
    "&:hover": {
      borderColor: error ? "hsl(var(--destructive))" : "hsl(var(--input))",
    },
    transition: "all 0.2s ease-in-out",
    cursor: "pointer",
    minHeight: "40px",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "hsl(var(--accent))"
      : state.isFocused
        ? state.selectProps.className?.includes('dark')
          ? '#031d4e'
          : '#eee'
        : "transparent",
    color: state.isSelected
      ? "hsl(var(--accent-foreground))"
      : "hsl(var(--foreground))",
    "&:active": {
      backgroundColor: "hsl(var(--accent) / 0.1)",
    },
    "&:hover": {
      backgroundColor: "hsl(var(--accent))",
      cursor: "pointer",
    },
  }),
  input: (provided) => ({
    ...provided,
    height: "34px",
    color: "hsl(var(--foreground))",
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "hsl(var(--background))",
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow)",
    border: "1px solid hsl(var(--border))",
    zIndex: 9999,
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "hsl(var(--foreground))",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "hsl(var(--muted-foreground))",
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused
      ? "hsl(var(--foreground))"
      : "hsl(var(--muted-foreground))",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
    transition: "transform 0.2s ease-in-out",
    transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : "none",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: "hsl(var(--muted-foreground))",
    cursor: "pointer",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
  }),
  loadingIndicator: (provided) => ({
    ...provided,
    color: "hsl(var(--primary))",
  }),
  loadingMessage: (provided) => ({
    ...provided,
    color: "hsl(var(--muted-foreground))",
    fontSize: "0.875rem",
    padding: "8px 12px",
  }),
  noOptionsMessage: (provided) => ({
    ...provided,
    color: "hsl(var(--muted-foreground))",
    fontSize: "0.875rem",
    padding: "8px 12px",
  }),
});

const customTheme = (theme) => ({
  ...theme,
  borderRadius: "var(--radius)",
  colors: {
    ...theme.colors,
    primary: "hsl(var(--primary))",
    primary25: "hsl(var(--accent) / 0.1)",
    neutral0: "hsl(var(--background))",
    neutral5: "hsl(var(--accent) / 0.05)",
    neutral10: "hsl(var(--accent) / 0.1)",
    neutral20: "hsl(var(--input))",
    neutral30: "hsl(var(--input))",
    neutral40: "hsl(var(--muted-foreground))",
    neutral50: "hsl(var(--muted-foreground))",
    neutral60: "hsl(var(--muted-foreground))",
    neutral70: "hsl(var(--foreground))",
    neutral80: "hsl(var(--foreground))",
    neutral90: "hsl(var(--foreground))",
  },
});

const ShadcnSelect = ({ error, required, isLoading, ...props }) => {
  const { theme, systemTheme } = useTheme();
  const { t } = useTranslation()
  const isDarkMode =
    theme === "system" ? systemTheme === "dark" : theme === "dark";

  return (
    <div className="select-container relative">
      <Select
        {...props}
        styles={customStyles(error || required)}
        theme={(baseTheme) => customTheme(baseTheme)}
        className={`${isDarkMode ? "dark" : ""} react-select-container`}
        classNamePrefix="react-select"
        isLoading={isLoading}
        loadingMessage={() => (
          <div className="flex items-center justify-center gap-2">
            <span className="loading loading-spinner loading-xs text-primary"></span>
            <span>
              {t("Loading")}...</span>
          </div>
        )}
      />
    </div>
  );
};

ShadcnSelect.propTypes = {
  error: PropTypes.bool,
  required: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default ShadcnSelect;