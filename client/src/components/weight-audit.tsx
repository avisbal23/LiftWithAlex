import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, History, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { WeightAudit } from "@shared/schema";

export default function WeightAudit() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Query to get weight audit entries
  const { data: auditEntries, isLoading } = useQuery<WeightAudit[]>({
    queryKey: ["/api/weight-audit"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/weight-audit");
      return response.json();
    },
  });

  const handleCollapseChange = (open: boolean) => {
    setIsCollapsed(!open);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
      case 'import':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'update':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'delete':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Created';
      case 'update':
        return 'Updated';
      case 'delete':
        return 'Deleted';
      case 'import':
        return 'Imported';
      default:
        return action;
    }
  };

  const formatValue = (value: number | null | undefined, unit?: string) => {
    if (value === null || value === undefined) return '-';
    return unit ? `${value}${unit}` : value.toString();
  };

  const formatDelta = (delta: number | null | undefined, unit?: string) => {
    if (delta === null || delta === undefined || delta === 0) return null;
    const sign = delta > 0 ? '+' : '';
    const formatted = unit ? `${sign}${delta}${unit}` : `${sign}${delta}`;
    const color = delta > 0 ? 'text-green-600' : 'text-red-600';
    return <span className={color}>({formatted})</span>;
  };

  return (
    <Card className="mb-6 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/30 dark:border-green-800/30">
      <Collapsible open={!isCollapsed} onOpenChange={handleCollapseChange}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-green-50/50 dark:hover:bg-green-950/30 transition-colors">
            <CardTitle className="flex items-center justify-between text-green-700 dark:text-green-300">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Weight Change History
                {auditEntries && auditEntries.length > 0 && (
                  <span className="text-sm font-normal text-green-600 dark:text-green-400">
                    ({auditEntries.length} entries)
                  </span>
                )}
              </div>
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="text-center py-4 text-green-600 dark:text-green-400">
                Loading audit history...
              </div>
            ) : !auditEntries || auditEntries.length === 0 ? (
              <div className="text-center py-4 text-green-600/70 dark:text-green-400/70">
                No weight changes recorded yet
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {auditEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-lg bg-white/80 dark:bg-gray-900/80 border border-green-200/50 dark:border-green-800/50"
                    data-testid={`audit-entry-${entry.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getActionIcon(entry.action)}
                        <span className="font-medium text-green-700 dark:text-green-300">
                          {getActionLabel(entry.action)}
                        </span>
                        <span className="text-sm text-green-600/70 dark:text-green-400/70">
                          via {entry.source === 'manual' ? 'Manual Entry' : 'RENPHO CSV'}
                        </span>
                      </div>
                      <span className="text-sm text-green-600/70 dark:text-green-400/70">
                        {entry.changedAt ? format(new Date(entry.changedAt), 'MMM d, h:mm a') : ''}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {/* Weight changes */}
                      {(entry.previousWeight || entry.newWeight) && (
                        <div>
                          <span className="text-green-600/70 dark:text-green-400/70">Weight:</span>
                          <div className="text-green-700 dark:text-green-300">
                            {entry.action === 'delete' 
                              ? formatValue(entry.previousWeight, 'kg')
                              : formatValue(entry.newWeight, 'kg')
                            } {formatDelta(entry.weightDelta, 'kg')}
                          </div>
                        </div>
                      )}
                      
                      {/* Body Fat changes */}
                      {(entry.previousBodyFat || entry.newBodyFat) && (
                        <div>
                          <span className="text-green-600/70 dark:text-green-400/70">Body Fat:</span>
                          <div className="text-green-700 dark:text-green-300">
                            {entry.action === 'delete' 
                              ? formatValue(entry.previousBodyFat, '%')
                              : formatValue(entry.newBodyFat, '%')
                            } {formatDelta(entry.bodyFatDelta, '%')}
                          </div>
                        </div>
                      )}
                      
                      {/* Muscle Mass changes */}
                      {(entry.previousMuscleMass || entry.newMuscleMass) && (
                        <div>
                          <span className="text-green-600/70 dark:text-green-400/70">Muscle Mass:</span>
                          <div className="text-green-700 dark:text-green-300">
                            {entry.action === 'delete' 
                              ? formatValue(entry.previousMuscleMass, 'kg')
                              : formatValue(entry.newMuscleMass, 'kg')
                            } {formatDelta(entry.muscleMassDelta, 'kg')}
                          </div>
                        </div>
                      )}
                      
                      {/* BMI changes */}
                      {(entry.previousBMI || entry.newBMI) && (
                        <div>
                          <span className="text-green-600/70 dark:text-green-400/70">BMI:</span>
                          <div className="text-green-700 dark:text-green-300">
                            {entry.action === 'delete' 
                              ? formatValue(entry.previousBMI)
                              : formatValue(entry.newBMI)
                            } {formatDelta(entry.bmiDelta)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Remarks */}
                    {entry.remarks && (
                      <div className="mt-2 p-2 bg-green-50/50 dark:bg-green-950/30 rounded text-sm">
                        <span className="text-green-600/70 dark:text-green-400/70">Note:</span>
                        <span className="text-green-700 dark:text-green-300 ml-2">{entry.remarks}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}