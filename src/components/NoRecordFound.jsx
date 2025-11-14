import React from "react";
import { useTranslation } from "react-i18next";
function NoRecordFound() {
  const { t } = useTranslation();
  return (
    <div className="w-full flex justify-center items-center py-6 mt-8">
      <div className="w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-6">
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">
            {t("noRecordFound.title")}
          </h3>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            {t("noRecordFound.description")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default NoRecordFound;
