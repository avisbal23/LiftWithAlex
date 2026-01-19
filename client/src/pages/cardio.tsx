import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UniversalNavigation } from "@/components/UniversalNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Loader2, Trash2, Clock, MapPin, Activity, Calendar, Flame, Gauge, RotateCcw, ChevronDown, Dumbbell, Share } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, startOfYear, subDays, isAfter } from "date-fns";
import type { CardioLogEntry } from "@shared/schema";

function parseDistanceToMiles(distance: string | null | undefined): number {
  if (!distance) return 0;
  const lower = distance.toLowerCase();
  const numMatch = lower.match(/[\d.]+/);
  if (!numMatch) return 0;
  const num = parseFloat(numMatch[0]);
  if (isNaN(num)) return 0;
  if (lower.includes("km") || lower.includes("kilometer")) {
    return num * 0.621371;
  }
  if (lower.includes("meter") && !lower.includes("kilometer")) {
    return num * 0.000621371;
  }
  if (lower.includes("yard")) {
    return num * 0.000568182;
  }
  return num;
}

function parsePaceToSeconds(pace: string | null | undefined): number | null {
  if (!pace) return null;
  const match = pace.match(/(\d+):(\d+)/);
  if (match) {
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }
  return null;
}

function formatSecondsAsPace(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /mi`;
}

async function generateWorkoutPNG(workout: {
  workoutType: string;
  distance: string;
  duration: string;
  pace: string;
  weightedVest: boolean;
}): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const size = 600;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, size, size);

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#16213e');
  gradient.addColorStop(1, '#0f0f23');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Lift with Alex', size / 2, 50);

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 75);
  ctx.lineTo(size - 100, 75);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
  ctx.fillText(workout.workoutType, size / 2, 140);

  const stats = [
    { label: 'Distance', value: workout.distance },
    { label: 'Time', value: workout.duration },
    { label: 'Pace', value: workout.pace },
  ];

  let yPos = 200;
  stats.forEach((stat) => {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '20px system-ui, -apple-system, sans-serif';
    ctx.fillText(stat.label, size / 2, yPos);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.fillText(stat.value, size / 2, yPos + 45);
    
    yPos += 100;
  });

  ctx.fillStyle = workout.weightedVest ? '#f59e0b' : '#6b7280';
  ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
  ctx.fillText('🏋️', size / 2, yPos + 20);
  
  ctx.fillStyle = '#9ca3af';
  ctx.font = '18px system-ui, -apple-system, sans-serif';
  ctx.fillText('Weighted Vest', size / 2, yPos + 55);
  
  ctx.fillStyle = workout.weightedVest ? '#22c55e' : '#ef4444';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.fillText(workout.weightedVest ? 'Yes' : 'No', size / 2, yPos + 85);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
}

async function shareWorkout(entry: CardioLogEntry, toast: any) {
  const workoutData = {
    workoutType: entry.workoutType || 'Running',
    distance: entry.distance || '3.1 miles',
    duration: entry.duration || '23:56',
    pace: entry.pace || '07:44/mile',
    weightedVest: entry.weightedVest ?? false,
  };

  try {
    const blob = await generateWorkoutPNG(workoutData);
    const file = new File([blob], 'workout.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'My Workout',
        text: `${workoutData.workoutType} - ${workoutData.distance} in ${workoutData.duration}`,
      });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'workout.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Image Downloaded',
        description: 'Share sheet not available. Image saved to downloads.',
      });
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      toast({
        title: 'Share Failed',
        description: 'Could not share workout image.',
        variant: 'destructive',
      });
    }
  }
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function Cardio() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const { data: entries = [], isLoading } = useQuery<CardioLogEntry[]>({
    queryKey: ["/api/cardio-log-entries"],
  });

  const kpiData = useMemo(() => {
    const now = new Date();
    const rolling7Start = subDays(now, 7);
    const monthStart = startOfMonth(now);
    const yearStart = startOfYear(now);
    const rolling365Start = subDays(now, 365);

    let milesLast7Days = 0;
    let milesThisMonth = 0;
    let milesThisYear = 0;
    let milesRolling365 = 0;

    const runEntries = entries
      .filter(e => e.workoutType.toLowerCase().includes("run") || e.workoutType.toLowerCase().includes("jog"))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const last7Runs = runEntries.slice(0, 7);
    const paceSeconds = last7Runs
      .map(e => parsePaceToSeconds(e.pace))
      .filter((p): p is number => p !== null);
    const avgPaceSeconds = paceSeconds.length > 0 
      ? paceSeconds.reduce((a, b) => a + b, 0) / paceSeconds.length 
      : null;

    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const miles = parseDistanceToMiles(entry.distance);

      if (isAfter(entryDate, rolling7Start)) {
        milesLast7Days += miles;
      }
      if (isAfter(entryDate, monthStart) || entryDate.getTime() === monthStart.getTime()) {
        milesThisMonth += miles;
      }
      if (isAfter(entryDate, yearStart) || entryDate.getTime() === yearStart.getTime()) {
        milesThisYear += miles;
      }
      if (isAfter(entryDate, rolling365Start)) {
        milesRolling365 += miles;
      }
    });

    return {
      milesLast7Days,
      milesThisMonth,
      milesThisYear,
      milesRolling365,
      avgPace: avgPaceSeconds ? formatSecondsAsPace(avgPaceSeconds) : "—",
      runCount: Math.min(last7Runs.length, 7),
    };
  }, [entries]);

  const top3PaceRanking = useMemo(() => {
    const runsWithPace = entries
      .filter(e => e.pace && (e.workoutType.toLowerCase().includes("run") || e.workoutType.toLowerCase().includes("jog")))
      .map(e => ({ id: e.id, paceSeconds: parsePaceToSeconds(e.pace) }))
      .filter((e): e is { id: string; paceSeconds: number } => e.paceSeconds !== null)
      .sort((a, b) => a.paceSeconds - b.paceSeconds)
      .slice(0, 3);
    
    const ranking: Record<string, number> = {};
    runsWithPace.forEach((run, i) => {
      ranking[run.id] = i + 1;
    });
    return ranking;
  }, [entries]);

  const createEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/cardio-log-entries", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cardio-log-entries"] });
      toast({
        title: "Workout logged!",
        description: "Your cardio session has been recorded.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save workout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/cardio-log-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cardio-log-entries"] });
      toast({
        title: "Deleted",
        description: "Workout entry removed.",
      });
    },
  });

  const toggleVestMutation = useMutation({
    mutationFn: async ({ id, weightedVest }: { id: string; weightedVest: boolean }) => {
      return await apiRequest("PATCH", `/api/cardio-log-entries/${id}`, { weightedVest });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cardio-log-entries"] });
    },
  });

  const parseVoiceMutation = useMutation({
    mutationFn: async (transcription: string) => {
      const response = await apiRequest("POST", "/api/cardio-log-entries/parse-voice", { transcription });
      return await response.json();
    },
  });

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          finalTranscriptRef.current = finalTranscript;
          setTranscription(finalTranscript);
        } else if (interimTranscript) {
          setTranscription(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        toast({
          title: "Voice Error",
          description: "Could not access microphone. Please check permissions.",
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          setIsRecording(false);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = async () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      
      // Wait a brief moment for any final results to come in
      setTimeout(async () => {
        const textToProcess = finalTranscriptRef.current || transcription;
        
        if (textToProcess.trim()) {
          setIsProcessing(true);
          try {
            const parsed = await parseVoiceMutation.mutateAsync(textToProcess);
            
            await createEntryMutation.mutateAsync({
              date: new Date().toISOString(),
              workoutType: parsed.workoutType,
              duration: parsed.duration,
              distance: parsed.distance,
              caloriesBurned: parsed.caloriesBurned,
              pace: parsed.pace,
              notes: parsed.notes,
              rawTranscription: textToProcess,
            });
            
            setTranscription("");
            finalTranscriptRef.current = "";
          } catch (error) {
            toast({
              title: "Processing Error",
              description: "Failed to process your voice input. Please try again.",
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
          }
        } else {
          toast({
            title: "No speech detected",
            description: "Please try again and speak clearly into the microphone.",
            variant: "destructive",
          });
        }
      }, 300);
    } else {
      setTranscription("");
      finalTranscriptRef.current = "";
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        toast({
          title: "Microphone Error",
          description: "Could not start recording. Please check microphone permissions.",
          variant: "destructive",
        });
      }
    }
  };

  const getWorkoutIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("run") || lowerType.includes("jog")) return "🏃";
    if (lowerType.includes("cycl") || lowerType.includes("bike")) return "🚴";
    if (lowerType.includes("walk")) return "🚶";
    if (lowerType.includes("swim")) return "🏊";
    if (lowerType.includes("row")) return "🚣";
    if (lowerType.includes("hik")) return "🥾";
    if (lowerType.includes("ellip")) return "🏋️";
    if (lowerType.includes("stair")) return "🪜";
    if (lowerType.includes("jump") || lowerType.includes("rope")) return "⏭️";
    return "💪";
  };

  return (
    <>
      <UniversalNavigation />
      <div className="container mx-auto px-4 pb-6 max-w-2xl">
        <div className="text-center mb-6 mt-4">
          <h1 className="text-2xl font-bold mb-2">Cardio Tracker</h1>
        </div>

        {/* KPI Section */}
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Last 7 Days</p>
                <p className="text-lg font-bold text-blue-500">{kpiData.milesLast7Days.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">miles</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-2 text-center">
                <p className="text-[10px] text-muted-foreground">This Month</p>
                <p className="text-lg font-bold text-green-500">{kpiData.milesThisMonth.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">miles</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Year to Date</p>
                <p className="text-lg font-bold text-purple-500">{kpiData.milesThisYear.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">miles</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
              <CardContent className="p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Last 365 Days</p>
                <p className="text-lg font-bold text-orange-500">{kpiData.milesRolling365.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">miles</p>
              </CardContent>
            </Card>
          </div>
          <Card className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-500/20">
            <CardContent className="py-1.5 px-3 text-center">
              <p className="text-[10px] text-muted-foreground">Avg Pace (Last {kpiData.runCount} Runs)</p>
              <p className="text-base font-bold text-pink-500">{kpiData.avgPace}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex flex-col items-center">
            <Button
              data-testid="button-record-voice"
              onClick={toggleRecording}
              disabled={isProcessing}
              size="lg"
              className={`w-24 h-24 rounded-full transition-all duration-300 ${
                isRecording 
                  ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                  : isProcessing 
                    ? "bg-yellow-500" 
                    : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-10 h-10" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground text-center max-w-[100px]">
              {isProcessing 
                ? "Processing..." 
                : isRecording 
                  ? "Tap to stop" 
                  : "Tap to record"}
            </p>
          </div>

          <Card className="flex-1 bg-muted/50">
            <CardContent className="pt-3 pb-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Include in your voice input:</p>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-purple-500 font-semibold">Type</span>
                  <span className="text-muted-foreground text-[10px]">Run, Walk, Bike...</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-blue-500 font-semibold">Time</span>
                  <span className="text-muted-foreground text-[10px]">hrs, mins, secs</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-500 font-semibold">Distance</span>
                  <span className="text-muted-foreground text-[10px]">miles, km</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-orange-500 font-semibold">Calories</span>
                  <span className="text-muted-foreground text-[10px]">burned</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {transcription && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <p className="text-sm italic text-muted-foreground">"{transcription}"</p>
            </CardContent>
          </Card>
        )}

        <Collapsible className="mb-6">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              <span>Reference & Stats</span>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>svg]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {(() => {
              const runsWithPace = entries
                .filter(e => e.pace && (e.workoutType.toLowerCase().includes("run") || e.workoutType.toLowerCase().includes("jog")))
                .map(e => ({ ...e, paceSeconds: parsePaceToSeconds(e.pace) }))
                .filter((e): e is typeof e & { paceSeconds: number } => e.paceSeconds !== null)
                .sort((a, b) => a.paceSeconds - b.paceSeconds)
                .slice(0, 3);
              
              return runsWithPace.length > 0 ? (
                <Card className="mt-2 mb-3">
                  <CardContent className="p-3">
                    <h4 className="font-semibold text-sm mb-2 text-amber-500">🏆 Top 3 Runs by Pace</h4>
                    <div className="grid grid-cols-3 gap-x-2 text-sm">
                      <div className="font-semibold text-muted-foreground border-b pb-1 mb-2">Date</div>
                      <div className="font-semibold text-muted-foreground border-b pb-1 mb-2">Distance</div>
                      <div className="font-semibold text-muted-foreground border-b pb-1 mb-2">Pace</div>
                      {runsWithPace.map((run, i) => (
                        <div key={run.id} className="contents">
                          <div className={i === 0 ? "text-amber-500 font-medium" : ""}>
                            {format(new Date(run.date), "MMM d")}
                          </div>
                          <div className={i === 0 ? "text-amber-500 font-medium" : ""}>
                            {run.distance || "—"}
                          </div>
                          <div className={i === 0 ? "text-amber-500 font-medium" : ""}>
                            {run.pace}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}
            <Card className="mt-2">
              <CardContent className="p-3">
                <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Treadmill Speed → Pace</h4>
                <div className="grid grid-cols-2 gap-x-4 text-sm">
                  <div className="font-semibold text-muted-foreground border-b pb-1 mb-2">Speed (mph)</div>
                  <div className="font-semibold text-muted-foreground border-b pb-1 mb-2">Pace /mi</div>
                  <div>5.0</div><div>12:00</div>
                  <div>6.0</div><div>10:00</div>
                  <div>7.0</div><div>8:34</div>
                  <div>7.5</div><div>8:00</div>
                  <div>8.0</div><div>7:30</div>
                  <div>8.2</div><div>7:19</div>
                  <div>8.5</div><div>7:04</div>
                  <div>9.0</div><div>6:40</div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Cardio Workouts
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No cardio workouts logged yet.</p>
                <p className="text-sm mt-1">Tap the microphone to record your first workout!</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => shareWorkout({
                    id: 'template',
                    workoutType: 'Running',
                    distance: '3.1 miles',
                    duration: '23:56',
                    pace: '07:44/mile',
                    weightedVest: false,
                    date: new Date(),
                    caloriesBurned: null,
                    notes: null,
                    rawTranscription: null,
                    createdAt: null,
                  }, toast)}
                >
                  <Share className="w-4 h-4 mr-2" />
                  Test Share
                </Button>
              </CardContent>
            </Card>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id} data-testid={`card-cardio-entry-${entry.id}`} className="relative">
                {flippedCards.has(entry.id) ? (
                  <>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm text-muted-foreground">Voice Input</CardTitle>
                        </div>
                        <Button
                          data-testid={`button-flip-back-${entry.id}`}
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFlip(entry.id)}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm italic">
                        "{entry.rawTranscription || 'No transcription available'}"
                      </p>
                    </CardContent>
                  </>
                ) : (
                  <>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getWorkoutIcon(entry.workoutType)}</span>
                          <div>
                            <CardTitle className="text-lg">{entry.workoutType}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(entry.date), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            data-testid={`button-share-${entry.id}`}
                            variant="ghost"
                            size="icon"
                            onClick={() => shareWorkout(entry, toast)}
                            title="Share workout"
                          >
                            <Share className="w-4 h-4" />
                          </Button>
                          <Button
                            data-testid={`button-vest-${entry.id}`}
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleVestMutation.mutate({ id: entry.id, weightedVest: !entry.weightedVest })}
                            disabled={toggleVestMutation.isPending}
                            title={entry.weightedVest ? "Wearing weighted vest" : "No weighted vest"}
                          >
                            <Dumbbell className={`w-4 h-4 transition-colors ${entry.weightedVest ? "text-amber-500 fill-amber-500" : "text-muted-foreground/40"}`} />
                          </Button>
                          {entry.rawTranscription && (
                            <Button
                              data-testid={`button-flip-${entry.id}`}
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFlip(entry.id)}
                              title="View voice input"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            data-testid={`button-delete-cardio-${entry.id}`}
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteEntryMutation.mutate(entry.id)}
                            disabled={deleteEntryMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {entry.duration && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {entry.duration}
                          </Badge>
                        )}
                        {entry.distance && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {entry.distance}
                          </Badge>
                        )}
                        {entry.caloriesBurned && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {entry.caloriesBurned} cal
                          </Badge>
                        )}
                        {entry.pace && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Gauge className="w-3 h-3" />
                            {entry.pace}
                          </Badge>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground">{entry.notes}</p>
                      )}
                      {top3PaceRanking[entry.id] && (
                        <div className="absolute bottom-3 right-3 text-3xl">
                          {top3PaceRanking[entry.id] === 1 && "🥇"}
                          {top3PaceRanking[entry.id] === 2 && "🥈"}
                          {top3PaceRanking[entry.id] === 3 && "🥉"}
                        </div>
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}
