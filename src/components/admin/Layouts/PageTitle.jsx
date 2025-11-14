import React from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next';

function PageTitle({ title }) {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = t(title) + ' | ' + `${t("title.Ra7al")} ${t("title.Express")}`;
  }, [title]);
  return (
    <div>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl border-b-2 border-b-gray-100 dark:border-b-gray-500  dark:text-gray-400">{t(title)}</h1>
      </div>
    </div>
  )
}

export default PageTitle