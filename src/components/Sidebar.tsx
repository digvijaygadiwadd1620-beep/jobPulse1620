import React from "react";
import { 
  LayoutDashboard, 
  Kanban, 
  Cpu, 
  Terminal, 
  FileText, 
  BellRing, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Building2,
  Coins
} from "lucide-react";

export type ActiveTab = 
  | "matches" 
  | "kanban" 
  | "analyzer" 
  | "logs" 
  | "resume" 
  | "settings";

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  applicationCount: number;
  matchedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  applicationCount,
  matchedCount
}) => {
  const navItems = [
    {
      id: "matches" as ActiveTab,
      label: "Matches Dashboard",
      icon: LayoutDashboard,
      badge: matchedCount > 0 ? String(matchedCount) : undefined,
      badgeColor: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
    },
    {
      id: "kanban" as ActiveTab,
      label: "Application Tracker",
      icon: Kanban,
      badge: applicationCount > 0 ? String(applicationCount) : undefined,
      badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30"
    },
    {
      id: "analyzer" as ActiveTab,
      label: "Resume vs. JD Analyzer",
      icon: Cpu,
      badge: "TF-IDF",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
    },
    {
      id: "logs" as ActiveTab,
      label: "24/7 Agent Scanner",
      icon: Terminal,
      badge: "Live",
      badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/30"
    },
    {
      id: "resume" as ActiveTab,
      label: "Resume & Skills",
      icon: FileText
    },
    {
      id: "settings" as ActiveTab,
      label: "Telegram & Alerts",
      icon: BellRing
    }
  ];

  return (
    <aside 
      className={`relative flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 select-none ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 z-20 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center shadow-md transition"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Navigation Items */}
      <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                isActive 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
              
              {!collapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}

              {!collapsed && item.badge && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}

              {/* Collapsed Tooltip Pill */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-800 text-slate-100 text-[11px] rounded-md shadow-xl border border-slate-700 opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Agent Engine Status Footer */}
      {!collapsed && (
        <div className="p-3 m-2 rounded-xl bg-slate-850 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-200 text-[11px]">Database Active</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            SQLite persistent storage with zero duplicate deduplication active.
          </p>
        </div>
      )}
    </aside>
  );
};
