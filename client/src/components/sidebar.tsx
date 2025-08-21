import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import AgentStatus from "./agent-status";

const navigation = [
  { name: "Dashboard", href: "/", icon: "fas fa-tachometer-alt" },
  { name: "Agents", href: "/agents", icon: "fas fa-cogs" },
  { name: "Data Sources", href: "/data-sources", icon: "fas fa-database" },
  { name: "Schema", href: "/schema", icon: "fas fa-table" },
  { name: "Analytics", href: "/analytics", icon: "fas fa-chart-line" },
  { name: "Settings", href: "/settings", icon: "fas fa-cog" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg flex-shrink-0" data-testid="sidebar">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">RestaurantAI</h1>
            <p className="text-sm text-gray-500">Multi-Agent Pipeline</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-700 hover:bg-gray-50"
                )}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <i className={`${item.icon} w-5`}></i>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <AgentStatus />
      </div>
    </div>
  );
}
