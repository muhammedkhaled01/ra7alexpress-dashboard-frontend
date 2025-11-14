import { useTranslation } from "react-i18next";
import AppIndex from "../../Layouts/CURD/AppIndex";

export default function WorkTimeIndex() {
  const { t } = useTranslation();

  return (
    <AppIndex
      feature={{
        title: t("Work Time"),
        editTitle: t("Update Work Time"),
        baseEndpoint: "work_times",
        permissionKey: "Work Time",
        isEdit: false,
        isCreate: false,
        tableHeadsNames: [
          t("Employee Name"),
          t("Check In"),
          t("Check Out"),
          t("Duration"),
        ],
        tableKeys: [
          "employee.name",
          "check_in",
          "check_out",
          "start_from??total_hours",
        ],
        // createComponent: (props) => <Create {...props} />,
        // editComponent: (props) => <Edit {...props} />,
      }}
    />
  );
}
