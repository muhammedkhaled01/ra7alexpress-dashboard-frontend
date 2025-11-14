import { useTranslation } from "react-i18next";
import AppIndex from "../../Layouts/CURD/AppIndex";
import Create from "./Create";
import Edit from "./Edit";

export default function LeaveRequestApprovalIndex() {
  const { t } = useTranslation();

  return (
    <AppIndex
      feature={{
        title: t("Leave Request Approval"),
        baseEndpoint: "leave_request_approvals",
        permissionKey: "Leave Request Approval",
        tableHeadsNames: [
          t("Leave Request ID"),
          t("Approver Name"),
          t("Status"),
          t("Comment"),
          t("Approved At"),
          t("Created At"),
          t("Updated At"),
        ],
        tableKeys: [
          "leave_request.id",
          "approver.name",
          "status",
          "comment",
          "approved_at",
          "created_at",
          "updated_at",
        ],
        createComponent: (props) => <Create {...props} />,
        editComponent: (props) => <Edit {...props} />,
      }}
    />
  );
}
