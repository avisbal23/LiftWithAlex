import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ChangesAudit } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChangesAuditProps {
  category?: string; // Optional filter by workout category
}

export default function ChangesAudit({ category }: ChangesAuditProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: auditEntries = [], isLoading } = useQuery<ChangesAudit[]>({
    queryKey: ["/api/changes-audit"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/changes-audit/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/changes-audit"] });
      toast({
        title: "Entry deleted",
        description: "Audit entry has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete audit entry.",
        variant: "destructive",
      });
    },
  });

  // Filter by category if provided
  const filteredEntries = category 
    ? auditEntries.filter(entry => entry.category === category)
    : auditEntries;

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Changes Audit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Loading changes...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredEntries.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Changes Audit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            No weight changes recorded yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPercentage = (percentage: number | null) => {
    if (percentage === null || percentage === undefined) return "0%";
    const sign = percentage >= 0 ? "+" : "";
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const getPercentageBadgeVariant = (percentage: number | null) => {
    if (percentage === null || percentage === undefined) return "secondary";
    if (percentage > 0) return "default"; // Green for increases
    if (percentage < 0) return "destructive"; // Red for decreases
    return "secondary"; // Neutral for no change
  };

  return (
    <Card className="mt-6" data-testid="changes-audit">
      <CardHeader>
        <CardTitle>Changes Audit</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-sm text-muted-foreground" data-testid="header-date">
                  Date
                </th>
                <th className="text-left py-2 px-3 font-medium text-sm text-muted-foreground" data-testid="header-exercise">
                  Exercise
                </th>
                <th className="text-left py-2 px-3 font-medium text-sm text-muted-foreground" data-testid="header-weight">
                  Weight (lbs)
                </th>
                <th className="text-left py-2 px-3 font-medium text-sm text-muted-foreground" data-testid="header-change">
                  Change
                </th>
                <th className="text-right py-2 px-3 font-medium text-sm text-muted-foreground" data-testid="header-actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, index) => (
                <tr 
                  key={entry.id} 
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                  data-testid={`audit-row-${index}`}
                >
                  <td className="py-3 px-3 text-sm" data-testid={`date-${entry.id}`}>
                    {formatDate(entry.changedAt!)}
                  </td>
                  <td className="py-3 px-3 text-sm font-medium" data-testid={`exercise-${entry.id}`}>
                    {entry.exerciseName}
                  </td>
                  <td className="py-3 px-3 text-sm" data-testid={`weight-${entry.id}`}>
                    <span className="text-muted-foreground">{entry.previousWeight} → </span>
                    <span className="font-medium">{entry.newWeight}</span>
                  </td>
                  <td className="py-3 px-3" data-testid={`change-${entry.id}`}>
                    <Badge 
                      variant={getPercentageBadgeVariant(entry.percentageIncrease)}
                      className="text-xs"
                    >
                      {formatPercentage(entry.percentageIncrease)}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right" data-testid={`actions-${entry.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(entry.id)}
                      disabled={deleteMutation.isPending}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      data-testid={`button-delete-${entry.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}