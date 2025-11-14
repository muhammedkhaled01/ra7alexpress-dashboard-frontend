import { useTranslation } from "react-i18next";
import AppIndex from "../../Layouts/CURD/AppIndex";
import Create from "./Create";
import Edit from "./Edit";

export default function EmployeeDepartmentsIndex() {
  const { t } = useTranslation();

  return (
    <AppIndex
      feature={{
        title: t("Employee Department"),
        baseEndpoint: "employee_departments",
        permissionKey: "Employee Department",
        tableHeadsNames: [t("Name")],
        isFixedColumn: t("Name"),
        tableKeys: ["name"],
        createComponent: (props) => <Create {...props} />,
        editComponent: (props) => <Edit {...props} />,
      }}
    />
  );
}
