import { useTranslation } from "react-i18next";
import AppIndex from "../../Layouts/CURD/AppIndex";
import Create from "./Create";
import Edit from "./Edit";

export default function EmployeePositionsIndex() {
  const { t } = useTranslation();

  return (
    <AppIndex
      feature={{
        title: t("Employee Positions"),
        baseEndpoint: "employee_positions",
        permissionKey: "Employee Position",
        tableHeadsNames: [t("Title"),t("Department")],
        tableKeys: ["title","department.name"],
        createComponent: (props) => <Create {...props} />,
        editComponent: (props) => <Edit {...props} />,
      }}
    />
  );
}
