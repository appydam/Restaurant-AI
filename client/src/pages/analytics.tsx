import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface AnalyticsData {
  totalRestaurants: number;
  activeAgents: number;
  processingRate: number;
  successRate: number;
  extractionTrends: Array<{
    date: string;
    successful: number;
    failed: number;
  }>;
  agentPerformance: Array<{
    agentName: string;
    requestsToday: number;
    successRate: number;
    avgResponseTime: number;
  }>;
  sourceDistribution: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("extractions");

  const { data: metrics } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 30000,
  });

  const { data: agents } = useQuery({
    queryKey: ["/api/dashboard/agents"],
    refetchInterval: 5000,
  });

  const { data: logs } = useQuery({
    queryKey: ["/api/logs/extractions", { limit: 100 }],
  });

  return (
    <div className="flex-1 overflow-hidden" data-testid="analytics-page">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
            <p className="text-gray-600">Performance metrics and trends for the extraction pipeline</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto h-full">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
            <TabsTrigger value="sources" data-testid="tab-sources">Data Sources</TabsTrigger>
            <TabsTrigger value="quality" data-testid="tab-quality">Data Quality</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Processed</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {metrics?.totalRestaurants?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-chart-line text-blue-600 text-xl"></i>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-sm">
                    <i className="fas fa-arrow-up text-green-500"></i>
                    <span className="text-green-600">+12.5%</span>
                    <span className="text-gray-500">from last period</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Success Rate</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {parseFloat(metrics?.successRate?.toString() || "0").toFixed(1)}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-check-circle text-green-600 text-xl"></i>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-sm">
                    <i className="fas fa-arrow-up text-green-500"></i>
                    <span className="text-green-600">+2.1%</span>
                    <span className="text-gray-500">improvement</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Avg Processing Time</p>
                      <p className="text-3xl font-bold text-gray-900">2.4s</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-clock text-purple-600 text-xl"></i>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-sm">
                    <i className="fas fa-arrow-down text-green-500"></i>
                    <span className="text-green-600">-0.3s</span>
                    <span className="text-gray-500">faster</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Agents</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {metrics?.activeAgents || "0"}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-robot text-orange-600 text-xl"></i>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">All operational</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trends Chart Placeholder */}
            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Extraction Trends
                  </CardTitle>
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="extractions">Extractions</SelectItem>
                      <SelectItem value="success-rate">Success Rate</SelectItem>
                      <SelectItem value="processing-time">Processing Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <i className="fas fa-chart-area text-gray-300 text-4xl mb-4"></i>
                    <p className="text-gray-500">Chart visualization would be implemented here</p>
                    <p className="text-gray-400 text-sm">Integration with charting library like Chart.js or Recharts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Agent Performance */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Agent Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-testid="agent-performance">
                    {agents?.map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 ${getAgentIconColor(agent.type)} rounded-lg flex items-center justify-center`}>
                            <i className={`${getAgentIcon(agent.type)} text-white text-sm`}></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{agent.name}</p>
                            <p className="text-sm text-gray-500">
                              {agent.metrics?.requestsToday || 0} requests today
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {parseFloat(agent.metrics?.successRate?.toString() || "0").toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {(agent.metrics?.avgResponseTime || 0).toFixed(1)}s avg
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Processing Bottlenecks */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Processing Bottlenecks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <i className="fas fa-exclamation-triangle text-yellow-500 mt-1"></i>
                        <div>
                          <h4 className="font-medium text-yellow-800">Web Scraping Rate Limits</h4>
                          <p className="text-yellow-700 text-sm">Some websites are rate limiting requests</p>
                          <p className="text-yellow-600 text-xs mt-1">Recommendation: Implement backoff strategy</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                        <div>
                          <h4 className="font-medium text-blue-800">Schema Validation Load</h4>
                          <p className="text-blue-700 text-sm">High validation processing during peak hours</p>
                          <p className="text-blue-600 text-xs mt-1">Suggestion: Scale validation agents</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <i className="fas fa-check-circle text-green-500 mt-1"></i>
                        <div>
                          <h4 className="font-medium text-green-800">Gemini LLM Performance</h4>
                          <p className="text-green-700 text-sm">Optimal response times and accuracy</p>
                          <p className="text-green-600 text-xs mt-1">Status: Operating efficiently</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Metrics Table */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Detailed Agent Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Agent</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Requests</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Success Rate</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Time</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Errors</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents?.map((agent) => (
                        <tr key={agent.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 ${getAgentIconColor(agent.type)} rounded flex items-center justify-center`}>
                                <i className={`${getAgentIcon(agent.type)} text-white text-xs`}></i>
                              </div>
                              <span className="font-medium">{agent.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{agent.metrics?.requestsToday || 0}</td>
                          <td className="py-3 px-4">
                            <span className="text-green-600 font-medium">
                              {agent.metrics?.successRate?.toFixed(1) || 0}%
                            </span>
                          </td>
                          <td className="py-3 px-4">{agent.metrics?.avgResponseTime?.toFixed(1) || 0}s</td>
                          <td className="py-3 px-4">{agent.metrics?.errorCount || 0}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(agent.status)}`}></div>
                              {agent.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Sources Tab */}
          <TabsContent value="sources" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Source Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-orange-500 rounded"></div>
                        <span className="text-gray-700">Web Scraping</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">8,245</span>
                        <span className="text-gray-500 text-sm ml-1">(45%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: "45%" }}></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-gray-700">Google Places</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">6,123</span>
                        <span className="text-gray-500 text-sm ml-1">(33%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "33%" }}></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-purple-500 rounded"></div>
                        <span className="text-gray-700">Public Datasets</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">2,890</span>
                        <span className="text-gray-500 text-sm ml-1">(16%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: "16%" }}></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-gray-700">Review Platforms</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">1,124</span>
                        <span className="text-gray-500 text-sm ml-1">(6%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "6%" }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Source Reliability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-green-800">Google Places API</span>
                        <span className="text-green-600 font-semibold">98.9%</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "98.9%" }}></div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-blue-800">Restaurant Websites</span>
                        <span className="text-blue-600 font-semibold">94.7%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "94.7%" }}></div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-yellow-800">Public Datasets</span>
                        <span className="text-yellow-600 font-semibold">89.3%</span>
                      </div>
                      <div className="w-full bg-yellow-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "89.3%" }}></div>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-purple-800">Review Platforms</span>
                        <span className="text-purple-600 font-semibold">92.1%</span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: "92.1%" }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Quality Tab */}
          <TabsContent value="quality" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Overall Quality Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">92.4</div>
                    <p className="text-gray-500 mb-4">Out of 100</p>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-green-500 h-3 rounded-full" style={{ width: "92.4%" }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Completeness Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">89.3</div>
                    <p className="text-gray-500 mb-4">Percentage</p>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-blue-500 h-3 rounded-full" style={{ width: "89.3%" }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Accuracy Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">94.7</div>
                    <p className="text-gray-500 mb-4">Percentage</p>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-purple-500 h-3 rounded-full" style={{ width: "94.7%" }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Field Completion Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">High Completion Rate ({'>'}90%)</h4>
                    <div className="space-y-3">
                      <FieldCompletion field="name" rate={99.8} />
                      <FieldCompletion field="address.city" rate={99.5} />
                      <FieldCompletion field="address.state" rate={99.2} />
                      <FieldCompletion field="cuisine_types" rate={96.7} />
                      <FieldCompletion field="price_range" rate={94.3} />
                      <FieldCompletion field="ratings.average" rate={91.2} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Needs Improvement ({'<'}90%)</h4>
                    <div className="space-y-3">
                      <FieldCompletion field="contact_info.phone" rate={87.4} color="yellow" />
                      <FieldCompletion field="operating_hours" rate={85.9} color="yellow" />
                      <FieldCompletion field="address.coordinates" rate={72.1} color="red" />
                      <FieldCompletion field="contact_info.email" rate={68.3} color="red" />
                      <FieldCompletion field="amenities" rate={76.8} color="yellow" />
                      <FieldCompletion field="description" rate={58.2} color="red" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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

function getStatusColor(status: string): string {
  switch (status) {
    case "active": return "bg-green-100 text-green-800";
    case "processing": return "bg-blue-100 text-blue-800";
    case "error": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getStatusDotColor(status: string): string {
  switch (status) {
    case "active": return "bg-green-500";
    case "processing": return "bg-blue-500";
    case "error": return "bg-red-500";
    default: return "bg-gray-500";
  }
}

function FieldCompletion({ field, rate, color = "green" }: { field: string; rate: number; color?: "green" | "yellow" | "red" }) {
  const colorClasses = {
    green: "bg-green-500",
    yellow: "bg-yellow-500", 
    red: "bg-red-500"
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <code className="font-mono text-blue-600">{field}</code>
        <span className="font-medium">{rate}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className={`${colorClasses[color]} h-1.5 rounded-full`}
          style={{ width: `${rate}%` }}
        ></div>
      </div>
    </div>
  );
}
