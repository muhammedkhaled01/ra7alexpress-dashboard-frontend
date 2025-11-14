import { useTranslation } from "react-i18next";
import AppIndex from "../../Layouts/CURD/AppIndex";
import Create from "./Create";
import Edit from "./Edit";

export default function HierarchyLevelsIndex() {
  const { t } = useTranslation();

  return (
    <AppIndex
      feature={{
        title: t("Hierarchy Level"),
        baseEndpoint: "hierarchy_levels",
        permissionKey: "Hierarchy Level",
        tableHeadsNames: [t("Role"), t("Level"), t("Description")],
        tableKeys: ["role_name", "level", "description"],
        createComponent: (props) => <Create {...props} />,
        editComponent: (props) => <Edit {...props} />,
      }}
    />
  );
}
