import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface AgentStatusData {
  id: string;
  name: string;
  type: string;
  status: "idle" | "active" | "processing" | "error";
  lastActivity?: string;
}

export default function AgentStatus() {
  const { data: agents, isLoading } = useQuery<AgentStatusData[]>({
    queryKey: ["/api/dashboard/agents"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
          Agent Status
        </h3>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <div className="h-4 w-20 bg-gray-300 rounded"></div>
                </div>
                <div className="h-5 w-12 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
        Agent Status
      </h3>
      <div className="space-y-3" data-testid="agent-status-list">
        {agents?.map((agent) => (
          <div key={agent.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  agent.status === "active"
                    ? "bg-green-500"
                    : agent.status === "processing"
                    ? "bg-blue-500 animate-pulse"
                    : agent.status === "error"
                    ? "bg-red-500"
                    : "bg-gray-400"
                }`}
                data-testid={`status-dot-${agent.id}`}
              />
              <span className="text-sm text-gray-700">{getAgentDisplayName(agent.name)}</span>
            </div>
            <Badge
              variant={
                agent.status === "active" || agent.status === "processing"
                  ? "default"
                  : agent.status === "error"
                  ? "destructive"
                  : "secondary"
              }
              className={`text-xs ${getStatusColor(agent.status)}`}
              data-testid={`status-badge-${agent.id}`}
            >
              {agent.status === "processing" ? "Processing" : 
               agent.status === "active" ? "Active" :
               agent.status === "error" ? "Error" : "Ready"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function getAgentDisplayName(name: string): string {
  const nameMap: Record<string, string> = {
    "Web Scraper Agent": "Web Scraper",
    "Data Extractor Agent": "Data Extractor", 
    "Schema Validator Agent": "Schema Validator",
    "Gemini LLM Agent": "Gemini LLM",
  };
  return nameMap[name] || name;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "text-green-600 bg-green-50";
    case "processing":
      return "text-blue-600 bg-blue-50";
    case "error":
      return "text-red-600 bg-red-50";
    default:
      return "text-green-600 bg-green-50";
  }
}
