import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Droplets, Plus, TrendingUp, TrendingDown, Calendar, Upload, AlertTriangle, CheckCircle } from "lucide-react";
import { type BloodEntry } from "@shared/schema";

export default function BloodTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importData, setImportData] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const { data: bloodEntries = [] } = useQuery<BloodEntry[]>({
    queryKey: ["/api/blood-entries"],
  });

  const importMutation = useMutation({
    mutationFn: (entry: any) => apiRequest("/api/blood-entries", {
      method: "POST",
      body: JSON.stringify(entry),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blood-entries"] });
    },
  });

  const importBloodData = async () => {
    if (!importData.trim()) {
      toast({
        title: "Error",
        description: "Please paste your blood data JSON",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const data = JSON.parse(importData);
      
      if (!data.datasets || !Array.isArray(data.datasets)) {
        throw new Error("Invalid format - missing datasets array");
      }

      for (const dataset of data.datasets) {
        const asOfDate = dataset.as_of === "recent" ? new Date() : new Date(dataset.as_of);
        const panels = dataset.panels;
        
        const bloodEntry = {
          asOf: asOfDate,
          source: dataset.source,
          
          // Hormone Balance
          totalTestosterone: panels.hormone_balance?.total_testosterone?.value || null,
          totalTestosteroneUnit: panels.hormone_balance?.total_testosterone?.unit || "ng/dL",
          freeTestosterone: panels.hormone_balance?.free_testosterone?.value || null,
          freeTestosteroneUnit: panels.hormone_balance?.free_testosterone?.unit || "pg/mL",
          shbg: panels.hormone_balance?.shbg?.value || null,
          shbgUnit: panels.hormone_balance?.shbg?.unit || "nmol/L",
          estradiol: panels.hormone_balance?.estradiol?.value || null,
          estradiolUnit: panels.hormone_balance?.estradiol?.unit || "pg/mL",
          estrogensTotal: panels.hormone_balance?.estrogens_total?.value || null,
          estrogensTotalUnit: panels.hormone_balance?.estrogens_total?.unit || "pg/mL",
          dheasulfate: panels.hormone_balance?.dhea_sulfate?.value || null,
          dheasulfateUnit: panels.hormone_balance?.dhea_sulfate?.unit || "ug/dL",
          cortisolAm: panels.hormone_balance?.cortisol_am?.value || null,
          cortisolAmUnit: panels.hormone_balance?.cortisol_am?.unit || "ug/dL",
          psa: panels.hormone_balance?.psa?.value || null,
          psaUnit: panels.hormone_balance?.psa?.unit || "ng/mL",
          testosteroneEstrogenRatio: panels.hormone_balance?.testosterone_estrogen_ratio?.value || null,
          
          // Thyroid
          tsh: panels.thyroid?.tsh?.value || null,
          tshUnit: panels.thyroid?.tsh?.unit || "uIU/mL",
          freeT3: panels.thyroid?.free_t3?.value || null,
          freeT3Unit: panels.thyroid?.free_t3?.unit || "pg/mL",
          freeT4: panels.thyroid?.free_t4?.value || null,
          freeT4Unit: panels.thyroid?.free_t4?.unit || "ng/dL",
          tpoAb: panels.thyroid?.tpo_ab?.value || null,
          tpoAbUnit: panels.thyroid?.tpo_ab?.unit || "IU/mL",
          
          // Vitamin/Inflammation/Glucose
          vitaminD25oh: panels.vitamin_inflammation_glucose?.vitamin_d_25oh?.value || null,
          vitaminD25ohUnit: panels.vitamin_inflammation_glucose?.vitamin_d_25oh?.unit || "ng/mL",
          crpHs: panels.vitamin_inflammation_glucose?.crp_hs?.value || null,
          crpHsUnit: panels.vitamin_inflammation_glucose?.crp_hs?.unit || "mg/L",
          insulin: panels.vitamin_inflammation_glucose?.insulin?.value || null,
          insulinUnit: panels.vitamin_inflammation_glucose?.insulin?.unit || "uIU/mL",
          hba1c: panels.vitamin_inflammation_glucose?.hba1c?.value || null,
          hba1cUnit: panels.vitamin_inflammation_glucose?.hba1c?.unit || "%",
          
          // Lipids
          cholesterolTotal: panels.lipids?.cholesterol_total?.value || null,
          cholesterolTotalUnit: panels.lipids?.cholesterol_total?.unit || "mg/dL",
          triglycerides: panels.lipids?.triglycerides?.value || null,
          triglyceridesUnit: panels.lipids?.triglycerides?.unit || "mg/dL",
          hdl: panels.lipids?.hdl?.value || null,
          hdlUnit: panels.lipids?.hdl?.unit || "mg/dL",
          ldlCalc: panels.lipids?.ldl_calc?.value || null,
          ldlCalcUnit: panels.lipids?.ldl_calc?.unit || "mg/dL",
          ldlCalcFlag: panels.lipids?.ldl_calc?.flag || null,
          vldlCalc: panels.lipids?.vldl_calc?.value || null,
          vldlCalcUnit: panels.lipids?.vldl_calc?.unit || "mg/dL",
          apob: panels.lipids?.apob?.value || null,
          apobUnit: panels.lipids?.apob?.unit || "mg/dL",
          apobFlag: panels.lipids?.apob?.flag || null,
          ldlApobRatio: panels.lipids?.ldl_apob_ratio?.value || null,
          tgHdlRatio: panels.lipids?.tg_hdl_ratio?.value || null,
          
          // Proteins/Misc
          albumin: panels.proteins_misc?.albumin?.value || null,
          albuminUnit: panels.proteins_misc?.albumin?.unit || "g/dL",
          ferritin: panels.proteins_misc?.ferritin?.value || null,
          ferritinUnit: panels.proteins_misc?.ferritin?.unit || "ng/mL",
        };

        await importMutation.mutateAsync(bloodEntry);
      }

      toast({
        title: "Import Successful",
        description: `${data.datasets.length} blood test(s) imported successfully`,
      });
      setImportData("");
    } catch (error) {
      toast({
        title: "Import Failed", 
        description: error instanceof Error ? error.message : "Invalid JSON format",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getValueChange = (current: number | null, previous: number | null) => {
    if (!current || !previous) return null;
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  const renderValueWithFlag = (value: number | null, unit: string | null, flag: string | null = null) => {
    if (!value) return <span className="text-muted-foreground">—</span>;
    
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">{value} {unit}</span>
        {flag && (
          <Badge variant={flag === "high" ? "destructive" : "default"} className="text-xs">
            {flag}
          </Badge>
        )}
      </div>
    );
  };

  const renderPanelCard = (title: string, icon: React.ReactNode, values: Array<{ label: string; value: number | null; unit: string | null; flag?: string | null; change?: number | null }>) => {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {values.map(({ label, value, unit, flag, change }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{label}</span>
              <div className="flex items-center gap-2">
                {renderValueWithFlag(value, unit, flag)}
                {change && (
                  <div className={`flex items-center text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(change).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  const sortedEntries = bloodEntries.sort((a, b) => new Date(b.asOf).getTime() - new Date(a.asOf).getTime());
  const latest = sortedEntries[0];
  const previous = sortedEntries[1];

  return (
    <>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="heading-blood-tracking">
              Blood Lab Tracking
            </h1>
            <p className="text-muted-foreground">
              Track your blood lab results and health markers
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button data-testid="button-import-blood">
                <Upload className="w-4 h-4 mr-2" />
                Import Lab Results
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Blood Lab Data</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="blood-import">Lab Results JSON Data</Label>
                  <Textarea
                    id="blood-import"
                    placeholder="Paste your lab results JSON here..."
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
                <Button 
                  onClick={importBloodData}
                  disabled={isImporting || !importData.trim()}
                  className="w-full"
                >
                  {isImporting ? "Importing..." : "Import Lab Results"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {bloodEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🩸</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No lab results yet</h2>
            <p className="text-muted-foreground mb-4">Import your blood lab data to start tracking</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Import First Lab Results
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import Blood Lab Data</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="blood-import-empty">Lab Results JSON Data</Label>
                    <Textarea
                      id="blood-import-empty"
                      placeholder="Paste your lab results JSON here..."
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                  <Button 
                    onClick={importBloodData}
                    disabled={isImporting || !importData.trim()}
                    className="w-full"
                  >
                    {isImporting ? "Importing..." : "Import Lab Results"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedEntries.map((entry, index) => (
              <div key={entry.id} className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{formatDate(entry.asOf)}</span>
                  </div>
                  <Badge variant="outline">{entry.source.replace('_', ' ')}</Badge>
                  {index === 0 && <Badge>Latest</Badge>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Hormone Balance */}
                  {renderPanelCard(
                    "Hormones",
                    <Droplets className="w-4 h-4 text-blue-500" />,
                    [
                      { 
                        label: "Total Testosterone", 
                        value: entry.totalTestosterone, 
                        unit: entry.totalTestosteroneUnit,
                        change: previous ? getValueChange(entry.totalTestosterone, previous.totalTestosterone) : null
                      },
                      { 
                        label: "Free Testosterone", 
                        value: entry.freeTestosterone, 
                        unit: entry.freeTestosteroneUnit,
                        change: previous ? getValueChange(entry.freeTestosterone, previous.freeTestosterone) : null
                      },
                      { 
                        label: "SHBG", 
                        value: entry.shbg, 
                        unit: entry.shbgUnit,
                        change: previous ? getValueChange(entry.shbg, previous.shbg) : null
                      },
                      { 
                        label: "Estrogens Total", 
                        value: entry.estrogensTotal, 
                        unit: entry.estrogensTotalUnit,
                        change: previous ? getValueChange(entry.estrogensTotal, previous.estrogensTotal) : null
                      },
                    ]
                  )}

                  {/* Thyroid */}
                  {renderPanelCard(
                    "Thyroid", 
                    <AlertTriangle className="w-4 h-4 text-orange-500" />,
                    [
                      { 
                        label: "TSH", 
                        value: entry.tsh, 
                        unit: entry.tshUnit,
                        change: previous ? getValueChange(entry.tsh, previous.tsh) : null
                      },
                      { 
                        label: "Free T3", 
                        value: entry.freeT3, 
                        unit: entry.freeT3Unit,
                        change: previous ? getValueChange(entry.freeT3, previous.freeT3) : null
                      },
                      { 
                        label: "Free T4", 
                        value: entry.freeT4, 
                        unit: entry.freeT4Unit,
                        change: previous ? getValueChange(entry.freeT4, previous.freeT4) : null
                      },
                    ]
                  )}

                  {/* Lipids */}
                  {renderPanelCard(
                    "Lipids",
                    <TrendingUp className="w-4 h-4 text-red-500" />,
                    [
                      { 
                        label: "LDL", 
                        value: entry.ldlCalc, 
                        unit: entry.ldlCalcUnit, 
                        flag: entry.ldlCalcFlag,
                        change: previous ? getValueChange(entry.ldlCalc, previous.ldlCalc) : null
                      },
                      { 
                        label: "HDL", 
                        value: entry.hdl, 
                        unit: entry.hdlUnit,
                        change: previous ? getValueChange(entry.hdl, previous.hdl) : null
                      },
                      { 
                        label: "Triglycerides", 
                        value: entry.triglycerides, 
                        unit: entry.triglyceridesUnit,
                        change: previous ? getValueChange(entry.triglycerides, previous.triglycerides) : null
                      },
                      { 
                        label: "ApoB", 
                        value: entry.apob, 
                        unit: entry.apobUnit, 
                        flag: entry.apobFlag,
                        change: previous ? getValueChange(entry.apob, previous.apob) : null
                      },
                    ]
                  )}

                  {/* Vitamins & Health */}
                  {renderPanelCard(
                    "Health Markers",
                    <CheckCircle className="w-4 h-4 text-green-500" />,
                    [
                      { 
                        label: "Vitamin D", 
                        value: entry.vitaminD25oh, 
                        unit: entry.vitaminD25ohUnit,
                        change: previous ? getValueChange(entry.vitaminD25oh, previous.vitaminD25oh) : null
                      },
                      { 
                        label: "CRP (hs)", 
                        value: entry.crpHs, 
                        unit: entry.crpHsUnit,
                        change: previous ? getValueChange(entry.crpHs, previous.crpHs) : null
                      },
                      { 
                        label: "HbA1c", 
                        value: entry.hba1c, 
                        unit: entry.hba1cUnit,
                        change: previous ? getValueChange(entry.hba1c, previous.hba1c) : null
                      },
                      { 
                        label: "Ferritin", 
                        value: entry.ferritin, 
                        unit: entry.ferritinUnit,
                        change: previous ? getValueChange(entry.ferritin, previous.ferritin) : null
                      },
                    ]
                  )}
                </div>
                
                {index < sortedEntries.length - 1 && <div className="border-b border-border mt-8" />}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}