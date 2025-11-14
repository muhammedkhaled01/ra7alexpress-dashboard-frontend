import { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { can, handleError, generateTabId, hasRole } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { getRoles } from "@/stores/features/ajaxFeature";
import { useDispatch, useSelector } from "react-redux";
import PhoneInput from "@/components/misc/PhoneInput";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

function UserCreate() {
  const user = useSelector((store) => store.auth.user);
  const [phone, setPhone] = useState("");
  const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const isSuperAdmin = hasRole("Super Admin");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    role: "",
    workspaces: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const rolesWithoutWorkspaces = ["Customer Service", "Sorter", "Driver"];
  const getPasswordStrength = (password) => {
    let strength = 0;
    const rules = [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/];
    rules.forEach((rule) => rule.test(password) && strength++);
    return strength;
  };

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    role: "",
  });

  useEffect(() => {
    setStrength(getPasswordStrength(formData.password));
  }, [formData.password]);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [workspacesList, setWorkspacesList] = useState([]);
  const [workspaceOptions, setWorkspaceOptions] = useState([]);
  const roles = useSelector((store) => store.ajax.roles);
  const fetchedRolesOnce = useRef(false);

  useEffect(() => {
    // امنع تكرار الاستدعاء لو حصل remount في Strict Mode
    if (!fetchedRolesOnce.current && (!roles || roles.length === 0)) {
      fetchedRolesOnce.current = true; // علِّم قبل الـ dispatch
      dispatch(getRoles());
    }
    // بنعتمد على طول المصفوفة لتفادي إعادة التنفيذ بدون داعي
  }, [dispatch, roles?.length]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // لو عايز تتجاهل الـ scope لغير السوبر أدمن ابعت all=1
        const res = await axiosMerchant.get("workspaces", {
          params: { for_select: 1, per_page: 1000, all: 1 },
        });
        const data = res?.data?.data ?? [];
        if (!mounted) return;

        setWorkspacesList(data);
        setWorkspaceOptions(
          data.map((ws) => ({
            value: `${ws.type}|${ws.id}`,
            label: `${ws.name} (${ws.type.split("\\").pop()})`,
            raw: ws,
          }))
        );

        // اختيار افتراضي من localStorage (لو موجود)
        const key = localStorage.getItem("X-Workspace-Key")?.trim();
        const type = localStorage.getItem("X-Workspace-Type")?.trim();
        if (key && type && selectedWorkspaces.length === 0) {
          const def = data.find(
            (ws) => String(ws.id) === key && ws.type === type
          );
          if (def) {
            setSelectedWorkspaces([
              { id: def.id, type: def.type, name: def.name },
            ]);
          }
        }
      } catch (e) {
        handleError(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // useEffect(() => {
  //   if (!roles) dispatch(getRoles());
  // }, [dispatch, roles]);

  const strengthColors = [
    { label: t("Very Weak"), color: "bg-red-500" },
    { label: t("Weak"), color: "bg-orange-500" },
    { label: t("Fair"), color: "bg-yellow-500" },
    { label: t("Good"), color: "bg-blue-500" },
    { label: t("Strong"), color: "bg-green-500" },
  ];

  const validateForm = (formData) => {
    const roleId = formData.get("role");
    const selectedRole = roles?.find((r) => r.id == roleId);
    const requiresWorkspace = !rolesWithoutWorkspaces.includes(
      selectedRole?.name
    );
    const newErrors = {
      name: formData.get("name") ? "" : t("Name is required"),
      // email: formData.get("email") ? "" : t("Email is required"),
      password: formData.get("password") ? "" : t("Password is required"),
      phone: phone ? "" : t("Phone is required"),
      role: formData.get("role") ? "" : t("Role is required"),
      workspaces:
        requiresWorkspace && selectedWorkspaces.length === 0 && isSuperAdmin
          ? t("At least one workspace is required")
          : "",
    };

    const password = formData.get("password");
    if (password && password.length < 8) {
      newErrors.password = t("Password must be at least 8 characters");
    } else if (password && strength < 3) {
      newErrors.password = t("Password is too weak");
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (!validateForm(form)) {
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.get("name"));
      formData.append("username", form.get("username"));
      formData.append("email", form.get("email"));
      formData.append("password", form.get("password"));
      formData.append("role", form.get("role"));
      formData.append("phone", phone);
      const roleId = form.get("role");
      const selectedRole = roles?.find((r) => r.id == roleId);
      if (
        selectedRole &&
        !rolesWithoutWorkspaces.includes(selectedRole.name) &&
        selectedWorkspaces.length > 0
      ) {
        selectedWorkspaces.forEach((workspace, index) => {
          formData.append(`workspaces[${index}][id]`, workspace.id);
          formData.append(`workspaces[${index}][type]`, workspace.type);
        });
      }
      const response = await axiosMerchant.post(`users/store`, formData);
      toast.success(response.data.message);
      const currentTabId = generateTabId("/users/create");
      navigate("/users", { state: { closeTabId: currentTabId } });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (user?.workspaces && selectedWorkspaces.length === 0) {
      const workspaceKey = localStorage.getItem("X-Workspace-Key")?.trim();
      const workspaceType = localStorage.getItem("X-Workspace-Type")?.trim();

      if (workspaceKey && workspaceType) {
        const defaultWorkspace = user.workspaces.find((ws) => {
          const normalizedType = ws.type.replace(/\\\\/g, "\\").trim();

          return (
            String(ws.id).trim() === workspaceKey &&
            normalizedType === workspaceType
          );
        });

        if (defaultWorkspace) {
          setSelectedWorkspaces([
            {
              id: defaultWorkspace.id,
              type: defaultWorkspace.type,
              name: defaultWorkspace.name,
            },
          ]);
        }
      }
    }
  }, [user?.workspaces, selectedWorkspaces.length]);
  const handleRoleChange = (selectedOption) => {
    const roleId = selectedOption.value;
    const role = roles?.find((r) => r.id == roleId);
    setSelectedRole(role?.name || "");
    if (role && rolesWithoutWorkspaces.includes(role.name)) {
      setSelectedWorkspaces([]);
    }
  };

  const canAccess = can("User create");

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  const requiresWorkspace = !rolesWithoutWorkspaces.includes(selectedRole);

  const roleOptions = useMemo(() => {
    if (!roles) return [];

    // لو عايز تفضّل guard_name معيّن لما فيه اسمين متطابقين
    const preferredGuardShipment = ["web", "api", "sanctum"]; // عدّل الترتيب حسب نظامك
    const sortByGuard = (a, b) =>
      (preferredGuardShipment.indexOf(a?.guard_name) === -1
        ? 999
        : preferredGuardShipment.indexOf(a?.guard_name)) -
      (preferredGuardShipment.indexOf(b?.guard_name) === -1
        ? 999
        : preferredGuardShipment.indexOf(b?.guard_name));

    // رتبهم الأول علشان لما نعمل dedupe ناخد النسخة المفضّلة
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
          .toLowerCase(); // dedupe بالاسم (case-insensitive)
        if (seenNames.has(key)) return false;
        seenNames.add(key);
        return true;
      })
      .map((r) => ({
        value: r.id,
        // لو حابب تميّزهم بصريًا بدل ما تلغي واحد منهم:
        // label: `${r.name}${r.guard_name ? ` (${r.guard_name})` : ''}`,
        label: r.name,
      }));
  }, [roles]);
  console.table(
    (roles ?? []).map((r) => ({ id: r.id, name: r.name, guard: r.guard_name }))
  );

  return (
    <div>
      <Card className="">
        <CardHeader>
          <CardTitle>{t("Create User")}</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="input-container">
                <label htmlFor="name">
                  {t("Name")} <RequiredField />
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder={t("Enter Name")}
                  error={errors.name}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="username">
                  {t("Username")} <RequiredField />
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder={t("Enter Username")}
                  error={errors.username}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="email">{t("Email")}</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("Enter Email")}
                  error={errors.email}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="phone">
                  {t("Phone")} <RequiredField />
                </label>
                <PhoneInput
                  country={"eg"}
                  value={phone}
                  onChange={setPhone}
                  enableSearch={true}
                  inputClass="!bg-background !text-foreground"
                  buttonClass="!bg-muted"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="password">
                  {t("Password")} <RequiredField />
                </label>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder={t("e.g Aa@123456")}
                  error={errors.password}
                  icon={
                    <div
                      className="cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </div>
                  }
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}

                {/* Password Strength Bar */}
                <AnimatePresence>
                  {formData.password && (
                    <motion.div
                      className="mt-2 h-2 rounded transition-all"
                      initial={{ width: 0 }}
                      animate={{ width: `${(strength / 5) * 100}%` }}
                      exit={{ width: 0 }}
                    >
                      <div
                        className={clsx(
                          "h-full rounded",
                          strengthColors[strength - 1]?.color || "bg-gray-300"
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Strength Label */}
                {formData.password && (
                  <p className="text-sm mt-1 text-muted-foreground">
                    {t(strengthColors[strength - 1]?.label || "Too Short")}
                  </p>
                )}

                {/* Guidelines */}
                {formData.password && (
                  <ul className="mt-2 text-xs text-muted-foreground list-disc pl-5 space-y-1">
                    <li>{t("At least 8 characters")}</li>
                    <li>{t("Include uppercase and lowercase letters")}</li>
                    <li>{t("Include numbers")}</li>
                    <li>{t("Include special characters (!@#$%)")}</li>
                  </ul>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="role">
                  {t("Role")} <RequiredField />
                </label>
                <Select
                  name="role"
                  options={roleOptions}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder={t("Select Role")}
                  error={errors.role}
                  onChange={handleRoleChange}
                />
                {errors.role && (
                  <p className="mt-1 text-sm text-red-500">{errors.role}</p>
                )}
              </div>

              {requiresWorkspace && isSuperAdmin && (
                <div className="input-container">
                  <label>
                    {t("Workspaces")} <RequiredField />
                  </label>
                  <Select
                    isMulti
                    value={selectedWorkspaces.map((ws) => ({
                      value: `${ws.type}|${ws.id}`,
                      label: `${ws.name} (${ws.type.split("\\").pop()})`,
                    }))}
                    onChange={(selectedOptions) => {
                      const selected = (selectedOptions || []).map((opt) => {
                        const [type, id] = String(opt.value).split("|");
                        const ws = workspaceOptions.find(
                          (o) => o.value === opt.value
                        )?.raw;
                        return { id, type, name: ws?.name || opt.label };
                      });
                      setSelectedWorkspaces(selected);
                    }}
                    options={workspaceOptions}
                    placeholder={t("Select one or more workspaces")}
                  />
                  {errors.workspaces && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.workspaces}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="mt-4 ml-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("Save Changes")
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default UserCreate;
