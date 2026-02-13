import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import axios from "axios";
import {
  LogOut,
  Users,
  Briefcase,
  LayoutDashboard,
  Menu,
  Calendar,
  Sun,
  Moon,
} from "lucide-react";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- Theme Logic ---
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  // -------------------

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!token || !storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/logout",
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const menuItems = [
    {
      title: "Tableau de Bord",
      path: "/dashboard",
      icon: <LayoutDashboard size={20} />,
      roles: ["admin", "employee"],
    },
    {
      title: "Gestion Employés",
      path: "/employees",
      icon: <Users size={20} />,
      roles: ["admin"],
    },
    {
      title: "Gestion Clients",
      path: "/clients",
      icon: <Briefcase size={20} />,
      roles: ["admin", "employee"],
    },
    {
      title: "Abonnements",
      path: "/subscriptions",
      icon: <Calendar size={20} />,
      roles: ["admin", "employee"],
    },
  ];

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background text-foreground font-sans transition-colors duration-300">
      {/* ================= SIDEBAR ================= */}
      <aside
        className={`bg-sidebar-bg border-r border-sidebar-border transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        } hidden md:flex flex-col`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-sidebar-border">
          <h1
            className={`font-bold text-xl text-sidebar-fg ${!isSidebarOpen && "hidden"}`}
          >
            SGA System
          </h1>
          {!isSidebarOpen && (
            <span className="font-bold text-xl text-primary">S</span>
          )}
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary text-sidebar-primary-fg flex items-center justify-center font-bold text-lg shrink-0">
            {user.nom.charAt(0).toUpperCase()}
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item, index) => {
              if (item.roles && !item.roles.includes(user.role)) return null;
              const isActive = location.pathname === item.path;
              return (
                <li key={index}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-fg shadow-sm"
                        : "text-sidebar-fg/80 hover:bg-sidebar-accent hover:text-sidebar-accent-fg"
                    }`}
                  >
                    {item.icon}
                    {isSidebarOpen && <span>{item.title}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions (Toggle Theme + Logout) */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center w-full gap-3 px-4 py-2.5 rounded-md transition-all text-sidebar-fg/80 hover:bg-sidebar-accent hover:text-sidebar-accent-fg"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            {isSidebarOpen && (
              <span className="font-medium">
                {theme === "dark" ? "Mode Clair" : "Mode Sombre"}
              </span>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-4 py-2.5 rounded-md transition-all text-destructive hover:bg-destructive/10"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-border bg-card flex items-center justify-between px-4 z-20">
          <span className="font-bold text-foreground">SGA System</span>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 text-foreground">
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2 text-muted-foreground">
              <Menu />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/20 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
