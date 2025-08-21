import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Restaurant {
  id: string;
  name: string;
  address: {
    city: string;
    state: string;
    street?: string;
  };
  cuisineTypes: string[];
  contactInfo: {
    phone?: string;
    website?: string;
  };
  status: string;
  extractedAt: string;
  website?: string;
  dataSources: Array<{
    source: string;
    url?: string;
    extractedAt: string;
    reliability: number;
  }>;
}

export default function RecentExtractions() {
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState("24h");

  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/dashboard/recent-extractions"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const deleteRestaurantMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/restaurants/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Restaurant Deleted",
        description: "Restaurant has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-extractions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete restaurant.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this restaurant?")) {
      deleteRestaurantMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Extractions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 w-32 bg-gray-300 rounded"></div>
                  </div>
                  <div className="h-5 w-16 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Extractions</CardTitle>
          <div className="flex items-center gap-3">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-600">
              Export Data
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto" data-testid="recent-extractions">
        {!restaurants || restaurants.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-inbox text-gray-300 text-4xl mb-4"></i>
            <p className="text-gray-500">No extractions found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Restaurant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Location</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Cuisine</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Sources</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Extracted</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((restaurant) => (
                <tr key={restaurant.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <i className="fas fa-utensils text-orange-600 text-sm"></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900" data-testid={`restaurant-name-${restaurant.id}`}>
                          {restaurant.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {restaurant.website || restaurant.contactInfo.website || "No website"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-gray-900">{restaurant.address.city}, {restaurant.address.state}</p>
                    <p className="text-xs text-gray-500">{restaurant.address.street || ""}</p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {restaurant.cuisineTypes.slice(0, 2).map((cuisine, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className={`text-xs px-2 py-1 rounded ${getCuisineColor(cuisine)}`}
                        >
                          {cuisine}
                        </Badge>
                      ))}
                      {restaurant.cuisineTypes.length > 2 && (
                        <Badge variant="secondary" className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                          +{restaurant.cuisineTypes.length - 2}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      {restaurant.dataSources.map((source, index) => (
                        <span
                          key={index}
                          className={`w-2 h-2 rounded-full ${getSourceColor(source.source)}`}
                          title={source.source}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={restaurant.status === "validated" ? "default" : "secondary"}
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(restaurant.status)}`}
                      data-testid={`restaurant-status-${restaurant.id}`}
                    >
                      {restaurant.status === "validated" ? "Validated" : 
                       restaurant.status === "pending" ? "Pending" : restaurant.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-gray-900">{getTimeAgo(restaurant.extractedAt)}</p>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        title="View Details"
                        data-testid={`button-view-${restaurant.id}`}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        title="Edit"
                        data-testid={`button-edit-${restaurant.id}`}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="text-gray-400 hover:text-red-600"
                        title="Delete"
                        onClick={() => handleDelete(restaurant.id)}
                        disabled={deleteRestaurantMutation.isPending}
                        data-testid={`button-delete-${restaurant.id}`}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {restaurants && restaurants.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">{Math.min(restaurants.length, 10)}</span> of{" "}
              <span className="font-medium">{restaurants.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button size="sm" className="bg-primary-500 text-white hover:bg-primary-600">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <span className="px-2 text-gray-500">...</span>
              <Button variant="outline" size="sm">
                25
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getCuisineColor(cuisine: string): string {
  const colors: Record<string, string> = {
    "North Indian": "bg-red-100 text-red-800",
    "South Indian": "bg-green-100 text-green-800",
    "Chinese": "bg-yellow-100 text-yellow-800",
    "Italian": "bg-purple-100 text-purple-800",
    "Mughlai": "bg-orange-100 text-orange-800",
    "Punjabi": "bg-purple-100 text-purple-800",
    "Vegetarian": "bg-green-100 text-green-800",
    "Continental": "bg-blue-100 text-blue-800",
  };
  return colors[cuisine] || "bg-gray-100 text-gray-800";
}

function getSourceColor(source: string): string {
  const colors: Record<string, string> = {
    "web-scraping": "bg-blue-500",
    "google-places": "bg-green-500",
    "zomato": "bg-red-500",
    "swiggy": "bg-purple-500",
    "government-data": "bg-blue-500",
  };
  return colors[source] || "bg-gray-500";
}

function getStatusColor(status: string): string {
  switch (status) {
    case "validated": return "bg-green-100 text-green-800";
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "failed": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes === 0) return "Just now";
  if (diffMinutes === 1) return "1 min ago";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
}
