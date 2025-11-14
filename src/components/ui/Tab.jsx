import PropTypes from 'prop-types';
import { TabsTrigger } from "@radix-ui/react-tabs";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";

export default function Tab({ tab, setActiveTab, handleCloseTab, language }) {
  Tab.propTypes = {
    tab: PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired
    }).isRequired,
    setActiveTab: PropTypes.func.isRequired,
    handleCloseTab: PropTypes.func.isRequired,
    language: PropTypes.string.isRequired
  };

  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === tab.path;

  return (
    <div
      className={`relative flex items-center cursor-auto bg-white dark:bg-gray-900 rounded group px-2 py-1
        ${language === "ar" ? "flex-row-reverse" : "flex-row"} 
        whitespace-nowrap`}
    >
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-t transition-all duration-300" />
      )}
      <TabsTrigger
        value={tab.id}
        className={`flex items-center justify-center px-3 py-1 text-sm font-medium cursor-pointer whitespace-nowrap transition-all duration-200 dark:group-hover:text-white
        ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
        onClick={() => {
          setActiveTab(tab.id);
          navigate(tab.path);
        }}
        onMouseDown={(e) => e.button === 1 ? handleCloseTab(e, tab.id) : null}
      >
        {(() => {
          const label = tab.label.replace(/-/g, ' ');
          const match = label.match(/(.*?)(\d+)?$/);
          const baseText = match[1].trim();
          const number = match[2] ? ` ${match[2]}` : '';

          return t(baseText.replace(/\b\w/g, l => l.toUpperCase())) + number;
        })()}
      </TabsTrigger>

      <X
        onClick={(e) => handleCloseTab(e, tab.id)}
        className={`ml-1 h-4 w-4 rounded-full transition-all duration-200 cursor-pointer
          ${isActive ? 'bg-red-500 text-white hover:bg-red-600' : 'text-gray-600 hover:text-white hover:bg-red-500 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-red-500'}`}
      />
    </div>
  );
}
