import { useTranslation } from "react-i18next";
import IndexPage from "./IndexPage";

export default function AppIndex({ feature }) {
  const { t } = useTranslation();

  const defaultFeature = {
    title: t("Title"),
    createTitle: t("Create Item"),
    editTitle: t("Update Item"),
    baseEndpoint: "items",
    permissionKey: "ItemPermission",
    isIndexActive: true,
    isCreate: true,
    isEdit: true,
    isDelete: true,
    tableHeadsNames: ["ID"],
    tableKeys: ["id"],
  };

  const applyDefaults = (featureConfig) => {
    return {
      title: featureConfig.title || defaultFeature.title,
      createTitle:
        featureConfig.createTitle ||
        (featureConfig.title !== undefined
          ? `${t("Create")} ${featureConfig.title}`
          : defaultFeature.createTitle),
      editTitle:
        featureConfig.editTitle ||
        (featureConfig.title !== undefined
          ? `${t("Update")} ${featureConfig.title}`
          : defaultFeature.editTitle),
      baseEndpoint: featureConfig.baseEndpoint || defaultFeature.baseEndpoint,
      permissionKey:
        featureConfig.permissionKey || defaultFeature.permissionKey,
      isIndexActive:
        featureConfig.isIndexActive || defaultFeature.isIndexActive,
      isCreate:
        featureConfig.isCreate !== undefined
          ? featureConfig.isCreate
          : defaultFeature.isCreate,
      isEdit:
        featureConfig.isEdit !== undefined
          ? featureConfig.isEdit
          : defaultFeature.isEdit,
      isDelete:
        featureConfig.isDelete !== undefined
          ? featureConfig.isDelete
          : defaultFeature.isDelete,
      tableHeadsNames:
        featureConfig.tableHeadsNames || defaultFeature.tableHeadsNames,
      tableKeys: featureConfig.tableKeys || defaultFeature.tableKeys,
      createComponent: featureConfig.createComponent,
      editComponent: featureConfig.editComponent,
    };
  };

  return <IndexPage key={feature?.title} feature={applyDefaults(feature)} />;
}

// const features = {
//   "Employee Department": {
//     title: t("Employee Department"),
//     baseEndpoint: "employee_departments",
//     permissionKey: "EmployeeDepartment",
//     tableHeadsNames: [t("Name")],
//     tableKeys: ["name"],
//   },
//   "Employee Position": {
//     title: t("Employee Position"),
//     baseEndpoint: "employee_positions",
//     permissionKey: "EmployeePosition",
//     tableHeadsNames: [t("Title")],
//     tableKeys: ["title"],
//   },
//   Employee: {
//     title: t("Employee"),
//     baseEndpoint: "employees",
//     permissionKey: "Employee",
//     tableHeadsNames: [t("Employee Name"), t("Department"), t("Position")],
//     tableKeys: ["name", "department_name", "position_title"],
//   },
//   "Employee Branch": {
//     title: t("Employee Branch"),
//     baseEndpoint: "employee_branches",
//     permissionKey: "EmployeeBranch",
//     tableHeadsNames: [t("Branch Name"), t("Employee")],
//     tableKeys: ["branch.name", "employee.name"],
//   },
//   "Work Time": {
//     title: t("Work Time"),
//     editTitle: t("Update Work Time"),
//     baseEndpoint: "work_times",
//     permissionKey: "WorkTime",
//     tableHeadsNames: [
//       t("Employee Name"),
//       t("Check In"),
//       t("Check Out"),
//       t("Duration"),
//     ],
//     tableKeys: [
//       "employee.name",
//       "check_in",
//       "check_out",
//       "start_from??total_hours",
//     ],
//   },
//   "Employee Payroll": {
    // title: t("Employee Payroll"),
    // baseEndpoint: "employee_payrolls",
    // permissionKey: "EmployeePayroll",
    // tableHeadsNames: [t("Employee Name"), t("Salary")],
    // tableKeys: ["employee_name", "salary"],
//   },
//   "Hierarchy Level": {
//     title: t("Hierarchy Level"),
//     baseEndpoint: "hierarchy_levels",
//     permissionKey: "HierarchyLevel",
//     tableHeadsNames: [t("Level Name")],
//     tableKeys: ["level_name"],
//   },
//   "Employee Hierarchy": {
    // title: t("Employee Hierarchy"),
    // baseEndpoint: "employee_hierarchies",
    // permissionKey: "EmployeeHierarchy",
    // tableHeadsNames: [t("Employee Name"), t("Hierarchy Level")],
    // tableKeys: ["employee_name", "hierarchy_level"],
//   },
//   "Leave Reason": {
//     title: t("Leave Reason"),
//     baseEndpoint: "leave_reasons",
//     permissionKey: "LeaveReason",
//     tableHeadsNames: [t("Reason Name")],
//     tableKeys: ["reason_name"],
//   },
//   "Leave Request": {
//     title: t("Leave Request"),
//     baseEndpoint: "leave_requests",
//     permissionKey: "LeaveRequest",
//     tableHeadsNames: [t("Employee Name"), t("Leave Type"), t("Status")],
//     tableKeys: ["employee_name", "leave_type", "status"],
//   },
//   "Leave Request Approval": {
    // title: t("Leave Request Approval"),
    // baseEndpoint: "leave_request_approvals",
    // permissionKey: "LeaveRequestApproval",
    // tableHeadsNames: [t("Leave Request ID"), t("Approver Name"), t("Status")],
    // tableKeys: ["leave_request_id", "approver_name", "status"],
//   },
// };
