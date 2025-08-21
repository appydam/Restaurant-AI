import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QueueItem {
  id: string;
  restaurantName: string;
  sourceUrl?: string;
  location: string;
  status: string;
  startedAt?: string;
  createdAt: string;
}

export default function ProcessingQueue() {
  const { data: queue, isLoading } = useQuery<QueueItem[]>({
    queryKey: ["/api/dashboard/processing-queue"],
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Current Processing Queue
            </CardTitle>
            <div className="animate-pulse">
              <div className="h-4 w-12 bg-gray-300 rounded"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-300 rounded mb-1"></div>
                <div className="h-3 w-24 bg-gray-300 rounded"></div>
              </div>
              <div className="flex flex-col items-end">
                <div className="h-5 w-16 bg-gray-300 rounded mb-1"></div>
                <div className="h-3 w-12 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!queue || queue.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Current Processing Queue
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Idle</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-inbox text-gray-300 text-4xl mb-4"></i>
            <p className="text-gray-500">No items currently in queue</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeItems = queue.filter(item => item.status !== "completed" && item.status !== "failed");

  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Current Processing Queue
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600">Live</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4" data-testid="processing-queue">
        {activeItems.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="fas fa-utensils text-blue-600 text-sm"></i>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-900">{item.restaurantName}</p>
              <p className="text-xs text-gray-500">
                {item.location}
                {item.sourceUrl && ` • ${getDomainFromUrl(item.sourceUrl)}`}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <Badge
                variant={getStatusVariant(item.status)}
                className={`text-xs ${getStatusColor(item.status)}`}
                data-testid={`queue-status-${item.id}`}
              >
                {getStatusDisplay(item.status)}
              </Badge>
              <span className="text-xs text-gray-400 mt-1">
                {getTimeAgo(item.startedAt || item.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "completed":
      return "default";
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "scraping":
      return "text-blue-600 bg-blue-50";
    case "extracting":
      return "text-purple-600 bg-purple-50";
    case "validating":
      return "text-orange-600 bg-orange-50";
    case "llm_processing":
      return "text-red-600 bg-red-50";
    case "completed":
      return "text-green-600 bg-green-50";
    case "failed":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

function getStatusDisplay(status: string): string {
  switch (status) {
    case "scraping":
      return "Scraping";
    case "extracting":
      return "Extracting";
    case "validating":
      return "Validating";
    case "llm_processing":
      return "LLM Review";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "Queued";
  }
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffMinutes === 0) {
    return `${diffSeconds}s`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ${diffSeconds % 60}s`;
  } else {
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m`;
  }
}
