import { useTranslation } from "react-i18next";
import AppIndex from "../../Layouts/CURD/AppIndex";
import Create from "./Create";
import Edit from "./Edit";

export default function EmployeePayrollIndex() {
  const { t } = useTranslation();

  return (
    <AppIndex
      feature={{
        title: t("Employee Payroll"),
        baseEndpoint: "employee_payrolls",
        permissionKey: "Employee Payroll",
        tableHeadsNames: [
          t("Employee Name"),
          t("Period Start Date"),
          t("Period End Date"),
          t("Regular Hours"),
          t("Overtime Hours"),
          t("Regular Pay"),
          t("Overtime Pay"),
          t("Tax Deduction"),
          t("Insurance Deduction"),
          t("Penalty Deductions"),
          t("Gross Pay"),
          t("Net Pay"),
          t("Payment Date"),
          t("Created At"),
        ],
        tableKeys: [
          "employee.name",
          "period_start_date",
          "period_end_date",
          "regular_hours",
          "overtime_hours",
          "regular_pay",
          "overtime_pay",
          "tax_deduction",
          "insurance_deduction",
          "penalty_deductions",
          "gross_pay",
          "net_pay",
          "payment_date",
          "created_at",
        ],
        createComponent: (props) => <Create {...props} />,
        editComponent: (props) => <Edit {...props} />,
      }}
    />
  );
}
