import { useTranslation } from "react-i18next"

const RequiredField = () => {
    const { t } = useTranslation()
    return <>
        <span style={{ color: "red" }} aria-hidden="true">*</span>
        <span className="sr-only">({t("required")})</span>
    </>
}

export default RequiredField