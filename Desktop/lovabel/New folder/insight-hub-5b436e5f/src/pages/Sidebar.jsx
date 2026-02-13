import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarDays,
  LogOut,
  ChevronLeft,
  Menu,
  ShieldCheck,
} from "lucide-react";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    {
      name: "Tableau de bord",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
      roles: ["admin", "employee"],
    },
    {
      name: "Employés",
      icon: <Users size={20} />,
      path: "/employees",
      roles: ["admin"],
    },
    {
      name: "Clients",
      icon: <Briefcase size={20} />,
      path: "/clients",
      roles: ["admin", "employee"],
    },
    {
      name: "Abonnements",
      icon: <CalendarDays size={20} />,
      path: "/abonnements",
      roles: ["admin", "employee"],
    },
  ];

  return (
    <div
      className={`relative min-h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header / Logo */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-gray-50">
        {!isCollapsed && (
          <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent uppercase tracking-tighter">
            SGA System
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* User Profile Info */}
      {!isCollapsed && user && (
        <div className="p-4 mx-4 mt-6 bg-indigo-50 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
            {user.nom?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-gray-900 text-sm truncate">
              {user.nom}
            </span>
            <span className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1">
              <ShieldCheck size={10} /> {user.role}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-4 mt-6 space-y-2">
        {menuItems.map((item) => {
          // التحقق من الصلاحيات بناءً على مخطط Use Case
          if (!item.roles.includes(user?.role)) return null;

          const isActive = location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "text-gray-500 hover:bg-gray-50 hover:text-indigo-600"
              }`}
            >
              <div
                className={
                  isActive ? "text-white" : "group-hover:text-indigo-600"
                }
              >
                {item.icon}
              </div>
              {!isCollapsed && (
                <span className="text-sm font-semibold">{item.name}</span>
              )}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-4 w-full px-4 py-3 text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={20} />
          {!isCollapsed && (
            <span className="text-sm font-semibold">Déconnexion</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
