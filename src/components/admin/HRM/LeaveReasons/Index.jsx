import { useTranslation } from "react-i18next";
import AppIndex from "../../Layouts/CURD/AppIndex";
import Create from "./Create";
import Edit from "./Edit";

export default function LeaveReasonsIndex() {
  const { t } = useTranslation();

  return (
    <AppIndex
      feature={{
        title: t("Leave Reason"),
        baseEndpoint: "leave_reasons",
        permissionKey: "Leave Reason",
        tableHeadsNames: [
          t("Reason Name(EN)"),
          t("Reason Name(AR)"),
          t("Description"),
          t("Is Active"),
        ],
        tableKeys: ["name_en", "name_ar", "description", "is_active"],
        createComponent: (props) => <Create {...props} />,
        editComponent: (props) => <Edit {...props} />,
      }}
    />
  );
}
