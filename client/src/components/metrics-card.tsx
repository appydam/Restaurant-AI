import { Card, CardContent } from "@/components/ui/card";

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor: string;
  change?: {
    value: string;
    type: "positive" | "negative" | "neutral";
  };
  subtitle?: string;
}

export default function MetricsCard({ title, value, icon, iconColor, change, subtitle }: MetricsCardProps) {
  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
          </div>
          <div className={`w-12 h-12 ${iconColor} rounded-lg flex items-center justify-center`}>
            <i className={`${icon} text-xl`}></i>
          </div>
        </div>
        {(change || subtitle) && (
          <div className="mt-2 flex items-center gap-1 text-sm">
            {change && (
              <>
                <i className={`fas ${change.type === "positive" ? "fa-arrow-up text-green-500" : change.type === "negative" ? "fa-arrow-down text-red-500" : "fa-minus text-gray-500"}`}></i>
                <span className={change.type === "positive" ? "text-green-600" : change.type === "negative" ? "text-red-600" : "text-gray-600"}>
                  {change.value}
                </span>
              </>
            )}
            {subtitle && <span className="text-gray-500">{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
