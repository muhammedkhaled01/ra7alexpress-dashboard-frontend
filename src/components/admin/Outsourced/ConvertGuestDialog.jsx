import React, { useEffect, useMemo, useState, useRef } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImagePreview from "@/components/misc/ImagePreview";
import axiosMerchant from "@/axios";
import { handleError, hasRole } from "@/utils/helpers";
import { Loader2, Plus, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import Select from "@/components/misc/Select";
import { useDispatch, useSelector } from "react-redux";
import { getCompanies, getRoles } from "@/stores/features/ajaxFeature";
import RequiredField from "@/components/misc/RequiredField";

const baseDocs = [
  { key: "license", label: "License" },
  { key: "id_card", label: "ID Card" },
  { key: "car_ownership_id", label: "Car Ownership ID" },
];

export default function ConvertGuestDialog({
  open,
  onClose,
  record,
  onSuccess,
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // --- auth store for user/workspaces (from UserCreate)
  const user = useSelector((store) => store.auth.user);
  const isSuperAdmin = hasRole("Super Admin");

  // --- ajax store
  const { companies, companiesLoading, roles } = useSelector((s) => ({
    companies: s.ajax?.companies,
    companiesLoading: s.ajax?.companiesLoading,
    roles: s.ajax?.roles,
  }));
  const rolesLoading = useSelector((store) => store.ajax?.rolesLoading);
  const fetchedRolesOnce = useRef(false);

  useEffect(() => {
    if (!companies && !companiesLoading) dispatch(getCompanies());

    // Role fetching logic from UserCreate
    if (
      !fetchedRolesOnce.current &&
      (!roles || roles.length === 0) &&
      !rolesLoading
    ) {
      fetchedRolesOnce.current = true;
      dispatch(getRoles());
    }
  }, [companies, companiesLoading, dispatch, roles, rolesLoading]);

  // ========== State ==========
  const [isLoading, setIsLoading] = useState(false);
  const [fileRows, setFileRows] = useState([{ id: Date.now(), value: "" }]);
  // company
  const [companyOpt, setCompanyOpt] = useState(null); // {value,label}
  const [companyText, setCompanyText] = useState(""); // fallback text

  // relatives
  const [relatives, setRelatives] = useState([
    // { name: "", relation: "", phone: "" }
  ]);

  // base doc previews/files
  const [previews, setPreviews] = useState({
    license: null,
    id_card: null,
    car_ownership_id: null,
  });
  const [files, setFiles] = useState({
    license: null,
    id_card: null,
    car_ownership_id: null,
  });

  // New states from UserCreate
  // const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [selectedRole, setSelectedRole] = useState(""); // Role name for conditional rendering
  const [selectedRoleOpt, setSelectedRoleOpt] = useState(null); // Role option object for the Select component
  const rolesWithoutWorkspaces = ["Customer Service", "Sorter", "Driver"];

  // Errors state
  const [errors, setErrors] = useState({
    company: "",
    workspaces: "",
    documents: "",
  });

  // extra files

  // Prefill company (if driver has it)
  useEffect(() => {
    const currentCompany = record?.driver?.company; // لو بترجع object {id,name} من API
    if (currentCompany?.id && currentCompany?.name) {
      setCompanyOpt({ value: currentCompany.id, label: currentCompany.name });
    } else if (typeof currentCompany === "string" && currentCompany) {
      setCompanyText(currentCompany);
    }
  }, [record?.driver?.company]);

  const companyOptions = useMemo(
    () => companies?.map((c) => ({ value: c.id, label: c.name })) ?? [],
    [companies]
  );

  // Role Options and Handlers (from UserCreate)
  const roleOptions = useMemo(() => {
    if (!roles) return [];
    const preferredGuardShipment = ["web", "api", "sanctum"];
    const sortByGuard = (a, b) =>
      (preferredGuardShipment.indexOf(a?.guard_name) === -1
        ? 999
        : preferredGuardShipment.indexOf(a?.guard_name)) -
      (preferredGuardShipment.indexOf(b?.guard_name) === -1
        ? 999
        : preferredGuardShipment.indexOf(b?.guard_name));
    const sorted = [...roles].sort(sortByGuard);
    const seenNames = new Set();
    const excludedRoles = [
      "Merchant",
      "Merchant Admin",
      "Driver",
      "Truck Driver",
      "Driver Admin",
      "Guest Driver",
    ];
    return sorted
      .filter((r) => !excludedRoles.includes(r?.name))
      .filter((r) => {
        const key = String(r?.name ?? "")
          .trim()
          .toLowerCase();
        if (seenNames.has(key)) return false;
        seenNames.add(key);
        return true;
      })
      .map((r) => ({
        value: r.id,
        label: r.name,
      }));
  }, [roles]);

  const handleRoleChange = (selectedOption) => {
    setSelectedRoleOpt(selectedOption);
    const roleId = selectedOption?.value;
    const role = roles?.find((r) => r.id == roleId);
    setSelectedRole(role?.name || "");
    // if (role && rolesWithoutWorkspaces.includes(role.name)) {
    //   setSelectedWorkspaces([]);
    // }
    if (role && rolesWithoutWorkspaces.includes(role.name)) {
      setSelectedWorkspace(null);
    }
  };

  const requiresWorkspace = !rolesWithoutWorkspaces.includes(selectedRole);

  const onBaseFileChange = (e, key) => {
    const file = e.target.files?.[0] ?? null;
    setFiles((p) => ({ ...p, [key]: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setPreviews((p) => ({ ...p, [key]: reader.result }));
      reader.readAsDataURL(file);
    } else {
      setPreviews((p) => ({ ...p, [key]: null }));
    }
  };

  // const onExtraFilesChange = (e) => {
  // 	const list = e.target.files ? Array.from(e.target.files) : [];
  // 	setExtraFiles(list);
  // };
  const handleAddFile = () =>
    setFileRows((rows) => [...rows, { id: Date.now(), value: "" }]);
  const handleRemoveFile = (id) =>
    setFileRows((rows) => rows.filter((r) => r.id !== id));

  const addRelative = () =>
    setRelatives((p) => [...p, { name: "", relation: "", phone: "" }]);

  const removeRelative = (idx) =>
    setRelatives((p) => p.filter((_, i) => i !== idx));

  const updateRelative = (idx, key, value) =>
    setRelatives((p) =>
      p.map((r, i) => (i === idx ? { ...r, [key]: value } : r))
    );

  const validate = (form) => {
    const newErrors = {
      company: "",
      workspaces: "",
      documents: "",
    };

    // Company required: either select or text (Existing logic merged)
    if (!companyOpt?.value && !companyText?.trim()) {
      newErrors.company = t("Company is required");
    }

    // Documents validation (Existing logic augmented)
    const hasBaseDoc = files.license || files.id_card || files.car_ownership_id;
    const fileInputs = form.querySelectorAll('input[name="files[]"]');
    const hasExtraFile = Array.from(fileInputs).some(
      (input) => input.files?.length > 0
    );

    if (!hasBaseDoc && !hasExtraFile) {
      newErrors.documents = t("Please upload at least one document image");
    }

    // Workspaces validation (New logic from UserCreate)
    if (requiresWorkspace && !selectedWorkspace && isSuperAdmin) {
      newErrors.workspaces = t("At least one workspace is required");
    }

    setErrors(newErrors);

    const isValid = Object.values(newErrors).every((error) => error === "");

    if (!isValid) {
      handleError({
        response: {
          data: { message: t("Please fill all required fields correctly") },
        },
      });
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formEl = e.currentTarget;

    if (!validate(formEl)) return;

    const fd = new FormData();

    // company (Existing logic)
    if (companyOpt?.value) {
      fd.append("company_id", String(companyOpt.value));
    } else if (companyText?.trim()) {
      fd.append("company_name", companyText.trim());
    }

    // Role (New logic)
    if (selectedRoleOpt?.value) {
      fd.append("role", String(selectedRoleOpt.value));
    }

    // relatives (Existing logic)
    if (relatives.length > 0) {
      // نظّف الصفوف الفارغة
      const normalized = relatives
        .map((r) => ({
          name: r.name?.trim() ?? "",
          relation: r.relation?.trim() ?? "",
          phone: r.phone?.trim() ?? "",
        }))
        .filter((r) => r.name || r.relation || r.phone);

      if (normalized.length > 0) {
        fd.append("relatives", JSON.stringify(normalized));
      }
    }

    // Workspaces (New logic from UserCreate)
    // if (
    //   selectedRole &&
    //   !rolesWithoutWorkspaces.includes(selectedRole) &&
    //   selectedWorkspaces.length > 0
    // ) {
    //   selectedWorkspaces.forEach((workspace, index) => {
    //     fd.append(`workspaces[${index}][id]`, workspace.id);
    //     fd.append(`workspaces[${index}][type]`, workspace.type);
    //   });
    // }
    if (
      selectedRole &&
      !rolesWithoutWorkspaces.includes(selectedRole) &&
      selectedWorkspace
    ) {
      fd.append(`workspaces[0][id]`, selectedWorkspace.id);
      fd.append(`workspaces[0][type]`, selectedWorkspace.type);
    }

    // base docs (Existing logic)
    if (files.license) fd.append("license", files.license);
    if (files.id_card) fd.append("id_card", files.id_card);
    if (files.car_ownership_id)
      fd.append("car_ownership_id", files.car_ownership_id);

    // extra files (Existing logic)
    const nameInputs = formEl.querySelectorAll('input[name="file_name[]"]');
    const fileInputs = formEl.querySelectorAll('input[name="files[]"]');

    nameInputs.forEach((nameInput, idx) => {
      const fileInput = fileInputs[idx];
      const file = fileInput?.files?.[0];
      const label = nameInput?.value?.trim();
      if (file) {
        // اسم إضافي اختياري لمرافقة الملف
        if (label) fd.append("file_name[]", label);
        else fd.append("file_name[]", "");
        fd.append("files[]", file);
      }
    });

    try {
      setIsLoading(true);
      const { data } = await axiosMerchant.post(
        `guest-drivers/drivers/${record?.driver?.id}/convert`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (data?.success) {
        onSuccess?.(data?.data?.driver);
        onClose();
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("Convert to Driver")}</DialogTitle>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <CardContent className="pt-0 space-y-6">
              {/* Company */}
              <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="input-container">
                  <label className="flex items-center gap-1" htmlFor="company">
                    {t("Company")} <RequiredField />
                  </label>

                  {companyOptions.length > 0 ? (
                    <Select
                      name="company_id"
                      options={companyOptions}
                      value={companyOpt || undefined}
                      onChange={setCompanyOpt}
                      placeholder={t("Select company")}
                      isLoading={companiesLoading}
                      className="basic-multi-select"
                      classNamePrefix="select"
                    />
                  ) : (
                    <Input
                      id="company"
                      placeholder={t("Type company name")}
                      value={companyText}
                      onChange={(e) => setCompanyText(e.target.value)}
                    />
                  )}
                  {errors.company && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.company}
                    </p>
                  )}
                </div>
              </div>

              {/* <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="input-container">
                  <label htmlFor="role">
                    {t("Role")} <RequiredField />
                  </label>
                  <Select
                    name="role"
                    options={roleOptions}
                    value={selectedRoleOpt || undefined}
                    onChange={handleRoleChange}
                    placeholder={t("Select Role")}
                    isLoading={rolesLoading}
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-500">{errors.role}</p>
                  )}
                </div>
              </div> */}

              {/* New: Workspaces Select (Conditional) */}
              {requiresWorkspace && isSuperAdmin && (
                <div className="input-container">
                  <label>
                    {t("warehouse")} <RequiredField />
                  </label>
                  <Select
                    value={
                      selectedWorkspace
                        ? {
                            value: selectedWorkspace.id,
                            label: `${
                              selectedWorkspace.name
                            } (${selectedWorkspace.type.split("\\").pop()})`,
                          }
                        : null
                    }
                    onChange={(option) => {
                      const ws = user?.workspaces?.find(
                        (w) => w.id === option?.value
                      );
                      setSelectedWorkspace(
                        ws ? { id: ws.id, type: ws.type, name: ws.name } : null
                      );
                    }}
                    options={user?.workspaces?.map((ws) => ({
                      value: ws.id,
                      label: `${ws.name} (${ws.type.split("\\").pop()})`,
                    }))}
                    placeholder={t("Select warehouse")}
                  />
                  {errors.workspaces && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.workspaces}
                    </p>
                  )}
                </div>
              )}

              {/* Documents error message placement */}
              {errors.documents && (
                <p className="mt-1 text-sm text-red-500 text-center">
                  {errors.documents}
                </p>
              )}

              {/* Relatives */}

              {/* Base Docs (existing) */}
              <div className="space-y-4">
                <h3 className="font-medium">{t("Driver Documents")}</h3>
                {baseDocs.map(({ key, label }) => {
                  const current = record?.driver?.[key]; // موجود مسبقًا؟
                  return (
                    <div className="input-container" key={key}>
                      <label htmlFor={key}>{t(label)}</label>
                      <Input
                        id={key}
                        type="file"
                        accept="image/*"
                        onChange={(e) => onBaseFileChange(e, key)}
                        className="cursor-pointer"
                      />
                      <div className="mt-2">
                        {previews[key] ? (
                          <>
                            <p className="text-sm text-muted-foreground mb-1">
                              {t("New Image Preview:")}
                            </p>
                            <ImagePreview
                              src={previews[key]}
                              alt={`New ${label}`}
                              fileName={`${label}.png`}
                            />
                          </>
                        ) : current ? (
                          <>
                            <p className="text-sm text-muted-foreground mb-1">
                              {t("Current Image:")}
                            </p>
                            <ImagePreview
                              src={`${current}`}
                              alt={label}
                              fileName={current}
                            />
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {t("No image uploaded")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{t("Relatives")}</h3>
                  <Button type="button" variant="add" onClick={addRelative}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {relatives.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("No relatives added")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {relatives.map((r, idx) => (
                      <div
                        key={idx}
                        className="grid sm:grid-cols-1 lg:grid-cols-12 gap-3"
                      >
                        <div className="lg:col-span-4 input-container">
                          <label htmlFor={`rel_name_${idx}`}>{t("Name")}</label>
                          <Input
                            id={`rel_name_${idx}`}
                            value={r.name}
                            onChange={(e) =>
                              updateRelative(idx, "name", e.target.value)
                            }
                            placeholder={t("e.g. Ahmed Ali")}
                          />
                        </div>
                        <div className="lg:col-span-4 input-container">
                          <label htmlFor={`rel_relation_${idx}`}>
                            {t("Relation")}
                          </label>
                          <Input
                            id={`rel_relation_${idx}`}
                            value={r.relation}
                            onChange={(e) =>
                              updateRelative(idx, "relation", e.target.value)
                            }
                            placeholder={t("e.g. Brother / Father")}
                          />
                        </div>
                        <div className="lg:col-span-3 input-container">
                          <label htmlFor={`rel_phone_${idx}`}>
                            {t("Phone")}
                          </label>
                          <Input
                            id={`rel_phone_${idx}`}
                            value={r.phone}
                            onChange={(e) =>
                              updateRelative(idx, "phone", e.target.value)
                            }
                            placeholder={t("e.g. 9XXXXXXX")}
                          />
                        </div>
                        <div className="lg:col-span-1 flex items-end justify-end">
                          <Button
                            type="button"
                            variant="delete"
                            onClick={() => removeRelative(idx)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Extra Files */}
              <Card className="border mt-4">
                <CardHeader>
                  <div className="flex flex-row justify-between align-center">
                    <h3 className="font-medium">{t("Files")}</h3>
                    <Button
                      className="dark:bg-gray-700 dark:hover:bg-gray-900 dark:text-white"
                      type="button"
                      onClick={handleAddFile}
                      variant="add"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {fileRows.map((row) => (
                    <div
                      key={row.id}
                      className="flex flex-col md:flex-row gap-4"
                    >
                      <div className="input-container">
                        <label
                          className="dark:text-gray-400"
                          htmlFor={`file_name_${row.id}`}
                        >
                          {t("Name")}
                        </label>
                        <Input
                          id={`file_name_${row.id}`}
                          name="file_name[]"
                          type="text"
                          placeholder={t("Enter File name...")}
                        />
                      </div>
                      <div className="input-container">
                        <label
                          className="dark:text-gray-400"
                          htmlFor={`file_input_${row.id}`}
                        >
                          {t("File")}
                        </label>
                        <Input
                          id={`file_input_${row.id}`}
                          className="h-[42px]"
                          name="files[]"
                          type="file"
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <Button
                          type="button"
                          variant="delete"
                          onClick={() => handleRemoveFile(row.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </CardContent>

            <CardFooter className="justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("Cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("Save & Convert")
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

ConvertGuestDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  record: PropTypes.object,
  onSuccess: PropTypes.func,
};
