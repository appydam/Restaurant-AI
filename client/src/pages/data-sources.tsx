import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DataSource {
  id: string;
  name: string;
  type: string;
  url?: string;
  config: any;
  status: string;
  lastSync?: string;
  totalRecords: number;
  successRate: number;
  createdAt: string;
}

export default function DataSources() {
  const { toast } = useToast();

  const { data: dataSources, isLoading } = useQuery<DataSource[]>({
    queryKey: ["/api/data-sources"],
    refetchInterval: 10000,
  });

  return (
    <div className="flex-1 overflow-hidden" data-testid="data-sources-page">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Data Sources</h2>
            <p className="text-gray-600">Manage and monitor data input sources for the pipeline</p>
          </div>
          <Button className="bg-primary-500 hover:bg-primary-600 text-white">
            <i className="fas fa-plus mr-2"></i>
            Add Data Source
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto h-full">
        {/* Data Sources Grid */}
        <div className="space-y-6" data-testid="data-sources-list">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-5 w-48 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 w-32 bg-gray-300 rounded"></div>
                    </div>
                    <div className="h-6 w-16 bg-gray-300 rounded"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-gray-300 rounded"></div>
                    <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            dataSources?.map((source) => (
              <Card key={source.id} className="bg-white">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${getSourceIconColor(source.type)} rounded-lg flex items-center justify-center`}>
                      <i className={`${getSourceIcon(source.type)} ${getSourceIconTextColor(source.type)} text-xl`}></i>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {source.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {getSourceTypeDisplay(source.type)} 
                        {source.url && ` • ${source.url}`}
                      </p>
                    </div>
                    <Badge
                      variant={source.status === "active" ? "default" : "secondary"}
                      className={getStatusColor(source.status)}
                      data-testid={`source-status-${source.id}`}
                    >
                      {source.status === "active" ? "Active" : source.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {source.totalRecords?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-500">Total Records</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {parseFloat(source.successRate?.toString() || "0").toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">Success Rate</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {getTimeAgo(source.lastSync || source.createdAt)}
                      </div>
                      <div className="text-sm text-gray-500">Last Sync</div>
                    </div>
                  </div>

                  {/* Configuration Details */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-blue-800 mb-2">Configuration</h4>
                    <div className="text-sm text-blue-700">
                      {getConfigurationSummary(source.type, source.config)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Created: {new Date(source.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-sync-${source.id}`}
                      >
                        <i className="fas fa-sync mr-1"></i>
                        Sync Now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-configure-${source.id}`}
                      >
                        <i className="fas fa-cog mr-1"></i>
                        Configure
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-test-${source.id}`}
                      >
                        <i className="fas fa-flask mr-1"></i>
                        Test
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add New Source Form */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Add New Data Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-2 border-dashed border-gray-300 hover:border-primary-500 cursor-pointer transition-colors">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <i className="fas fa-globe text-orange-600 text-xl"></i>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Website Scraping</h4>
                  <p className="text-sm text-gray-500">Add restaurant websites</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-dashed border-gray-300 hover:border-primary-500 cursor-pointer transition-colors">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <i className="fas fa-cloud text-blue-600 text-xl"></i>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">API Integration</h4>
                  <p className="text-sm text-gray-500">Connect to external APIs</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-dashed border-gray-300 hover:border-primary-500 cursor-pointer transition-colors">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <i className="fas fa-file-csv text-purple-600 text-xl"></i>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Dataset Upload</h4>
                  <p className="text-sm text-gray-500">Upload CSV/JSON files</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-dashed border-gray-300 hover:border-primary-500 cursor-pointer transition-colors">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <i className="fas fa-database text-green-600 text-xl"></i>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Database Connection</h4>
                  <p className="text-sm text-gray-500">Connect to databases</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Source Types Documentation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Supported Data Source Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Web Scraping Sources</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Restaurant websites and online menus</li>
                      <li>• Review platforms (Zomato, Swiggy, TripAdvisor)</li>
                      <li>• Local business directories</li>
                      <li>• Social media pages and profiles</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">API Integrations</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Google Places API</li>
                      <li>• Foursquare Venues API</li>
                      <li>• Yelp Fusion API</li>
                      <li>• OpenStreetMap Overpass API</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Public Datasets</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Government food licensing databases</li>
                      <li>• Municipal business registries</li>
                      <li>• Tourism board restaurant lists</li>
                      <li>• Industry association directories</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">File Uploads</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• CSV restaurant data files</li>
                      <li>• JSON structured data exports</li>
                      <li>• Excel spreadsheets</li>
                      <li>• XML data feeds</li>
                    </ul>
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

function getSourceIcon(type: string): string {
  switch (type) {
    case "web-scraping": return "fas fa-globe";
    case "api": return "fas fa-map-marker-alt";
    case "dataset": return "fas fa-file-alt";
    case "database": return "fas fa-database";
    default: return "fas fa-file";
  }
}

function getSourceIconColor(type: string): string {
  switch (type) {
    case "web-scraping": return "bg-orange-100";
    case "api": return "bg-blue-100";
    case "dataset": return "bg-purple-100";
    case "database": return "bg-green-100";
    default: return "bg-gray-100";
  }
}

function getSourceIconTextColor(type: string): string {
  switch (type) {
    case "web-scraping": return "text-orange-600";
    case "api": return "text-blue-600";
    case "dataset": return "text-purple-600";
    case "database": return "text-green-600";
    default: return "text-gray-600";
  }
}

function getSourceTypeDisplay(type: string): string {
  switch (type) {
    case "web-scraping": return "Web Scraping";
    case "api": return "API Integration";
    case "dataset": return "Public Dataset";
    case "database": return "Database Connection";
    default: return type;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active": return "bg-green-100 text-green-800";
    case "inactive": return "bg-gray-100 text-gray-800";
    case "error": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getConfigurationSummary(type: string, config: any): string {
  switch (type) {
    case "web-scraping":
      return `Crawl depth: ${config?.crawlDepth || 2}, Respect robots.txt: ${config?.respectRobots ? "Yes" : "No"}`;
    case "api":
      return `API Key configured: ${config?.apiKey ? "Yes" : "No"}, Fields: ${config?.fields || "all"}`;
    case "dataset":
      return `Format: ${config?.format || "CSV"}, Update frequency: ${config?.updateFrequency || "manual"}`;
    default:
      return "Default configuration";
  }
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours === 0) return "Just now";
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
}
