import { useTranslation } from "react-i18next";
import AppIndex from "../../Layouts/CURD/AppIndex";
import Create from "./Create";
import Edit from "./Edit";

export default function EmployeeHierarchyIndex() {
  const { t } = useTranslation();

  return (
    <AppIndex
      feature={{
        title: t("Employee Hierarchy"),
        baseEndpoint: "employee_hierarchies",
        permissionKey: "Employee Hierarchy",
        tableHeadsNames: [
          t("Employee Name"),
          t("Approval Name"),
          t("Hierarchy Role"),
          t("Hierarchy Level"),
        ],
        tableKeys: [
          "employee.name",
          "approver.name",
          "hierarchy_level.role_name",
          "hierarchy_level.level",
        ],
        createComponent: (props) => <Create {...props} />,
        editComponent: (props) => <Edit {...props} />,
      }}
    />
  );
}
