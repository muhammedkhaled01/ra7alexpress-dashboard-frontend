import { useTranslation } from "react-i18next";
import AppIndex from "../../Layouts/CURD/AppIndex";
import Create from "./Create";
import Edit from "./Edit";

export default function EmployeeBranchsIndex() {
  const { t } = useTranslation();

  return (
    <AppIndex
      feature={{
        title: t("Employee Branch"),
        baseEndpoint: "employee_branches",
        permissionKey: "Employee Branch",
        tableHeadsNames: [t("Employee"), t("Morphable Type"), t("Type Name")],
        tableKeys: ["employee.name", "morphable_type", "name"],
        createComponent: (props) => <Create {...props} />,
        editComponent: (props) => <Edit {...props} />,
      }}
    />
  );
}
