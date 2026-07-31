import { useAuth } from "../context/AuthContext";
import { NavLink } from "react-router-dom";

const themes = {
  blue: {
    sidebarBg: "bg-blue-950",
    headerBg: "bg-blue-900",
    activeBg: "bg-blue-700",
    hoverBg: "hover:bg-blue-800",
  },
  green: {
    sidebarBg: "bg-green-950",
    headerBg: "bg-green-900",
    activeBg: "bg-green-700",
    hoverBg: "hover:bg-green-800",
  },
  purple: {
    sidebarBg: "bg-purple-950",
    headerBg: "bg-purple-900",
    activeBg: "bg-purple-700",
    hoverBg: "hover:bg-purple-800",
  },
};

// navGroups example:
// [{ title: "MASTER DATA", items: [{ label: "Items", path: "/admin/items" }] }]
export default function Layout({ portalName, theme = "blue", navGroups, children }) {
  const { user, logout } = useAuth();
  const colors = themes[theme];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className={`w-64 ${colors.sidebarBg} text-white flex flex-col`}>
        <div className={`${colors.headerBg} px-4 py-5`}>
          <h2 className="font-bold text-lg">{portalName}</h2>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {navGroups.map((group, i) => (
            <div key={i} className="mb-4">
              {group.title && (
                <p className="px-4 text-xs font-semibold text-white/50 mb-1">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm ${colors.hoverBg} ${
                      isActive ? colors.activeBg : ""
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {user?.name} <span className="text-slate-400">({user?.role})</span>
            </span>
            <button onClick={logout} className="text-sm text-red-600 font-medium">
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}