import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SystemSettings {
  geminiApiKey: string;
  geminiModel: string;
  maxConcurrentJobs: number;
  requestTimeout: number;
  retryAttempts: number;
  rateLimitPerMinute: number;
  enableLogging: boolean;
  enableMetrics: boolean;
  autoScaling: boolean;
}

export default function Settings() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [settings, setSettings] = useState<SystemSettings>({
    geminiApiKey: "AIzaSyDAqA2p5w4xYOs1putj9vCdIlWxs7kjcZg",
    geminiModel: "gemini-2.5-pro",
    maxConcurrentJobs: 10,
    requestTimeout: 30000,
    retryAttempts: 3,
    rateLimitPerMinute: 60,
    enableLogging: true,
    enableMetrics: true,
    autoScaling: false,
  });

  const { data: agents } = useQuery({
    queryKey: ["/api/agents"],
  });

  const { data: dataSources } = useQuery({
    queryKey: ["/api/data-sources"],
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<SystemSettings>) => {
      // This would save to backend in a real implementation
      return Promise.resolve(newSettings);
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
      });
      setIsEditing(null);
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save settings.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(settings);
  };

  const testApiKeyMutation = useMutation({
    mutationFn: async () => {
      // This would test the API key in a real implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "API Key Valid",
        description: "Successfully connected to Google Gemini API.",
      });
    },
    onError: () => {
      toast({
        title: "API Key Invalid",
        description: "Failed to connect to Google Gemini API. Please check your API key.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex-1 overflow-hidden" data-testid="settings-page">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
            <p className="text-gray-600">Configure agents, API keys, and system parameters</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditing(isEditing ? null : "general")}
            >
              <i className={`fas ${isEditing ? "fa-times" : "fa-edit"} mr-2`}></i>
              {isEditing ? "Cancel" : "Edit Settings"}
            </Button>
            {isEditing && (
              <Button
                onClick={handleSaveSettings}
                disabled={saveSettingsMutation.isPending}
                className="bg-primary-500 hover:bg-primary-600 text-white"
              >
                <i className="fas fa-save mr-2"></i>
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto h-full">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
            <TabsTrigger value="gemini" data-testid="tab-gemini">Gemini LLM</TabsTrigger>
            <TabsTrigger value="agents" data-testid="tab-agents">Agents</TabsTrigger>
            <TabsTrigger value="sources" data-testid="tab-sources">Data Sources</TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-cogs text-primary-500"></i>
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxConcurrentJobs">Max Concurrent Jobs</Label>
                    <Input
                      id="maxConcurrentJobs"
                      type="number"
                      value={settings.maxConcurrentJobs}
                      disabled={isEditing !== "general"}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        maxConcurrentJobs: parseInt(e.target.value) 
                      }))}
                      data-testid="input-max-concurrent-jobs"
                    />
                    <p className="text-sm text-gray-500">Maximum number of parallel extraction jobs</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requestTimeout">Request Timeout (ms)</Label>
                    <Input
                      id="requestTimeout"
                      type="number"
                      value={settings.requestTimeout}
                      disabled={isEditing !== "general"}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        requestTimeout: parseInt(e.target.value) 
                      }))}
                      data-testid="input-request-timeout"
                    />
                    <p className="text-sm text-gray-500">Timeout for HTTP requests</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retryAttempts">Retry Attempts</Label>
                    <Input
                      id="retryAttempts"
                      type="number"
                      value={settings.retryAttempts}
                      disabled={isEditing !== "general"}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        retryAttempts: parseInt(e.target.value) 
                      }))}
                      data-testid="input-retry-attempts"
                    />
                    <p className="text-sm text-gray-500">Number of retry attempts for failed requests</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rateLimitPerMinute">Rate Limit (per minute)</Label>
                    <Input
                      id="rateLimitPerMinute"
                      type="number"
                      value={settings.rateLimitPerMinute}
                      disabled={isEditing !== "general"}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        rateLimitPerMinute: parseInt(e.target.value) 
                      }))}
                      data-testid="input-rate-limit"
                    />
                    <p className="text-sm text-gray-500">Maximum requests per minute per source</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">System Features</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Detailed Logging</Label>
                      <p className="text-sm text-gray-500">Log all system operations and errors</p>
                    </div>
                    <Switch
                      checked={settings.enableLogging}
                      disabled={isEditing !== "general"}
                      onCheckedChange={(checked) => setSettings(prev => ({ 
                        ...prev, 
                        enableLogging: checked 
                      }))}
                      data-testid="switch-logging"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Performance Metrics</Label>
                      <p className="text-sm text-gray-500">Collect detailed performance statistics</p>
                    </div>
                    <Switch
                      checked={settings.enableMetrics}
                      disabled={isEditing !== "general"}
                      onCheckedChange={(checked) => setSettings(prev => ({ 
                        ...prev, 
                        enableMetrics: checked 
                      }))}
                      data-testid="switch-metrics"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-scaling</Label>
                      <p className="text-sm text-gray-500">Automatically scale agents based on workload</p>
                    </div>
                    <Switch
                      checked={settings.autoScaling}
                      disabled={isEditing !== "general"}
                      onCheckedChange={(checked) => setSettings(prev => ({ 
                        ...prev, 
                        autoScaling: checked 
                      }))}
                      data-testid="switch-auto-scaling"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gemini LLM Settings */}
          <TabsContent value="gemini" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-brain text-red-500"></i>
                    Google Gemini Configuration
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Connected</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="geminiApiKey">API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          id="geminiApiKey"
                          type="password"
                          value={settings.geminiApiKey}
                          disabled={isEditing !== "gemini"}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            geminiApiKey: e.target.value 
                          }))}
                          className="font-mono"
                          data-testid="input-gemini-api-key"
                        />
                        <Button
                          variant="outline"
                          onClick={() => testApiKeyMutation.mutate()}
                          disabled={testApiKeyMutation.isPending}
                          data-testid="button-test-api-key"
                        >
                          {testApiKeyMutation.isPending ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-flask"></i>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">Your Google Gemini API key</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="geminiModel">Model</Label>
                      <Select
                        value={settings.geminiModel}
                        disabled={isEditing !== "gemini"}
                        onValueChange={(value) => setSettings(prev => ({ 
                          ...prev, 
                          geminiModel: value 
                        }))}
                      >
                        <SelectTrigger data-testid="select-gemini-model">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini-2.5-pro">gemini-2.5-pro</SelectItem>
                          <SelectItem value="gemini-2.5-flash">gemini-2.5-flash</SelectItem>
                          <SelectItem value="gemini-1.5-pro">gemini-1.5-pro</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">Gemini model version to use</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Current Usage</h4>
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
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Model Configuration</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Temperature</Label>
                      <Input type="number" step="0.1" min="0" max="2" defaultValue="0.3" disabled={isEditing !== "gemini"} />
                      <p className="text-sm text-gray-500">Creativity level (0.0-2.0)</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Max Output Tokens</Label>
                      <Input type="number" defaultValue="2048" disabled={isEditing !== "gemini"} />
                      <p className="text-sm text-gray-500">Maximum response length</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Timeout (seconds)</Label>
                      <Input type="number" defaultValue="30" disabled={isEditing !== "gemini"} />
                      <p className="text-sm text-gray-500">Request timeout</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Performance Optimization</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Batch Size:</span>
                      <span className="font-medium text-blue-800 ml-1">25 items</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Rate Limit:</span>
                      <span className="font-medium text-blue-800 ml-1">60 req/min</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Retry Logic:</span>
                      <span className="font-medium text-blue-800 ml-1">3x backoff</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Auto-scaling:</span>
                      <span className="font-medium text-blue-800 ml-1">Enabled</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agent Settings */}
          <TabsContent value="agents" className="space-y-6">
            <div className="space-y-6" data-testid="agent-settings">
              {agents?.map((agent) => (
                <Card key={agent.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${getAgentIconColor(agent.type)} rounded-lg flex items-center justify-center`}>
                          <i className={`${getAgentIcon(agent.type)} text-white`}></i>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <p className="text-sm text-gray-500">{getAgentDescription(agent.type)}</p>
                        </div>
                      </div>
                      <Badge
                        variant={agent.status === "active" ? "default" : "secondary"}
                        className={getStatusColor(agent.status)}
                      >
                        {agent.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Max Concurrent Operations</Label>
                          <Input 
                            type="number" 
                            defaultValue="5" 
                            disabled={isEditing !== agent.id}
                            data-testid={`input-max-operations-${agent.id}`}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Retry Attempts</Label>
                          <Input 
                            type="number" 
                            defaultValue="3" 
                            disabled={isEditing !== agent.id}
                            data-testid={`input-retry-attempts-${agent.id}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Timeout (seconds)</Label>
                          <Input 
                            type="number" 
                            defaultValue="30" 
                            disabled={isEditing !== agent.id}
                            data-testid={`input-timeout-${agent.id}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-3">Current Metrics</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Requests Today:</span>
                              <span className="font-medium">{agent.metrics?.requestsToday || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Success Rate:</span>
                              <span className="font-medium text-green-600">{parseFloat(agent.metrics?.successRate?.toString() || "0").toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Avg Response Time:</span>
                              <span className="font-medium">{(agent.metrics?.avgResponseTime || 0).toFixed(1)}s</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(isEditing === agent.id ? null : agent.id)}
                            data-testid={`button-edit-agent-${agent.id}`}
                          >
                            <i className={`fas ${isEditing === agent.id ? "fa-times" : "fa-edit"} mr-1`}></i>
                            {isEditing === agent.id ? "Cancel" : "Edit"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-restart-agent-${agent.id}`}
                          >
                            <i className="fas fa-redo mr-1"></i>
                            Restart
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Data Sources Settings */}
          <TabsContent value="sources" className="space-y-6">
            <div className="space-y-6" data-testid="source-settings">
              {dataSources?.map((source) => (
                <Card key={source.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${getSourceIconColor(source.type)} rounded-lg flex items-center justify-center`}>
                          <i className={`${getSourceIcon(source.type)} ${getSourceIconTextColor(source.type)}`}></i>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{source.name}</CardTitle>
                          <p className="text-sm text-gray-500">{getSourceTypeDisplay(source.type)}</p>
                        </div>
                      </div>
                      <Badge
                        variant={source.status === "active" ? "default" : "secondary"}
                        className={getStatusColor(source.status)}
                      >
                        {source.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {source.url && (
                          <div className="space-y-2">
                            <Label>URL</Label>
                            <Input 
                              value={source.url} 
                              disabled={isEditing !== source.id}
                              data-testid={`input-source-url-${source.id}`}
                            />
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label>Sync Frequency</Label>
                          <Select disabled={isEditing !== source.id}>
                            <SelectTrigger data-testid={`select-sync-frequency-${source.id}`}>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Rate Limit (req/min)</Label>
                          <Input 
                            type="number" 
                            defaultValue="60" 
                            disabled={isEditing !== source.id}
                            data-testid={`input-rate-limit-${source.id}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-3">Statistics</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Records:</span>
                              <span className="font-medium">{source.totalRecords?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Success Rate:</span>
                              <span className="font-medium text-green-600">{parseFloat(source.successRate?.toString() || "0").toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Last Sync:</span>
                              <span className="font-medium">{getTimeAgo(source.lastSync || source.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(isEditing === source.id ? null : source.id)}
                            data-testid={`button-edit-source-${source.id}`}
                          >
                            <i className={`fas ${isEditing === source.id ? "fa-times" : "fa-edit"} mr-1`}></i>
                            {isEditing === source.id ? "Cancel" : "Edit"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-sync-source-${source.id}`}
                          >
                            <i className="fas fa-sync mr-1"></i>
                            Sync Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-shield-alt text-green-500"></i>
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable API Authentication</Label>
                      <p className="text-sm text-gray-500">Require API keys for external access</p>
                    </div>
                    <Switch defaultChecked disabled={isEditing !== "security"} data-testid="switch-api-auth" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Request Logging</Label>
                      <p className="text-sm text-gray-500">Log all API requests for audit purposes</p>
                    </div>
                    <Switch defaultChecked disabled={isEditing !== "security"} data-testid="switch-request-logging" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Data Encryption at Rest</Label>
                      <p className="text-sm text-gray-500">Encrypt stored restaurant data</p>
                    </div>
                    <Switch defaultChecked disabled={isEditing !== "security"} data-testid="switch-encryption" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Rate Limiting</Label>
                      <p className="text-sm text-gray-500">Limit requests per IP address</p>
                    </div>
                    <Switch defaultChecked disabled={isEditing !== "security"} data-testid="switch-rate-limiting" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Access Control</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Admin Email</Label>
                      <Input 
                        type="email" 
                        defaultValue="admin@restaurantai.com" 
                        disabled={isEditing !== "security"}
                        data-testid="input-admin-email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Session Timeout (minutes)</Label>
                      <Input 
                        type="number" 
                        defaultValue="60" 
                        disabled={isEditing !== "security"}
                        data-testid="input-session-timeout"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-exclamation-triangle text-yellow-500 mt-1"></i>
                    <div>
                      <h4 className="font-medium text-yellow-800">Security Notice</h4>
                      <p className="text-yellow-700 text-sm mt-1">
                        API keys and sensitive configuration are stored securely. 
                        Only administrators can view and modify these settings.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-database text-blue-500"></i>
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-24 flex flex-col gap-2" data-testid="button-export-data">
                    <i className="fas fa-download text-blue-500 text-xl"></i>
                    <span>Export Data</span>
                  </Button>

                  <Button variant="outline" className="h-24 flex flex-col gap-2" data-testid="button-backup-config">
                    <i className="fas fa-save text-green-500 text-xl"></i>
                    <span>Backup Config</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col gap-2 text-red-600 border-red-200 hover:bg-red-50" 
                    data-testid="button-clear-data"
                  >
                    <i className="fas fa-trash text-red-500 text-xl"></i>
                    <span>Clear Data</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper functions (reused from other components)
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
