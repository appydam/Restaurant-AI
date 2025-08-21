import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  metrics: {
    requestsToday?: number;
    successRate?: number;
    avgResponseTime?: number;
    totalProcessed?: number;
    errorCount?: number;
    lastError?: string;
  };
  lastActivity?: string;
  createdAt: string;
}

export default function Agents() {
  const { toast } = useToast();

  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
    refetchInterval: 5000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("POST", `/api/agents/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Agent status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update agent status.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  return (
    <div className="flex-1 overflow-hidden" data-testid="agents-page">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Agent Management</h2>
            <p className="text-gray-600">Monitor and control multi-agent pipeline components</p>
          </div>
          <Button className="bg-primary-500 hover:bg-primary-600 text-white">
            <i className="fas fa-plus mr-2"></i>
            Add Agent
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto h-full">
        {/* Agents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="agents-grid">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-5 w-32 bg-gray-300 rounded mb-2"></div>
                        <div className="h-4 w-48 bg-gray-300 rounded"></div>
                      </div>
                      <div className="h-6 w-16 bg-gray-300 rounded"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-gray-300 rounded"></div>
                      <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
                      <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            : agents?.map((agent) => (
                <Card key={agent.id} className="bg-white">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${getAgentIconColor(agent.type)} rounded-lg flex items-center justify-center`}>
                        <i className={`${getAgentIcon(agent.type)} text-white text-xl`}></i>
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {agent.name}
                        </CardTitle>
                        <p className="text-sm text-gray-500">{getAgentDescription(agent.type)}</p>
                      </div>
                      <Badge
                        variant={getStatusVariant(agent.status)}
                        className={`${getStatusColor(agent.status)} flex items-center gap-1`}
                        data-testid={`agent-status-${agent.id}`}
                      >
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
                        />
                        {agent.status === "processing" ? "Processing" : 
                         agent.status === "active" ? "Active" :
                         agent.status === "error" ? "Error" : "Idle"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Today</span>
                          <span className="font-semibold text-gray-900">
                            {agent.metrics.requestsToday || 0}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Success Rate</span>
                          <span className="font-semibold text-green-600">
                            {agent.metrics.successRate?.toFixed(1) || 0}%
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Total Processed</span>
                          <span className="font-semibold text-gray-900">
                            {agent.metrics.totalProcessed?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Avg Time</span>
                          <span className="font-semibold text-gray-900">
                            {agent.metrics.avgResponseTime?.toFixed(1) || 0}s
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Error Display */}
                    {agent.status === "error" && agent.metrics.lastError && (
                      <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <i className="fas fa-exclamation-triangle text-red-500 mt-0.5"></i>
                          <div>
                            <p className="font-medium text-red-800 text-sm">Last Error</p>
                            <p className="text-red-700 text-sm">{agent.metrics.lastError}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <div className="flex-1 text-sm text-gray-500">
                        Last activity: {getTimeAgo(agent.lastActivity || agent.createdAt)}
                      </div>
                      <div className="flex gap-2">
                        {agent.status !== "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(agent.id, "active")}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-start-${agent.id}`}
                          >
                            <i className="fas fa-play mr-1"></i>
                            Start
                          </Button>
                        )}
                        {agent.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(agent.id, "idle")}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-stop-${agent.id}`}
                          >
                            <i className="fas fa-pause mr-1"></i>
                            Stop
                          </Button>
                        )}
                        <Button size="sm" variant="outline" data-testid={`button-configure-${agent.id}`}>
                          <i className="fas fa-cog mr-1"></i>
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Agent Types Documentation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Agent Architecture Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-spider text-white text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Web Scraper Agent</h4>
                      <p className="text-sm text-gray-600">
                        Discovers and scrapes restaurant websites using advanced crawling techniques.
                        Handles rate limiting, robots.txt compliance, and dynamic content rendering.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-database text-white text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Data Extractor Agent</h4>
                      <p className="text-sm text-gray-600">
                        Extracts structured data from raw HTML using specialized language models.
                        Identifies restaurant information patterns and converts unstructured data.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-check-double text-white text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Schema Validator Agent</h4>
                      <p className="text-sm text-gray-600">
                        Validates extracted data against the unified schema. Ensures data quality,
                        completeness, and accuracy before storage.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-brain text-white text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Gemini LLM Agent</h4>
                      <p className="text-sm text-gray-600">
                        Handles complex data synthesis and ambiguity resolution using Google's Gemini.
                        Resolves conflicts between data sources and enhances incomplete records.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getAgentIcon(type: string): string {
  switch (type) {
    case "web-scraper": return "fas fa-spider";
    case "data-extractor": return "fas fa-database";
    case "schema-validator": return "fas fa-check-double";
    case "gemini-llm": return "fas fa-brain";
    default: return "fas fa-cog";
  }
}

function getAgentIconColor(type: string): string {
  switch (type) {
    case "web-scraper": return "bg-blue-500";
    case "data-extractor": return "bg-purple-500";
    case "schema-validator": return "bg-green-500";
    case "gemini-llm": return "bg-red-500";
    default: return "bg-gray-500";
  }
}

function getAgentDescription(type: string): string {
  switch (type) {
    case "web-scraper": return "Discovers and scrapes restaurant websites";
    case "data-extractor": return "Extracts structured data using SLMs";
    case "schema-validator": return "Validates and standardizes data";
    case "gemini-llm": return "Advanced synthesis and ambiguity resolution";
    default: return "General purpose agent";
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "active":
    case "processing":
      return "default";
    case "error":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active": return "bg-green-100 text-green-800";
    case "processing": return "bg-blue-100 text-blue-800";
    case "error": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes === 0) return "Just now";
  if (diffMinutes === 1) return "1 minute ago";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  
  return date.toLocaleDateString();
}
