import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type PRChangesAudit } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PRChangesAuditProps {
  category?: string; // Optional filter by PR category
}

export default function PRChangesAudit({ category }: PRChangesAuditProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: auditEntries = [], isLoading } = useQuery<PRChangesAudit[]>({
    queryKey: ["/api/pr-changes-audit"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/pr-changes-audit/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pr-changes-audit"] });
      toast({
        title: "Entry deleted",
        description: "PR audit entry has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete PR audit entry.",
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-center" data-testid="title-pr-audit">
            Personal Records Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground" data-testid="loading-pr-audit">
            Loading PR changes...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (filteredEntries.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-center" data-testid="title-pr-audit">
            Personal Records Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground" data-testid="empty-pr-audit">
            No PR changes recorded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Unknown";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const getFieldBadgeVariant = (field: string) => {
    switch (field) {
      case "weight":
        return "default" as const;
      case "reps":
        return "secondary" as const;
      case "time":
        return "outline" as const;
      default:
        return "default" as const;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-center" data-testid="title-pr-audit">
          Personal Records Changes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium text-sm text-muted-foreground" data-testid="header-exercise">
                  Exercise
                </th>
                <th className="text-left py-2 px-3 font-medium text-sm text-muted-foreground" data-testid="header-field">
                  Field
                </th>
                <th className="text-left py-2 px-3 font-medium text-sm text-muted-foreground" data-testid="header-change">
                  Change
                </th>
                <th className="text-left py-2 px-3 font-medium text-sm text-muted-foreground" data-testid="header-date">
                  Date
                </th>
                <th className="text-right py-2 px-3 font-medium text-sm text-muted-foreground" data-testid="header-actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, index) => (
                <tr key={entry.id} className={index % 2 === 0 ? "bg-muted/30" : ""} data-testid={`row-${entry.id}`}>
                  <td className="py-3 px-3 font-medium" data-testid={`exercise-${entry.id}`}>
                    {entry.exerciseName}
                  </td>
                  <td className="py-3 px-3" data-testid={`field-${entry.id}`}>
                    <Badge 
                      variant={getFieldBadgeVariant(entry.fieldChanged)}
                      className="text-xs capitalize"
                    >
                      {entry.fieldChanged}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-sm" data-testid={`change-${entry.id}`}>
                    {entry.previousValue && (
                      <span className="text-muted-foreground">{entry.previousValue} → </span>
                    )}
                    <span className="font-medium">{entry.newValue}</span>
                  </td>
                  <td className="py-3 px-3 text-sm text-muted-foreground" data-testid={`date-${entry.id}`}>
                    {formatDate(entry.changedAt)}
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