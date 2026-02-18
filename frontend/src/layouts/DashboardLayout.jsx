import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { logoutUser } from "../features/auth/authSlice";
import { setLanguage } from "../features/theme/themeSlice";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ThemeToggle from "../components/ui/ThemeToggle";
import { Toaster } from "react-hot-toast";
import {
  LogOut,
  Users,
  Briefcase,
  LayoutDashboard,
  Menu,
  Calendar,
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

const SidebarLink = memo(({ item, isActive, isOpen, t }) => {
  const IconComp = item.icon;
  const title =
    t(item.titleKey) === item.titleKey && item.titleKey === "nav.activityLogs"
      ? "Audit & Logs"
      : t(item.titleKey);

  return (
    <Link
      to={item.path}
      title={!isOpen ? title : undefined}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-fg shadow-sm"
          : "text-sidebar-fg/80 hover:bg-sidebar-accent hover:text-sidebar-accent-fg"
      }`}
    >
      <IconComp size={20} className="shrink-0" />
      {isOpen && (
        <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </span>
      )}
    </Link>
  );
});

const LanguageSwitcher = memo(({ isOpen }) => {
  const { t, i18n } = useTranslation();
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
        title={!isOpen ? `${currentLang.flag} ${currentLang.label}` : undefined}
        className="flex items-center w-full gap-3 px-4 py-2.5 rounded-lg transition-all text-sidebar-fg/80 hover:bg-sidebar-accent hover:text-sidebar-accent-fg"
      >
        <Globe size={20} className="shrink-0" />
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
            className={`absolute bottom-full mb-1 ${isOpen ? "start-0 w-full" : "start-12 w-40"} bg-sidebar-accent border border-sidebar-border rounded-lg shadow-lg overflow-hidden z-50`}
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLangChange(lang.code)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors text-start ${lang.code === i18n.language ? "bg-sidebar-primary text-sidebar-primary-fg" : "text-sidebar-fg hover:bg-sidebar-accent"}`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const SidebarComponent = memo(
  ({ isOpen, isMobile, user, onToggle, onCloseMobile, onLogout }) => {
    const { t } = useTranslation();
    const location = useLocation();

    return (
      <div className="flex flex-col h-full bg-sidebar-bg border-e border-sidebar-border relative z-20">
        <div className="h-16 flex items-center justify-between border-b border-sidebar-border px-4 shrink-0">
          <h1
            className={`font-bold text-xl text-sidebar-fg transition-all ${!isOpen && "hidden"}`}
          >
            <span className="text-sidebar-primary">SGA</span> System
          </h1>
          {!isOpen && (
            <span className="font-bold text-xl text-sidebar-primary mx-auto">
              S
            </span>
          )}
          {!isMobile && (
            <button
              onClick={onToggle}
              className="hidden md:flex p-1.5 rounded-md text-sidebar-fg/60 hover:text-sidebar-fg hover:bg-sidebar-accent transition-colors"
            >
              {isOpen ? (
                <PanelLeftClose size={18} />
              ) : (
                <PanelLeftOpen size={18} />
              )}
            </button>
          )}
          {isMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 text-sidebar-fg/60 hover:text-sidebar-fg md:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-4 border-b border-sidebar-border flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary text-sidebar-primary-fg flex items-center justify-center font-bold text-lg shrink-0">
            {user.nom?.charAt(0).toUpperCase()}
          </div>
          {isOpen && (
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

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          <ul className="space-y-1 px-2">
            {NAV_ITEMS.map((item) => {
              if (!item.roles.includes(user.role)) return null;
              return (
                <li key={item.path}>
                  <SidebarLink
                    item={item}
                    isActive={location.pathname === item.path}
                    isOpen={isOpen}
                    t={t}
                  />
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-1 shrink-0">
          <LanguageSwitcher isOpen={isOpen} />
          <button
            onClick={onLogout}
            title={!isOpen ? t("auth.logout") : undefined}
            className="flex items-center w-full gap-3 px-4 py-2.5 rounded-lg transition-all text-destructive hover:bg-destructive/10"
          >
            <LogOut size={20} className="shrink-0" />
            {isOpen && (
              <span className="text-sm font-medium">{t("auth.logout")}</span>
            )}
          </button>
        </div>
      </div>
    );
  },
);

const DashboardLayout = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAppSelector((s) => s.auth.user);
  const dashboardData = useAppSelector((s) => s.dashboard.data);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationRef = useRef(null);
  const expiringList = dashboardData?.abonnements_expirant?.liste || [];
  const hasNotifications = expiringList.length > 0;

  useEffect(() => {
    setIsMobileOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = useCallback(async () => {
    setShowLogoutConfirm(false);
    await dispatch(logoutUser());
    navigate("/login");
  }, [dispatch, navigate]);

  if (!user) return null;

  return (
    <>
      <Toaster position="top-right" containerStyle={{ zIndex: 999999 }} />
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title={t("auth.logoutConfirmTitle")}
        message={t("auth.logoutConfirmMessage")}
        confirmLabel={t("auth.logout")}
        icon={LogOut}
      />

      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {/* Sidebar Desktop */}
        <aside
          className={`hidden md:block transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-64" : "w-20"}`}
        >
          <SidebarComponent
            isOpen={isSidebarOpen}
            user={user}
            onToggle={() => setIsSidebarOpen((o) => !o)}
            onLogout={() => setShowLogoutConfirm(true)}
          />
        </aside>

        {/* Sidebar Mobile */}
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
                exit={{
                  x: document.documentElement.dir === "rtl" ? 256 : -256,
                }}
                className="absolute top-0 bottom-0 w-64 shadow-2xl z-50 bg-sidebar-bg"
                style={{
                  [document.documentElement.dir === "rtl" ? "right" : "left"]:
                    0,
                }}
              >
                <SidebarComponent
                  isOpen={true}
                  isMobile={true}
                  user={user}
                  onCloseMobile={() => setIsMobileOpen(false)}
                  onLogout={() => setShowLogoutConfirm(true)}
                />
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 z-20 shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden p-2 text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground"
              >
                <Menu size={20} />
              </button>
              <span className="md:hidden font-bold text-foreground">
                <span className="text-primary">SGA</span> System
              </span>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 rounded-lg transition-colors ${showNotifications ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent"}`}
                >
                  <Bell size={20} />
                  {hasNotifications && (
                    <span className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-destructive text-destructive-foreground text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-card shadow-sm">
                      {expiringList.length > 9 ? "9+" : expiringList.length}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full mt-3 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
                      style={{
                        [document.documentElement.dir === "rtl"
                          ? "left"
                          : "right"]: 0,
                      }}
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                        <h3 className="font-semibold text-sm">
                          {t("dashboard.notifications", "Notifications")}
                        </h3>
                      </div>
                      <div className="max-h-[350px] overflow-y-auto p-2 space-y-1">
                        {!hasNotifications ? (
                          <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                            <Bell size={32} className="mb-2 opacity-20" />
                            <p className="text-sm">
                              {t("dashboard.noNotifications")}
                            </p>
                          </div>
                        ) : (
                          expiringList.map((item) => (
                            <button
                              key={item.id}
                              onClick={() =>
                                navigate(`/subscriptions/${item.id}`)
                              }
                              className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-start"
                            >
                              <div
                                className={`mt-0.5 p-2 rounded-full ${item.jours_restants <= 7 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}
                              >
                                <AlertTriangle size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {item.client}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {t("common.amount")}: {item.prix} DH
                                </p>
                              </div>
                              <span
                                className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${item.jours_restants <= 7 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}
                              >
                                {item.jours_restants}j
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-6 lg:p-8 relative z-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full max-w-7xl mx-auto"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
