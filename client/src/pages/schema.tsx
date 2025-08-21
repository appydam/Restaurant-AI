import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function Schema() {
  return (
    <div className="flex-1 overflow-hidden" data-testid="schema-page">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Unified Schema</h2>
            <p className="text-gray-600">Restaurant data standardization schema and validation rules</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Version 2.1
            </Badge>
            <Button className="bg-primary-500 hover:bg-primary-600 text-white">
              <i className="fas fa-download mr-2"></i>
              Export Schema
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto h-full">
        <Tabs defaultValue="schema" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="schema" data-testid="tab-schema">Schema Definition</TabsTrigger>
            <TabsTrigger value="validation" data-testid="tab-validation">Validation Rules</TabsTrigger>
            <TabsTrigger value="statistics" data-testid="tab-statistics">Statistics</TabsTrigger>
            <TabsTrigger value="examples" data-testid="tab-examples">Examples</TabsTrigger>
          </TabsList>

          {/* Schema Definition Tab */}
          <TabsContent value="schema" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-table text-primary-500"></i>
                  Restaurant Schema Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Core Fields */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Fields</h3>
                    <div className="space-y-4">
                      <SchemaField
                        name="restaurant_id"
                        type="string (UUID)"
                        required={true}
                        description="Unique identifier for the restaurant"
                      />
                      <SchemaField
                        name="name"
                        type="string"
                        required={true}
                        description="Restaurant name as displayed publicly"
                        validation="2-200 characters, no special characters"
                      />
                      <SchemaField
                        name="description"
                        type="string"
                        required={false}
                        description="Brief description of the restaurant"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Address Object */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Object</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-3">
                        <SchemaField
                          name="address.street"
                          type="string"
                          required={false}
                          description="Street address including building number"
                        />
                        <SchemaField
                          name="address.city"
                          type="string"
                          required={true}
                          description="City name"
                        />
                        <SchemaField
                          name="address.state"
                          type="string"
                          required={true}
                          description="State or province"
                        />
                        <SchemaField
                          name="address.postal_code"
                          type="string"
                          required={false}
                          description="Postal or ZIP code"
                          validation="Indian PIN code format (6 digits)"
                        />
                        <SchemaField
                          name="address.country"
                          type="string"
                          required={true}
                          description="Country name (default: India)"
                        />
                        <SchemaField
                          name="address.coordinates"
                          type="object"
                          required={false}
                          description="Latitude and longitude coordinates"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-3">
                        <SchemaField
                          name="contact_info.phone"
                          type="string"
                          required={false}
                          description="Primary phone number"
                          validation="Indian phone number format (+91-xxxxxxxxxx)"
                        />
                        <SchemaField
                          name="contact_info.email"
                          type="string"
                          required={false}
                          description="Primary email address"
                          validation="Valid email format"
                        />
                        <SchemaField
                          name="contact_info.website"
                          type="string (URL)"
                          required={false}
                          description="Official website URL"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Additional Fields */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Fields</h3>
                    <div className="space-y-4">
                      <SchemaField
                        name="cuisine_types"
                        type="array[string]"
                        required={true}
                        description="List of cuisine categories"
                        validation="Minimum 1 item, predefined cuisine types"
                      />
                      <SchemaField
                        name="price_range"
                        type="enum"
                        required={true}
                        description="Price category"
                        validation="One of: budget, mid-range, fine-dining, luxury"
                      />
                      <SchemaField
                        name="ratings"
                        type="object"
                        required={true}
                        description="Aggregated ratings from various sources"
                      />
                      <SchemaField
                        name="operating_hours"
                        type="object"
                        required={true}
                        description="Daily operating hours"
                      />
                      <SchemaField
                        name="amenities"
                        type="array[string]"
                        required={true}
                        description="List of available amenities"
                      />
                      <SchemaField
                        name="data_sources"
                        type="array[object]"
                        required={true}
                        description="Sources from which data was extracted"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation Rules Tab */}
          <TabsContent value="validation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-green-500"></i>
                    Required Field Validation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ValidationRule
                      field="name"
                      rule="Must be 2-200 characters long"
                      severity="error"
                    />
                    <ValidationRule
                      field="address.city"
                      rule="Must not be empty"
                      severity="error"
                    />
                    <ValidationRule
                      field="address.state"
                      rule="Must not be empty"
                      severity="error"
                    />
                    <ValidationRule
                      field="cuisine_types"
                      rule="Must contain at least one item"
                      severity="error"
                    />
                    <ValidationRule
                      field="price_range"
                      rule="Must be one of the allowed values"
                      severity="error"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-exclamation-triangle text-yellow-500"></i>
                    Format Validation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ValidationRule
                      field="contact_info.phone"
                      rule="Must match Indian phone number format"
                      severity="warning"
                    />
                    <ValidationRule
                      field="contact_info.email"
                      rule="Must be valid email address"
                      severity="warning"
                    />
                    <ValidationRule
                      field="address.postal_code"
                      rule="Must be 6-digit Indian PIN code"
                      severity="warning"
                    />
                    <ValidationRule
                      field="ratings.average"
                      rule="Must be between 0.0 and 5.0"
                      severity="warning"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-info-circle text-blue-500"></i>
                    Business Logic Validation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ValidationRule
                      field="operating_hours"
                      rule="Close time must be after open time"
                      severity="error"
                    />
                    <ValidationRule
                      field="ratings.total"
                      rule="Should be provided if average rating exists"
                      severity="warning"
                    />
                    <ValidationRule
                      field="address.coordinates"
                      rule="Latitude must be -90 to 90, longitude -180 to 180"
                      severity="warning"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-lightbulb text-purple-500"></i>
                    Quality Checks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ValidationRule
                      field="completeness"
                      rule="All required fields filled"
                      severity="info"
                    />
                    <ValidationRule
                      field="accuracy"
                      rule="Data consistency across sources"
                      severity="info"
                    />
                    <ValidationRule
                      field="freshness"
                      rule="Recently updated or verified"
                      severity="info"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Schema Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Overall Completeness</span>
                      <span className="font-semibold text-green-600">89.3%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "89.3%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Data Accuracy</span>
                      <span className="font-semibold text-blue-600">94.7%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "94.7%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Validation Success</span>
                      <span className="font-semibold text-purple-600">92.1%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: "92.1%" }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Field Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <FieldStat name="Total Fields" value="47" />
                    <FieldStat name="Required Fields" value="12" />
                    <FieldStat name="Optional Fields" value="35" />
                    <FieldStat name="Nested Objects" value="4" />
                    <FieldStat name="Array Fields" value="3" />
                    <FieldStat name="Enum Fields" value="2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Field Completion Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <FieldCompletionRate field="name" rate={99.8} />
                    <FieldCompletionRate field="address.city" rate={99.5} />
                    <FieldCompletionRate field="address.state" rate={99.2} />
                    <FieldCompletionRate field="cuisine_types" rate={96.7} />
                    <FieldCompletionRate field="price_range" rate={94.3} />
                  </div>
                  <div className="space-y-3">
                    <FieldCompletionRate field="contact_info.phone" rate={87.4} />
                    <FieldCompletionRate field="operating_hours" rate={85.9} />
                    <FieldCompletionRate field="address.coordinates" rate={72.1} />
                    <FieldCompletionRate field="contact_info.email" rate={68.3} />
                    <FieldCompletionRate field="ratings.average" rate={91.2} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-code text-primary-500"></i>
                  Complete Restaurant Record Example
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
{`{
  "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Maharaja Palace Restaurant",
  "description": "Authentic North Indian cuisine in the heart of Mumbai",
  "address": {
    "street": "123 FC Road, Shivajinagar",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "411005",
    "country": "India",
    "coordinates": {
      "lat": 19.0760,
      "lng": 72.8777
    }
  },
  "cuisine_types": ["North Indian", "Mughlai", "Vegetarian"],
  "contact_info": {
    "phone": "+91-98765-43210",
    "email": "info@maharajapalace.in",
    "website": "https://maharajapalace.in"
  },
  "ratings": {
    "average": 4.2,
    "total": 1247,
    "sources": {
      "google": { "rating": 4.1, "count": 567 },
      "zomato": { "rating": 4.3, "count": 423 },
      "website": { "rating": 4.2, "count": 257 }
    }
  },
  "operating_hours": {
    "monday": { "open": "11:00", "close": "23:00" },
    "tuesday": { "open": "11:00", "close": "23:00" },
    "wednesday": { "open": "11:00", "close": "23:00" },
    "thursday": { "open": "11:00", "close": "23:00" },
    "friday": { "open": "11:00", "close": "23:30" },
    "saturday": { "open": "11:00", "close": "23:30" },
    "sunday": { "open": "11:00", "close": "23:00" }
  },
  "price_range": "mid-range",
  "amenities": [
    "Wi-Fi", "Air Conditioning", "Parking", 
    "Outdoor Seating", "Home Delivery"
  ],
  "data_sources": [
    {
      "source": "web-scraping",
      "url": "https://maharajapalace.in",
      "extracted_at": "2024-01-15T10:30:00Z",
      "reliability": 0.95
    },
    {
      "source": "google-places",
      "extracted_at": "2024-01-15T10:35:00Z",
      "reliability": 0.90
    }
  ],
  "status": "validated",
  "completeness": 94.5,
  "accuracy": 96.8,
  "extracted_at": "2024-01-15T10:30:00Z",
  "validated_at": "2024-01-15T10:45:00Z"
}`}
                </pre>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Minimal Valid Record</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
{`{
  "name": "Street Food Corner",
  "address": {
    "city": "Delhi",
    "state": "Delhi",
    "country": "India"
  },
  "cuisine_types": ["Street Food"],
  "contact_info": {},
  "ratings": { "sources": {} },
  "operating_hours": {},
  "price_range": "budget",
  "amenities": [],
  "data_sources": [
    {
      "source": "manual-entry",
      "extracted_at": "2024-01-15T10:30:00Z",
      "reliability": 0.8
    }
  ]
}`}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Common Validation Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="bg-red-50 p-3 rounded-lg">
                      <strong className="text-red-800">Missing Required Field:</strong>
                      <p className="text-red-700">Field 'name' is required but missing</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <strong className="text-yellow-800">Invalid Format:</strong>
                      <p className="text-yellow-700">Phone number '+91-12345' doesn't match Indian format</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <strong className="text-blue-800">Data Quality Warning:</strong>
                      <p className="text-blue-700">Restaurant name unusually long ({'>'}100 characters)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SchemaField({ 
  name, 
  type, 
  required, 
  description, 
  validation 
}: { 
  name: string;
  type: string;
  required: boolean;
  description: string;
  validation?: string;
}) {
  return (
    <div className="border-l-4 border-primary-500 pl-4">
      <div className="flex items-center gap-2 mb-1">
        <code className="font-mono text-blue-600 font-medium">{name}</code>
        <Badge variant="outline" className="text-xs">
          {type}
        </Badge>
        {required && (
          <Badge variant="destructive" className="text-xs">
            Required
          </Badge>
        )}
      </div>
      <p className="text-sm text-gray-600">{description}</p>
      {validation && (
        <p className="text-xs text-gray-500 mt-1">
          <i className="fas fa-info-circle mr-1"></i>
          {validation}
        </p>
      )}
    </div>
  );
}

function ValidationRule({ 
  field, 
  rule, 
  severity 
}: { 
  field: string;
  rule: string;
  severity: "error" | "warning" | "info";
}) {
  const colors = {
    error: "text-red-600 bg-red-50 border-red-200",
    warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
    info: "text-blue-600 bg-blue-50 border-blue-200"
  };

  const icons = {
    error: "fas fa-times-circle",
    warning: "fas fa-exclamation-triangle", 
    info: "fas fa-info-circle"
  };

  return (
    <div className={`border rounded-lg p-3 ${colors[severity]}`}>
      <div className="flex items-start gap-2">
        <i className={`${icons[severity]} mt-0.5`}></i>
        <div className="flex-1">
          <code className="font-mono text-sm font-medium">{field}</code>
          <p className="text-sm mt-1">{rule}</p>
        </div>
      </div>
    </div>
  );
}

function FieldStat({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{name}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function FieldCompletionRate({ field, rate }: { field: string; rate: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <code className="font-mono text-blue-600">{field}</code>
        <span className="font-medium">{rate}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className="bg-primary-500 h-1.5 rounded-full" 
          style={{ width: `${rate}%` }}
        ></div>
      </div>
    </div>
  );
}
