import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/contexts/AuthContext";
import { login } from "@/stores/features/authFeature";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Select from "@/components/misc/Select";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageProvider";
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectLabel,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

export function Login() {
  const authContext = useAuthContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(false);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);

  // workspaces is now an object keyed by model name
  const [workspaces, setWorkspaces] = useState({});
  // selectedWorkSpace will hold { id, type }
  const [selectedWorkSpace, setSelectedWorkSpace] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = "Login | Ra7al Express";
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const enteredLogin = formData.get("login");
    const enteredPassword = formData.get("password");
    formData.set("login", enteredLogin);
    formData.set("email", enteredLogin);
    try {
      const resultAction = await dispatch(login(formData));
      setEmail(enteredLogin);
      if (login.fulfilled.match(resultAction)) {
        const { data, success, message } = resultAction.payload;
        const { token, user, workspace } = data;

        // If login returns workspace array, group it
        if (!success && Array.isArray(workspace) && workspace.length) {
          toast.success(message || "Please select a workspace.");
          const grouped = workspace.reduce((groups, ws) => {
            const model = ws.type.split("Models\\").pop(); // "Hub"|"Station"|"Branch"
            if (!groups[model]) groups[model] = [];
            groups[model].push(ws);
            return groups;
          }, {});
          setWorkspaces(grouped);
          // setEmail(enteredEmail);
          setEmail(enteredLogin);
          setPassword(enteredPassword);
          setIsLoading(false);
          return;
        }

        if (!success) {
          toast.error(message || "Invalid credentials.");
          setIsLoading(false);
          return;
        }

        // fully logged in with single workspace
        toast.success("Logged in successfully.");
        authContext.setToken(token);
        authContext.setUser(user);
        if (workspace) authContext.setWorkSpace(workspace);
        const targetRoute =
          data?.role?.name === "Customer Service" ? "/crm-tasks" : "/dashboard";
        navigate(targetRoute);
      } else {
        toast.error(resultAction.payload || "Error");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkspaceSelection = async (ws) => {
    if (!ws) {
      toast.error("Please select a workspace.");
      return;
    }

    setIsWorkspaceLoading(true);

    try {
      const formData = new FormData();
      formData.append("login", email);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("workspace", ws.value);

      const resultAction = await dispatch(login(formData));

      if (login.fulfilled.match(resultAction)) {
        const { data, success, message } = resultAction.payload;
        if (success) {
          toast.success("Logged in successfully.");
          authContext.setToken(data.token);
          authContext.setUser(data.user);
          authContext.setWorkSpace(data.workspace);
          navigate("/dashboard");
        } else {
          toast.error(message || "Error selecting workspace.");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error selecting workspace.");
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  // Build react-select “grouped options” only when workspaces change
  const workspaceOptions = useMemo(() => {
    return Object.entries(workspaces).map(([model, items]) => ({
      label: model + "s",
      options: items.map((ws) => ({
        value: JSON.stringify({ id: ws.id, type: ws.type }),
        label: ws.name,
      })),
    }));
  }, [workspaces]);

  console.log(workspaceOptions);

  const hasWorkspaces = Object.keys(workspaces).length > 0;
  const { t } = useTranslation();
  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className="w-full h-screen lg:grid lg:grid-cols-2"
    >
      <div className="flex items-center justify-center min-h-screen py-12 bg-gradient-to-b from-[#031d4e] to-[#031d4e] dark:from-[#0f1e42] dark:to-[#8a4b1a] md:bg-none md:min-h-0">
        <div className="mx-auto grid w-full max-w-[350px] gap-6 bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg md:shadow-none md:bg-transparent dark:md:bg-transparent md:p-0 md:w-[350px]">
          <div className="block mx-auto text-[32px] font-bold md:hidden text-center mb-6">
            <span className="font-semibold">
              <span className="text-[#031d4e] dark:text-[#ff8c42]">
                {t("title.Ra7al")}
              </span>
              <span className="text-[#031d4e] dark:text-[#7492DF]">
                {" "}
                {t("title.Express")}
              </span>
            </span>
          </div>
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">{t("Login")}</h1>
            <p className="text-muted-foreground">
              {t("Enter your email below to login to your account")}
            </p>
          </div>

          {!hasWorkspaces ? (
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <Label>{t("User Name / Email")}</Label>
                <Input
                  type="text"
                  name="login"
                  placeholder={t("Enter your email...")}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Label>{t("Password")}</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder={t("Enter password...")}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={
                    <div className="cursor-pointer">
                      {showPassword ? (
                        <EyeOff
                          className="w-4 h-4"
                          onClick={() => setShowPassword(false)}
                        />
                      ) : (
                        <Eye
                          className="w-4 h-4"
                          onClick={() => setShowPassword(true)}
                        />
                      )}
                    </div>
                  }
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    t("Login")
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4">
              <Label>{t("Select a workspace")}</Label>
              <Select
                options={workspaceOptions}
                value={selectedWorkSpace}
                onChange={(opt) => setSelectedWorkSpace(opt)}
                isSearchable
                isClearable
                placeholder={t("Choose a workspace...")}
                isLoading={isWorkspaceLoading}
              />
              {/* <Select
                value={selectedWorkSpace ? JSON.stringify(selectedWorkSpace) : ""}
                onValueChange={(val) =>
                  setSelectedWorkSpace(JSON.parse(val))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a workspace" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(workspaces).map(([model, items]) => (
                    <SelectGroup key={model}>
                      <SelectLabel>{model + "s"}</SelectLabel>
                      {items.map((ws) => (
                        <SelectItem
                          key={`${ws.type}-${ws.id}`}
                          value={JSON.stringify({ id: ws.id, type: ws.type })}
                        >
                          {ws.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select> */}
              <Button
                onClick={() => handleWorkspaceSelection(selectedWorkSpace)}
                disabled={!selectedWorkSpace || isWorkspaceLoading}
              >
                {isWorkspaceLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  t("Continue")
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="hidden h-screen bg-muted dark:bg-gray-800 lg:block">
        <img
          src="login-image.png"
          alt="Login"
          className="h-full w-full object-cover bg-indigo-500"
        />
      </div>
    </div>
  );
}
