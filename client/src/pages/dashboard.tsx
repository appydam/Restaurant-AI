import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import MetricsCard from "@/components/metrics-card";
import ProcessingQueue from "@/components/processing-queue";
import RecentExtractions from "@/components/recent-extractions";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface PipelineMetrics {
  totalRestaurants: number;
  activeAgents: number;
  processingRate: number;
  successRate: number;
  lastUpdate: string;
}

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
  };
}

interface DataSource {
  id: string;
  name: string;
  type: string;
  url?: string;
  status: string;
  totalRecords: number;
  successRate: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery<PipelineMetrics>({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: agents, isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["/api/dashboard/agents"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: dataSources } = useQuery<DataSource[]>({
    queryKey: ["/api/data-sources"],
  });

  const startExtractionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/extraction/start", {});
    },
    onSuccess: () => {
      toast({
        title: "Extraction Started",
        description: "The data extraction pipeline has been started successfully.",
      });
      // Refresh relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/extraction"] });
    },
    onError: (error: any) => {
      toast({
        title: "Extraction Failed",
        description: error.message || "Failed to start extraction pipeline.",
        variant: "destructive",
      });
    },
  });

  const handleStartExtraction = async () => {
    setIsStarting(true);
    try {
      await startExtractionMutation.mutateAsync();
    } finally {
      setTimeout(() => setIsStarting(false), 3000);
    }
  };

  const getLastUpdateText = (lastUpdate?: string) => {
    if (!lastUpdate) return "Never";
    const date = new Date(lastUpdate);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes === 0) return "Just now";
    if (diffMinutes === 1) return "1 minute ago";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex-1 overflow-hidden" data-testid="dashboard">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pipeline Dashboard</h2>
            <p className="text-gray-600">Monitor and manage restaurant data extraction pipeline</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <i className="fas fa-clock text-gray-400"></i>
              <span data-testid="last-update">
                Last updated: {getLastUpdateText(metrics?.lastUpdate)}
              </span>
            </div>
            <Button
              onClick={handleStartExtraction}
              disabled={isStarting || startExtractionMutation.isPending}
              className="bg-primary-500 hover:bg-primary-600 text-white flex items-center gap-2"
              data-testid="button-start-extraction"
            >
              <i className={`fas ${isStarting ? "fa-spinner fa-spin" : "fa-play"}`}></i>
              <span>{isStarting ? "Starting..." : "Start Extraction"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 overflow-y-auto h-full">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Restaurants Extracted"
            value={metricsLoading ? "..." : (metrics?.totalRestaurants?.toLocaleString() || "0")}
            icon="fas fa-utensils"
            iconColor="bg-green-100 text-green-600"
            change={{ value: "+2.5%", type: "positive" }}
            subtitle="from yesterday"
          />
          <MetricsCard
            title="Active Agents"
            value={metricsLoading ? "..." : (metrics?.activeAgents || "0")}
            icon="fas fa-robot"
            iconColor="bg-blue-100 text-blue-600"
            subtitle="All systems operational"
          />
          <MetricsCard
            title="Processing Rate"
            value={metricsLoading ? "..." : (metrics?.processingRate || "0")}
            icon="fas fa-tachometer-alt"
            iconColor="bg-purple-100 text-purple-600"
            subtitle="restaurants/hour"
          />
          <MetricsCard
            title="Success Rate"
            value={metricsLoading ? "..." : `${parseFloat(metrics?.successRate?.toString() || "0").toFixed(1)}%`}
            icon="fas fa-check-circle"
            iconColor="bg-orange-100 text-orange-600"
            change={{ value: "+1.2%", type: "positive" }}
            subtitle="from last week"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Agent Architecture Overview */}
          <Card className="bg-white rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Multi-Agent Architecture
                </CardTitle>
                <Button variant="link" className="text-primary-500 hover:text-primary-600 text-sm font-medium p-0">
                  View Details
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4" data-testid="agent-architecture">
              {agentsLoading ? (
                // Loading skeleton
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 w-48 bg-gray-300 rounded"></div>
                    </div>
                    <div className="h-5 w-16 bg-gray-300 rounded-full"></div>
                  </div>
                ))
              ) : (
                agents?.map((agent) => (
                  <div key={agent.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`w-10 h-10 ${getAgentIconColor(agent.type)} rounded-lg flex items-center justify-center`}>
                      <i className={`${getAgentIcon(agent.type)} text-white`}></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{agent.name}</h4>
                      <p className="text-sm text-gray-500">{getAgentDescription(agent.type)}</p>
                    </div>
                    <Badge
                      variant={agent.status === "active" || agent.status === "processing" ? "default" : "secondary"}
                      className={getAgentStatusColor(agent.status)}
                      data-testid={`agent-status-${agent.id}`}
                    >
                      {agent.status === "processing" ? "Processing" : 
                       agent.status === "active" ? "Active" :
                       agent.status === "error" ? "Error" : "Ready"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Real-time Processing Status */}
          <ProcessingQueue />
        </div>

        {/* Data Sources and Schema */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Data Sources */}
          <Card className="bg-white rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Active Data Sources
                </CardTitle>
                <Button className="bg-primary-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-primary-600">
                  Add Source
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4" data-testid="data-sources">
              {dataSources?.map((source) => (
                <div key={source.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className={`w-10 h-10 ${getDataSourceIconColor(source.type)} rounded-lg flex items-center justify-center`}>
                    <i className={`${getDataSourceIcon(source.type)} ${getDataSourceIconTextColor(source.type)}`}></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{source.name}</h4>
                    <p className="text-sm text-gray-500">
                      {source.totalRecords?.toLocaleString() || 0} active sources • {getDataSourceTypeDisplay(source.type)}
                    </p>
                  </div>
                  <Badge
                    variant={source.status === "active" ? "default" : "secondary"}
                    className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                  >
                    {source.status === "active" ? "Active" : source.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Unified Schema */}
          <Card className="bg-white rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Unified Schema
                </CardTitle>
                <Button variant="link" className="text-primary-500 hover:text-primary-600 text-sm font-medium p-0">
                  View Full Schema
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-mono text-sm font-medium text-gray-900 mb-3">Restaurant Schema v2.1</h4>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-blue-600">restaurant_id</span>
                    <span className="text-gray-500">string (UUID)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">name</span>
                    <span className="text-gray-500">string</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">address</span>
                    <span className="text-gray-500">object</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">cuisine_types</span>
                    <span className="text-gray-500">array[string]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">contact_info</span>
                    <span className="text-gray-500">object</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">ratings</span>
                    <span className="text-gray-500">object</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">operating_hours</span>
                    <span className="text-gray-500">object</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">price_range</span>
                    <span className="text-gray-500">enum</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">amenities</span>
                    <span className="text-gray-500">array[string]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">data_sources</span>
                    <span className="text-gray-500">array[object]</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-info-circle text-blue-500"></i>
                  <span className="text-sm font-medium text-blue-800">Schema Statistics</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Completeness:</span>
                    <span className="font-medium text-blue-800 ml-1">89.3%</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Accuracy:</span>
                    <span className="font-medium text-blue-800 ml-1">94.7%</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Fields:</span>
                    <span className="font-medium text-blue-800 ml-1">47 total</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Required:</span>
                    <span className="font-medium text-blue-800 ml-1">12 fields</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LLM Configuration */}
        <Card className="bg-white rounded-lg shadow-sm mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Google Gemini LLM Configuration
                </CardTitle>
                <p className="text-sm text-gray-500">Advanced synthesis and ambiguity resolution agent</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Connected</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">API Configuration</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                        <option>gemini-2.5-pro</option>
                        <option>gemini-2.5-flash</option>
                        <option>gemini-1.5-pro</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Usage Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Requests Today:</span>
                      <span className="font-medium">1,247</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="font-medium text-green-600">98.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg Response Time:</span>
                      <span className="font-medium">1.3s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cost (Today):</span>
                      <span className="font-medium">$24.75</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Agent Responsibilities</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <i className="fas fa-check text-green-500 mt-0.5"></i>
                      <span>Resolve ambiguous restaurant data conflicts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="fas fa-check text-green-500 mt-0.5"></i>
                      <span>Synthesize information from multiple sources</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="fas fa-check text-green-500 mt-0.5"></i>
                      <span>Generate missing cuisine classifications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="fas fa-check text-green-500 mt-0.5"></i>
                      <span>Validate and enhance address information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="fas fa-check text-green-500 mt-0.5"></i>
                      <span>Quality control for final data output</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Performance Optimization</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Batch Size:</span>
                      <span className="font-medium text-blue-800 ml-1">25 items</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Timeout:</span>
                      <span className="font-medium text-blue-800 ml-1">30s</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Rate Limit:</span>
                      <span className="font-medium text-blue-800 ml-1">60 req/min</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Retry Logic:</span>
                      <span className="font-medium text-blue-800 ml-1">3x backoff</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Extractions Table */}
        <RecentExtractions />
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

function getAgentStatusColor(status: string): string {
  switch (status) {
    case "active": return "bg-green-100 text-green-800";
    case "processing": return "bg-blue-100 text-blue-800";
    case "error": return "bg-red-100 text-red-800";
    default: return "bg-green-100 text-green-800";
  }
}

function getDataSourceIcon(type: string): string {
  switch (type) {
    case "web-scraping": return "fas fa-globe";
    case "api": return "fas fa-map-marker-alt";
    case "dataset": return "fas fa-file-alt";
    default: return "fas fa-database";
  }
}

function getDataSourceIconColor(type: string): string {
  switch (type) {
    case "web-scraping": return "bg-orange-100";
    case "api": return "bg-blue-100";
    case "dataset": return "bg-purple-100";
    default: return "bg-gray-100";
  }
}

function getDataSourceIconTextColor(type: string): string {
  switch (type) {
    case "web-scraping": return "text-orange-600";
    case "api": return "text-blue-600";
    case "dataset": return "text-purple-600";
    default: return "text-gray-600";
  }
}

function getDataSourceTypeDisplay(type: string): string {
  switch (type) {
    case "web-scraping": return "Web scraping";
    case "api": return "API integration";
    case "dataset": return "Public dataset";
    default: return type;
  }
}
