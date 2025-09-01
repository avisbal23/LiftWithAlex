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
import { Droplets, Plus, TrendingUp, TrendingDown, Calendar, Upload, Download, AlertTriangle, CheckCircle, FileText, RotateCcw, X } from "lucide-react";
import { type BloodEntry } from "@shared/schema";

export default function BloodTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importData, setImportData] = useState("");
  const [csvImportData, setCsvImportData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importFormat, setImportFormat] = useState<"json" | "csv">("csv");
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [showCallout, setShowCallout] = useState(true);

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

  const parseCsvData = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) throw new Error("CSV must have at least header and one data row");
    
    const headers = lines[0].split(',');
    const expectedHeaders = ['marker', 'value', 'unit', 'reference_range', 'status', 'time'];
    
    if (!expectedHeaders.every(header => headers.includes(header))) {
      throw new Error(`CSV must include headers: ${expectedHeaders.join(', ')}`);
    }
    
    const rows = lines.slice(1).map(line => {
      const values = line.split(',');
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim();
      });
      return row;
    });
    
    // Group by time to create blood entries
    const entriesByTime: Record<string, any> = {};
    
    rows.forEach(row => {
      const time = row.time;
      if (!entriesByTime[time]) {
        entriesByTime[time] = {
          asOf: new Date(time),
          source: "csv_import",
          // Initialize all fields to null
          totalTestosterone: null, totalTestosteroneUnit: "ng/dL",
          freeTestosterone: null, freeTestosteroneUnit: "pg/mL",
          shbg: null, shbgUnit: "nmol/L",
          estradiol: null, estradiolUnit: "pg/mL",
          estrogensTotal: null, estrogensTotalUnit: "pg/mL",
          dheasulfate: null, dheasulfateUnit: "ug/dL",
          cortisolAm: null, cortisolAmUnit: "ug/dL",
          psa: null, psaUnit: "ng/mL",
          testosteroneEstrogenRatio: null,
          tsh: null, tshUnit: "uIU/mL",
          freeT3: null, freeT3Unit: "pg/mL",
          freeT4: null, freeT4Unit: "ng/dL",
          tpoAb: null, tpoAbUnit: "IU/mL",
          vitaminD25oh: null, vitaminD25ohUnit: "ng/mL",
          crpHs: null, crpHsUnit: "mg/L",
          insulin: null, insulinUnit: "uIU/mL",
          hba1c: null, hba1cUnit: "%",
          cholesterolTotal: null, cholesterolTotalUnit: "mg/dL",
          triglycerides: null, triglyceridesUnit: "mg/dL",
          hdl: null, hdlUnit: "mg/dL",
          ldlCalc: null, ldlCalcUnit: "mg/dL", ldlCalcFlag: null,
          vldlCalc: null, vldlCalcUnit: "mg/dL",
          apob: null, apobUnit: "mg/dL", apobFlag: null,
          ldlApobRatio: null, tgHdlRatio: null,
          albumin: null, albuminUnit: "g/dL",
          ferritin: null, ferritinUnit: "ng/mL",
        };
      }
      
      const entry = entriesByTime[time];
      const marker = row.marker;
      const value = parseFloat(row.value);
      const unit = row.unit;
      const status = row.status;
      
      // Map CSV markers to database fields
      const markerMap: Record<string, { field: string; unitField: string; flagField?: string }> = {
        "SHBG": { field: "shbg", unitField: "shbgUnit" },
        "Estrogen": { field: "estrogensTotal", unitField: "estrogensTotalUnit" },
        "Ferritin": { field: "ferritin", unitField: "ferritinUnit" },
        "Total Testosterone": { field: "totalTestosterone", unitField: "totalTestosteroneUnit" },
        "Vitamin D": { field: "vitaminD25oh", unitField: "vitaminD25ohUnit" },
        "Free Testosterone": { field: "freeTestosterone", unitField: "freeTestosteroneUnit" },
        "Albumin": { field: "albumin", unitField: "albuminUnit" },
        "CRP (C-Reactive Protein)": { field: "crpHs", unitField: "crpHsUnit" },
        "HDL Cholesterol": { field: "hdl", unitField: "hdlUnit" },
        "Triglycerides": { field: "triglycerides", unitField: "triglyceridesUnit" },
        "LDL Cholesterol": { field: "ldlCalc", unitField: "ldlCalcUnit", flagField: "ldlCalcFlag" },
        "ApoB": { field: "apob", unitField: "apobUnit", flagField: "apobFlag" },
        "Free T3": { field: "freeT3", unitField: "freeT3Unit" },
        "Thyroid Stimulating Hormone": { field: "tsh", unitField: "tshUnit" },
        "LDL/ApoB Ratio": { field: "ldlApobRatio", unitField: null },
        "Triglycerides/HDL Ratio": { field: "tgHdlRatio", unitField: null },
      };
      
      const mapping = markerMap[marker];
      if (mapping) {
        entry[mapping.field] = isNaN(value) ? null : value;
        if (mapping.unitField) entry[mapping.unitField] = unit;
        if (mapping.flagField && status === 'outOfRange') {
          entry[mapping.flagField] = 'high'; // Could be enhanced to detect high vs low
        }
      }
    });
    
    return Object.values(entriesByTime);
  };

  const exportToCsv = () => {
    if (bloodEntries.length === 0) {
      toast({
        title: "No Data",
        description: "No blood entries to export",
        variant: "destructive",
      });
      return;
    }
    
    const csvRows = ['marker,value,unit,reference_range,status,time'];
    
    bloodEntries.forEach(entry => {
      const time = new Date(entry.asOf).toISOString().split('T')[0];
      
      const markers = [
        { marker: "SHBG", value: entry.shbg, unit: entry.shbgUnit, refRange: "13.3 - 89.5" },
        { marker: "Estrogen", value: entry.estrogensTotal, unit: entry.estrogensTotalUnit, refRange: "15 - 32" },
        { marker: "Ferritin", value: entry.ferritin, unit: entry.ferritinUnit, refRange: "30 - 350" },
        { marker: "Total Testosterone", value: entry.totalTestosterone, unit: entry.totalTestosteroneUnit, refRange: "250 - 900" },
        { marker: "Vitamin D", value: entry.vitaminD25oh, unit: entry.vitaminD25ohUnit, refRange: "30 - 80" },
        { marker: "Free Testosterone", value: entry.freeTestosterone, unit: entry.freeTestosteroneUnit, refRange: "46 - 224" },
        { marker: "Albumin", value: entry.albumin, unit: entry.albuminUnit, refRange: "3.5 - 5" },
        { marker: "CRP (C-Reactive Protein)", value: entry.crpHs, unit: entry.crpHsUnit, refRange: "0 - 3.0" },
        { marker: "HDL Cholesterol", value: entry.hdl, unit: entry.hdlUnit, refRange: "40 - 120" },
        { marker: "Triglycerides", value: entry.triglycerides, unit: entry.triglyceridesUnit, refRange: "0 - 149" },
        { marker: "LDL Cholesterol", value: entry.ldlCalc, unit: entry.ldlCalcUnit, refRange: "40 - 150", flag: entry.ldlCalcFlag },
        { marker: "ApoB", value: entry.apob, unit: entry.apobUnit, refRange: "0 - 90", flag: entry.apobFlag },
        { marker: "Free T3", value: entry.freeT3, unit: entry.freeT3Unit, refRange: "2 - 4.4" },
        { marker: "Thyroid Stimulating Hormone", value: entry.tsh, unit: entry.tshUnit, refRange: "0.45 - 4.5" },
        { marker: "LDL/ApoB Ratio", value: entry.ldlApobRatio, unit: "pct", refRange: "1.2 - 1.4" },
        { marker: "Triglycerides/HDL Ratio", value: entry.tgHdlRatio, unit: "mg/dL", refRange: "1.25 - 2.5" },
      ];
      
      markers.forEach(({ marker, value, unit, refRange, flag }) => {
        if (value !== null && value !== undefined) {
          const status = flag === 'high' ? 'outOfRange' : 'average';
          csvRows.push(`${marker},${value},${unit || ''},${refRange},${status},${time}`);
        }
      });
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bloodwork-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: `Blood entries exported as CSV`,
    });
  };

  const importBloodData = async () => {
    const dataToImport = importFormat === "csv" ? csvImportData : importData;
    
    if (!dataToImport.trim()) {
      toast({
        title: "Error",
        description: `Please paste your ${importFormat.toUpperCase()} data`,
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      let bloodEntries: any[] = [];
      
      if (importFormat === "csv") {
        bloodEntries = parseCsvData(csvImportData);
      } else {
        // Original JSON parsing logic
        const data = JSON.parse(importData);
        
        if (!data.datasets || !Array.isArray(data.datasets)) {
          throw new Error("Invalid format - missing datasets array");
        }

        bloodEntries = data.datasets.map((dataset: any) => {
          const asOfDate = dataset.as_of === "recent" ? new Date() : new Date(dataset.as_of);
          const panels = dataset.panels;
          
          return {
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
        });
      }

      // Import all entries
      for (const bloodEntry of bloodEntries) {
        await importMutation.mutateAsync(bloodEntry);
      }

      toast({
        title: "Import Successful",
        description: `${bloodEntries.length} blood test(s) imported successfully`,
      });
      
      if (importFormat === "csv") {
        setCsvImportData("");
      } else {
        setImportData("");
      }
    } catch (error) {
      toast({
        title: "Import Failed", 
        description: error instanceof Error ? error.message : `Invalid ${importFormat.toUpperCase()} format`,
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

  const toggleCardFlip = (cardId: string) => {
    setFlippedCards(prev => {
      // If this card is already flipped, just unflip it
      if (prev[cardId]) {
        return {
          ...prev,
          [cardId]: false
        };
      }
      
      // Otherwise, flip this card and unflip all others
      const newFlippedCards: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        newFlippedCards[key] = false;
      });
      newFlippedCards[cardId] = true;
      
      return newFlippedCards;
    });
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

  const getCardExplanation = (title: string) => {
    switch (title) {
      case "Hormones":
        return {
          description: "Critical hormones for muscle growth, strength, libido, and masculine vitality. These markers directly impact your ability to build muscle, maintain energy, and perform sexually.",
          keyPoints: [
            "Total Testosterone: Drives muscle protein synthesis, strength gains, libido, and confidence",
            "Free Testosterone: Bioavailable portion that enters muscle cells for growth and recovery",
            "SHBG: Lower levels mean more free testosterone available for muscle building",
            "Estrogens: Balance prevents muscle loss and supports bone strength for heavy lifting"
          ],
          optimalRanges: [
            "Total Testosterone: 650-900 ng/dL",
            "Free Testosterone: 20-35 pg/mL",
            "SHBG: 20-40 nmol/L",
            "Estradiol (Sensitive): 20-35 pg/mL",
            "Testosterone:Estrogen Ratio: 15-30"
          ]
        };
      case "Thyroid":
        return {
          description: "Your metabolic engine that controls fat burning, energy for training, and mental sharpness. Optimal thyroid function maximizes muscle growth and athletic performance.",
          keyPoints: [
            "TSH: Lower optimal range supports aggressive fat loss and lean muscle retention",
            "Free T3: Powers intense training sessions and accelerates muscle recovery",
            "Free T4: Maintains steady energy for consistent gym performance and mental focus",
            "Optimal thyroid = explosive workouts, faster recovery, sharper mind"
          ],
          optimalRanges: [
            "TSH: 0.8-2.0 uIU/mL",
            "Free T3: 3.3-4.4 pg/mL",
            "Free T4: 1.1-1.6 ng/dL"
          ]
        };
      case "Lipids":
        return {
          description: "Cardiovascular markers that determine your capacity for intense training and long-term performance. Poor lipids limit blood flow to muscles and organs.",
          keyPoints: [
            "LDL: High levels reduce blood flow to muscles during training",
            "HDL: Higher levels improve oxygen delivery and exercise capacity",
            "Triglycerides: Lower levels support better insulin sensitivity and muscle building",
            "ApoB: Key marker for maintaining peak cardiovascular performance under stress"
          ],
          optimalRanges: [
            "Total Cholesterol: 160-200 mg/dL",
            "HDL: 50-80 mg/dL",
            "LDL (Calculated): 60-100 mg/dL",
            "Triglycerides: 50-90 mg/dL",
            "TG:HDL Ratio: 0.5-1.5",
            "ApoB: 60-80 mg/dL",
            "Non-HDL Cholesterol: 80-110 mg/dL"
          ]
        };
      case "Health Markers":
        return {
          description: "Foundation markers for peak male performance - controlling inflammation, energy production, and nutrient status that fuel muscle growth and mental clarity.",
          keyPoints: [
            "Vitamin D: Boosts testosterone production, bone strength, and training recovery",
            "CRP (hs): Low inflammation means faster muscle recovery and better sleep",
            "HbA1c: Stable blood sugar optimizes muscle building and prevents energy crashes",
            "Ferritin: Adequate iron ensures oxygen delivery for intense training and mental focus"
          ],
          optimalRanges: [
            "Vitamin D (25-OH): 50-70 ng/mL",
            "CRP (hs): 0.0-0.7 mg/L",
            "Insulin (Fasting): 2-5 uIU/mL",
            "HbA1c: 4.8-5.2%",
            "Albumin: 4.3-5.0 g/dL",
            "Ferritin: 80-160 ng/mL"
          ]
        };
      default:
        return {
          description: "Health markers and lab values",
          keyPoints: []
        };
    }
  };

  const renderPanelCard = (title: string, icon: React.ReactNode, values: Array<{ label: string; value: number | null; unit: string | null; flag?: string | null; change?: number | null }>, entryId: string) => {
    const cardId = `${entryId}-${title}`;
    const isFlipped = flippedCards[cardId];
    const explanation = getCardExplanation(title);

    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              {icon}
              {title}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCardFlip(cardId)}
              className="h-8 w-8 p-0 hover:bg-muted/50"
              data-testid={`button-flip-${title.toLowerCase().replace(' ', '-')}`}
            >
              <RotateCcw className={`w-4 h-4 transition-transform duration-300 ${isFlipped ? 'rotate-180' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isFlipped ? (
            // Front side - show values
            values.map(({ label, value, unit, flag, change }) => (
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
            ))
          ) : (
            // Back side - show explanation
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {explanation.description}
              </p>
              <div className="space-y-2">
                {explanation.keyPoints.map((point, index) => (
                  <div key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              {explanation.optimalRanges && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Optimal Ranges (Male, 30s, Strength Focus)</h4>
                  <div className="space-y-1">
                    {explanation.optimalRanges.map((range, index) => (
                      <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="font-mono">{range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="heading-blood-tracking">
              Blood Lab Tracking
            </h1>
            <p className="text-muted-foreground">
              Track your blood lab results and health markers
            </p>
          </div>
        </div>

        {/* Rhythm Health Import Callout */}
        {showCallout && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8 relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCallout(false)}
              className="absolute top-2 right-2 h-6 w-6 p-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              data-testid="button-close-callout"
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="flex items-start gap-3 pr-8">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  💡 Import Data from Rhythm Health
                </h3>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div></div>
          
          <div className="flex gap-2">
            <Button onClick={exportToCsv} variant="outline" data-testid="button-export-csv">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            
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
                  <div className="flex gap-2">
                    <Button
                      variant={importFormat === "csv" ? "default" : "outline"}
                      onClick={() => setImportFormat("csv")}
                      className="flex-1"
                      data-testid="button-csv-format"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      CSV Format
                    </Button>
                    <Button
                      variant={importFormat === "json" ? "default" : "outline"}
                      onClick={() => setImportFormat("json")}
                      className="flex-1"
                      data-testid="button-json-format"
                    >
                      JSON Format
                    </Button>
                  </div>
                  
                  {importFormat === "csv" ? (
                    <div>
                      <Label htmlFor="csv-import">Rhythm Health CSV Export</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Paste CSV data from your bloodwork provider (format: marker,value,unit,reference_range,status,time)
                      </p>
                      <Textarea
                        id="csv-import"
                        placeholder={`marker,value,unit,reference_range,status,time\nSHBG,27.4,nmol/L,13.3 - 89.5,average,2025-08-16\nTotal Testosterone,390,ng/dL,250 - 900,average,2025-08-16\n...`}
                        value={csvImportData}
                        onChange={(e) => setCsvImportData(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="json-import">Lab Results JSON Data</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Paste JSON data in the original format
                      </p>
                      <Textarea
                        id="json-import"
                        placeholder="Paste your lab results JSON here..."
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>
                  )}
                  
                  <Button 
                    onClick={importBloodData}
                    disabled={isImporting || (importFormat === "csv" ? !csvImportData.trim() : !importData.trim())}
                    className="w-full"
                  >
                    {isImporting ? "Importing..." : `Import ${importFormat.toUpperCase()} Lab Results`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {bloodEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🩸</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No lab results yet</h2>
            <p className="text-muted-foreground mb-4">Import lab data to start tracking</p>
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
                  <div className="flex gap-2">
                    <Button
                      variant={importFormat === "csv" ? "default" : "outline"}
                      onClick={() => setImportFormat("csv")}
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      CSV Format
                    </Button>
                    <Button
                      variant={importFormat === "json" ? "default" : "outline"}
                      onClick={() => setImportFormat("json")}
                      className="flex-1"
                    >
                      JSON Format
                    </Button>
                  </div>
                  
                  {importFormat === "csv" ? (
                    <div>
                      <Label htmlFor="csv-import-empty">Rhythm Health CSV Export</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Paste CSV data from your bloodwork provider
                      </p>
                      <Textarea
                        id="csv-import-empty"
                        placeholder={`marker,value,unit,reference_range,status,time\nSHBG,27.4,nmol/L,13.3 - 89.5,average,2025-08-16\n...`}
                        value={csvImportData}
                        onChange={(e) => setCsvImportData(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="json-import-empty">Lab Results JSON Data</Label>
                      <Textarea
                        id="json-import-empty"
                        placeholder="Paste your lab results JSON here..."
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>
                  )}
                  
                  <Button 
                    onClick={importBloodData}
                    disabled={isImporting || (importFormat === "csv" ? !csvImportData.trim() : !importData.trim())}
                    className="w-full"
                  >
                    {isImporting ? "Importing..." : `Import ${importFormat.toUpperCase()} Lab Results`}
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
                    ],
                    entry.id
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
                    ],
                    entry.id
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
                    ],
                    entry.id
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
                    ],
                    entry.id
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