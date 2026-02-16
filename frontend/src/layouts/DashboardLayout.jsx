import React, { useState, useEffect, useCallback, memo } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { logoutUser } from "../features/auth/authSlice";
import { toggleTheme, setLanguage } from "../features/theme/themeSlice";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Modal from "../components/ui/Modal";
import {
  LogOut,
  Users,
  Briefcase,
  LayoutDashboard,
  Menu,
  Calendar,
  Sun,
  Moon,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  ChevronDown,
  Bell,
  AlertTriangle,
  ShieldAlert,
  ArchiveRestore,
} from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

const NAV_ITEMS = [
  {
    titleKey: "nav.dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "employee"],
  },
  {
    titleKey: "nav.employees",
    path: "/employees",
    icon: Users,
    roles: ["admin"],
  },
  {
    titleKey: "nav.clients",
    path: "/clients",
    icon: Briefcase,
    roles: ["admin", "employee"],
  },
  {
    titleKey: "nav.subscriptions",
    path: "/subscriptions",
    icon: Calendar,
    roles: ["admin", "employee"],
  },
  {
    titleKey: "nav.activityLogs",
    path: "/activity-logs",
    icon: ShieldAlert,
    roles: ["admin"],
  },
  {
    titleKey: "Corbeille",
    path: "/recycle-bin",
    icon: ArchiveRestore,
    roles: ["admin"],
  },
];

const SidebarLink = memo(function SidebarLink({ item, isActive, isOpen, t }) {
  const IconComp = item.icon;
  const title =
    t(item.titleKey) === item.titleKey && item.titleKey === "nav.activityLogs"
      ? "Audit & Logs"
      : t(item.titleKey);

  return (
    <Link
      to={item.path}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-fg shadow-sm"
          : "text-sidebar-fg/80 hover:bg-sidebar-accent hover:text-sidebar-accent-fg"
      }`}
    >
      <IconComp size={20} />
      {isOpen && <span className="text-sm font-medium">{title}</span>}
    </Link>
  );
});

const LanguageSwitcher = ({ isOpen }) => {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const [showDropdown, setShowDropdown] = useState(false);

  const currentLang =
    LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[1];

  const handleLangChange = useCallback(
    (code) => {
      i18n.changeLanguage(code);
      dispatch(setLanguage(code));
      document.documentElement.setAttribute(
        "dir",
        code === "ar" ? "rtl" : "ltr",
      );
      document.documentElement.setAttribute("lang", code);
      setShowDropdown(false);
    },
    [i18n, dispatch],
  );

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown((v) => !v)}
        className="flex items-center w-full gap-3 px-4 py-2.5 rounded-lg transition-all text-sidebar-fg/80 hover:bg-sidebar-accent hover:text-sidebar-accent-fg"
      >
        <Globe size={20} />
        {isOpen && (
          <>
            <span className="text-sm font-medium flex-1 text-start">
              {currentLang.flag} {currentLang.label}
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform ${showDropdown ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-1 start-0 w-full bg-sidebar-accent border border-sidebar-border rounded-lg shadow-lg overflow-hidden z-50"
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLangChange(lang.code)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors text-start ${
                  lang.code === i18n.language
                    ? "bg-sidebar-primary text-sidebar-primary-fg"
                    : "text-sidebar-fg hover:bg-sidebar-accent"
                }`}
              >
                <span>{lang.flag}</span>
                {isOpen && <span>{lang.label}</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DashboardLayout = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);
  const themeMode = useAppSelector((s) => s.theme.mode);
  const dashboardData = useAppSelector((s) => s.dashboard.data);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const expiringList = dashboardData?.abonnements_expirant?.liste || [];

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(themeMode);
  }, [themeMode]);

  const handleToggleTheme = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);

  const handleLogout = useCallback(async () => {
    setShowLogoutConfirm(false);
    await dispatch(logoutUser());
    navigate("/login");
  }, [dispatch, navigate]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center justify-between border-b border-sidebar-border px-4">
        <h1
          className={`font-bold text-xl text-sidebar-fg transition-all ${!isSidebarOpen && "hidden"}`}
        >
          <span className="text-sidebar-primary">SGA</span> System
        </h1>
        {!isSidebarOpen && (
          <span className="font-bold text-xl text-sidebar-primary mx-auto">
            S
          </span>
        )}
        <button
          onClick={() => setIsSidebarOpen((o) => !o)}
          className="hidden md:flex p-1.5 rounded-md text-sidebar-fg/60 hover:text-sidebar-fg hover:bg-sidebar-accent transition-colors"
        >
          {isSidebarOpen ? (
            <PanelLeftClose size={18} />
          ) : (
            <PanelLeftOpen size={18} />
          )}
        </button>
      </div>

      <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-sidebar-primary text-sidebar-primary-fg flex items-center justify-center font-bold text-lg shrink-0">
          {user.nom?.charAt(0).toUpperCase()}
        </div>
        {isSidebarOpen && (
          <div className="overflow-hidden">
            <p className="font-medium text-sm text-sidebar-fg truncate">
              {user.nom}
            </p>
            <span className="text-xs text-sidebar-muted uppercase tracking-wider">
              {user.role}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            if (!item.roles.includes(user.role)) return null;
            return (
              <li key={item.path}>
                <SidebarLink
                  item={item}
                  isActive={location.pathname === item.path}
                  isOpen={isSidebarOpen}
                  t={t}
                />
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-1">
        <LanguageSwitcher isOpen={isSidebarOpen} />
        <button
          onClick={handleToggleTheme}
          className="flex items-center w-full gap-3 px-4 py-2.5 rounded-lg transition-all text-sidebar-fg/80 hover:bg-sidebar-accent hover:text-sidebar-accent-fg"
        >
          {themeMode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          {isSidebarOpen && (
            <span className="text-sm font-medium">
              {themeMode === "dark"
                ? t("common.lightMode")
                : t("common.darkMode")}
            </span>
          )}
        </button>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center w-full gap-3 px-4 py-2.5 rounded-lg transition-all text-destructive hover:bg-destructive/10"
        >
          <LogOut size={20} />
          {isSidebarOpen && (
            <span className="text-sm font-medium">{t("auth.logout")}</span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors duration-300">
      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title={t("auth.logoutConfirmTitle")}
        message={t("auth.logoutConfirmMessage")}
        confirmLabel={t("auth.logout")}
        icon={LogOut}
      />

      {/* Notifications Modal */}
      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title={t("dashboard.notifications")}
        icon={Bell}
        maxWidth="max-w-lg"
      >
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {expiringList.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {t("dashboard.noNotifications")}
            </p>
          ) : (
            expiringList.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setShowNotifications(false);
                  navigate(`/subscriptions/${item.id}`);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-start"
              >
                <div
                  className={`p-2 rounded-full shrink-0 ${item.jours_restants <= 7 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}
                >
                  <AlertTriangle size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {item.client}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.prix} DH · {item.date_fin}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold shrink-0 ${item.jours_restants <= 7 ? "text-destructive" : "text-warning"}`}
                >
                  {item.jours_restants}j
                </span>
              </button>
            ))
          )}
        </div>
      </Modal>

      {/* Desktop Sidebar */}
      <aside
        className={`bg-sidebar-bg border-e border-sidebar-border transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-20"} hidden md:flex flex-col`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{
                x: document.documentElement.dir === "rtl" ? 256 : -256,
              }}
              animate={{ x: 0 }}
              exit={{ x: document.documentElement.dir === "rtl" ? 256 : -256 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-64 h-full bg-sidebar-bg border-e border-sidebar-border flex flex-col z-50"
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 end-4 p-1 text-sidebar-fg/60 hover:text-sidebar-fg z-50"
              >
                <X size={20} />
              </button>
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-muted-foreground rounded-lg hover:bg-accent transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="md:hidden font-bold text-foreground">
              <span className="text-primary">SGA</span> System
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground transition-colors"
            >
              <Bell size={20} />
              {expiringList.length > 0 && (
                <span className="absolute -top-0.5 -end-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {expiringList.length}
                </span>
              )}
            </button>
            <button
              onClick={handleToggleTheme}
              className="p-2 text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground transition-colors"
            >
              {themeMode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
