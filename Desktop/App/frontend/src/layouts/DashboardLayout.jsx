import React, { useState, useEffect, useCallback, memo } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { logoutUser } from "../features/auth/authSlice";
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
} from "lucide-react";

const NAV_ITEMS = [
  {
    title: "Tableau de Bord",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "employee"],
  },
  {
    title: "Gestion Employés",
    path: "/employees",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Gestion Clients",
    path: "/clients",
    icon: Briefcase,
    roles: ["admin", "employee"],
  },
  {
    title: "Abonnements",
    path: "/subscriptions",
    icon: Calendar,
    roles: ["admin", "employee"],
  },
];

const SidebarLink = memo(function SidebarLink({ item, isActive, isOpen }) {
  const IconComp = item.icon;
  return (
    <Link
      to={item.path}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all ${
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-fg shadow-sm"
          : "text-sidebar-fg/80 hover:bg-sidebar-accent hover:text-sidebar-accent-fg"
      }`}
    >
      <IconComp size={20} />
      {isOpen && <span className="text-sm font-medium">{item.title}</span>}
    </Link>
  );
});

const DashboardLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const handleLogout = useCallback(async () => {
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
          className={`font-bold text-xl text-sidebar-fg transition-all ${
            !isSidebarOpen && "hidden"
          }`}
        >
          SGA System
        </h1>
        {!isSidebarOpen && (
          <span className="font-bold text-xl text-primary mx-auto">S</span>
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
            <span className="text-xs text-sidebar-fg/70 uppercase">
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
                />
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center w-full gap-3 px-4 py-2.5 rounded-md transition-all text-sidebar-fg/80 hover:bg-sidebar-accent hover:text-sidebar-accent-fg"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          {isSidebarOpen && (
            <span className="text-sm font-medium">
              {theme === "dark" ? "Mode Clair" : "Mode Sombre"}
            </span>
          )}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-3 px-4 py-2.5 rounded-md transition-all text-destructive hover:bg-destructive/10"
        >
          <LogOut size={20} />
          {isSidebarOpen && (
            <span className="text-sm font-medium">Déconnexion</span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background text-foreground font-sans transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside
        className={`bg-sidebar-bg border-r border-sidebar-border transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        } hidden md:flex flex-col`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative w-64 h-full bg-sidebar-bg border-r border-sidebar-border flex flex-col z-50">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="md:hidden h-16 border-b border-border bg-card flex items-center justify-between px-4 z-20">
          <span className="font-bold text-foreground">SGA System</span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-foreground rounded-md hover:bg-accent transition-colors"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 text-muted-foreground rounded-md hover:bg-accent transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/20 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
