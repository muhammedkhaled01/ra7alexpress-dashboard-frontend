import axiosMerchant from "@/axios";
import { default as Select } from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getEmployees, getUsers } from "@/stores/features/ajaxFeature";
import { handleError } from "@/utils/helpers";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

function Create({ onSubmitSuccess, feature }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    employee_id: '',
    period_start_date: '',
    period_end_date: '',
    regular_hours: '',
    overtime_hours: '',
    regular_pay: '',
    overtime_pay: '',
    tax_deduction: '',
    insurance_deduction: '',
    penalty_deductions: '',
    gross_pay: '',
    net_pay: '',
    payment_date: ''
  });
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [employee, _setEmployee] = useState([]);
  const [regularHours, _setRegularHours] = useState("");
  const [overtimeHours, _setOvertimeHours] = useState("");
  const [regularPay, setRegularPay] = useState("");
  const [overtimePay, setOvertimePay] = useState("");
  const [taxDeduction, setTaxDeduction] = useState("");
  const [insuranceDeduction, setInsuranceDeduction] = useState("");
  const [penaltyDeductions, setPenaltyDeductions] = useState("");
  const [grossPay, setGrossPay] = useState("");
  const [netPay, setNetPay] = useState("");
  const [periodStartDate, setPeriodStartDate] = useState("");
  const [periodEndDate, setPeriodEndDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  // Get data from Redux store
  const users = useSelector((store) => store.ajax.users);
  useEffect(() => {
    if (!users) dispatch(getUsers());
  }, []);

  const setEmployee = (employee) => {
    _setEmployee(employee);
  };
  const setRegularHours = (v) => {
    _setRegularHours(v);
  };
  const setOvertimeHours = (v) => {
    _setOvertimeHours(v);
  };

  const validateForm = (form) => {
    const newErrors = {
      employee_id: form.get('employee_id') ? '' : t('Employee is required'),
      period_start_date: form.get('period_start_date') ? '' : t('Period Start Date is required'),
      period_end_date: form.get('period_end_date') ? '' : t('Period End Date is required'),
      regular_hours: form.get('regular_hours') ? '' : t('Regular Hours is required'),
      overtime_hours: form.get('overtime_hours') ? '' : t('Overtime Hours is required'),
      regular_pay: form.get('regular_pay') ? '' : t('Regular Pay is required'),
      overtime_pay: form.get('overtime_pay') ? '' : t('Overtime Pay is required'),
      tax_deduction: form.get('tax_deduction') ? '' : t('Tax Deduction is required'),
      insurance_deduction: form.get('insurance_deduction') ? '' : t('Insurance Deduction is required'),
      penalty_deductions: form.get('penalty_deductions') ? '' : t('Penalty Deductions is required'),
      gross_pay: form.get('gross_pay') ? '' : t('Gross Pay is required'),
      net_pay: form.get('net_pay') ? '' : t('Net Pay is required'),
      payment_date: form.get('payment_date') ? '' : t('Payment Date is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.append("regular_hours", regularHours);
    form.append("overtime_hours", overtimeHours);
    form.append("regular_pay", regularPay);
    form.append("overtime_pay", overtimePay);
    form.append("tax_deduction", taxDeduction);
    form.append("insurance_deduction", insuranceDeduction);
    form.append("penalty_deductions", penaltyDeductions);
    form.append("gross_pay", grossPay);
    form.append("net_pay", netPay);
    form.append("payment_date", paymentDate);

    if (!validateForm(form)) return;
    setIsLoading(true);

    try {
      const response = await axiosMerchant.post(
        `${feature.baseEndpoint}/store`,
        form
      );
      toast.success(response.data.message);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      setShowDialog(false);
    } catch (error) {
      handleError(error);
      setShowDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{feature.createTitle}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{feature.createTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            {/* Employee */}
            <div className="input-container">
              <label htmlFor="employee_id">{t("Employee")} <RequiredField /></label>
              <Select
                name="employee_id"
                placeholder={t("Select an employee...")}
                options={users?.map((manager) => ({
                  value: manager?.id,
                  label: manager?.name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={employee}
                onChange={(value) => setEmployee(value)}
                error={errors.employee_id}
              />
              {errors.employee_id && (
                <p className="mt-1 text-sm text-red-500">{errors.employee_id}</p>
              )}
            </div>

            {/* Period Start Date */}
            <div className="input-container">
              <label htmlFor="period_start_date">{t("Period Start Date")} <RequiredField /></label>
              <Input
                id="period_start_date"
                placeholder={t("Select period start date...")}
                name="period_start_date"
                type="date"
                value={periodStartDate}
                onChange={(e) => setPeriodStartDate(e.target.value)}
                error={errors.period_start_date}
              />
              {errors.period_start_date && (
                <p className="mt-1 text-sm text-red-500">{errors.period_start_date}</p>
              )}
            </div>

            {/* Period End Date */}
            <div className="input-container">
              <label htmlFor="period_end_date">{t("Period End Date")} <RequiredField /></label>
              <Input
                id="period_end_date"
                placeholder={t("Select period end date...")}
                name="period_end_date"
                type="date"
                value={periodEndDate}
                onChange={(e) => setPeriodEndDate(e.target.value)}
                error={errors.period_end_date}
              />
              {errors.period_end_date && (
                <p className="mt-1 text-sm text-red-500">{errors.period_end_date}</p>
              )}
            </div>

            {/* Regular Hours */}
            <div className="input-container">
              <label htmlFor="regular_hours">{t("Regular Hours")} <RequiredField /></label>
              <Input
                id="regular_hours"
                placeholder={t("Enter regular hours")}
                name="regular_hours"
                type="number"
                value={regularHours}
                onChange={(e) => setRegularHours(e.target.value)}
                error={errors.regular_hours}
              />
              {errors.regular_hours && (
                <p className="mt-1 text-sm text-red-500">{errors.regular_hours}</p>
              )}
            </div>

            {/* Overtime Hours */}
            <div className="input-container">
              <label htmlFor="overtime_hours">{t("Overtime Hours")} <RequiredField /></label>
              <Input
                id="overtime_hours"
                placeholder={t("Enter overtime hours")}
                name="overtime_hours"
                type="number"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(e.target.value)}
                error={errors.overtime_hours}
              />
              {errors.overtime_hours && (
                <p className="mt-1 text-sm text-red-500">{errors.overtime_hours}</p>
              )}
            </div>

            {/* Regular Pay */}
            <div className="input-container">
              <label htmlFor="regular_pay">{t("Regular Pay")} <RequiredField /></label>
              <Input
                id="regular_pay"
                placeholder={t("Enter regular pay")}
                name="regular_pay"
                type="number"
                value={regularPay}
                onChange={(e) => setRegularPay(e.target.value)}
                error={errors.regular_pay}
              />
              {errors.regular_pay && (
                <p className="mt-1 text-sm text-red-500">{errors.regular_pay}</p>
              )}
            </div>

            {/* Overtime Pay */}
            <div className="input-container">
              <label htmlFor="overtime_pay">{t("Overtime Pay")} <RequiredField /></label>
              <Input
                id="overtime_pay"
                placeholder={t("Enter overtime pay")}
                name="overtime_pay"
                type="number"
                value={overtimePay}
                onChange={(e) => setOvertimePay(e.target.value)}
                error={errors.overtime_pay}
              />
              {errors.overtime_pay && (
                <p className="mt-1 text-sm text-red-500">{errors.overtime_pay}</p>
              )}
            </div>

            {/* Tax Deduction */}
            <div className="input-container">
              <label htmlFor="tax_deduction">{t("Tax Deduction")} <RequiredField /></label>
              <Input
                id="tax_deduction"
                placeholder={t("Enter tax deduction")}
                name="tax_deduction"
                type="number"
                value={taxDeduction}
                onChange={(e) => setTaxDeduction(e.target.value)}
                error={errors.tax_deduction}
              />
              {errors.tax_deduction && (
                <p className="mt-1 text-sm text-red-500">{errors.tax_deduction}</p>
              )}
            </div>

            {/* Insurance Deduction */}
            <div className="input-container">
              <label htmlFor="insurance_deduction">{t("Insurance Deduction")} <RequiredField /></label>
              <Input
                id="insurance_deduction"
                placeholder={t("Enter insurance deduction")}
                name="insurance_deduction"
                type="number"
                value={insuranceDeduction}
                onChange={(e) => setInsuranceDeduction(e.target.value)}
                error={errors.insurance_deduction}
              />
              {errors.insurance_deduction && (
                <p className="mt-1 text-sm text-red-500">{errors.insurance_deduction}</p>
              )}
            </div>

            {/* Penalty Deductions */}
            <div className="input-container">
              <label htmlFor="penalty_deductions">{t("Penalty Deductions")} <RequiredField /></label>
              <Input
                id="penalty_deductions"
                placeholder={t("Enter penalty deductions")}
                name="penalty_deductions"
                type="number"
                value={penaltyDeductions}
                onChange={(e) => setPenaltyDeductions(e.target.value)}
                error={errors.penalty_deductions}
              />
              {errors.penalty_deductions && (
                <p className="mt-1 text-sm text-red-500">{errors.penalty_deductions}</p>
              )}
            </div>

            {/* Gross Pay */}
            <div className="input-container">
              <label htmlFor="gross_pay">{t("Gross Pay")} <RequiredField /></label>
              <Input
                id="gross_pay"
                placeholder={t("Enter gross pay")}
                name="gross_pay"
                type="number"
                value={grossPay}
                onChange={(e) => setGrossPay(e.target.value)}
                error={errors.gross_pay}
              />
              {errors.gross_pay && (
                <p className="mt-1 text-sm text-red-500">{errors.gross_pay}</p>
              )}
            </div>

            {/* Net Pay */}
            <div className="input-container">
              <label htmlFor="net_pay">{t("Net Pay")} <RequiredField /></label>
              <Input
                id="net_pay"
                placeholder={t("Enter net pay")}
                name="net_pay"
                type="number"
                value={netPay}
                onChange={(e) => setNetPay(e.target.value)}
                error={errors.net_pay}
              />
              {errors.net_pay && (
                <p className="mt-1 text-sm text-red-500">{errors.net_pay}</p>
              )}
            </div>

            {/* Payment Date */}
            <div className="input-container">
              <label htmlFor="payment_date">{t("Payment Date")} <RequiredField /></label>
              <Input
                id="payment_date"
                placeholder={t("Select payment date")}
                name="payment_date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                error={errors.payment_date}
              />
              {errors.payment_date && (
                <p className="mt-1 text-sm text-red-500">{errors.payment_date}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-x-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {/* Close button translation already handled by t('Close') */}
                {t("Close")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {/* Save Changes translation already handled by t('Save Changes') */}
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("Save Changes")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Create;
