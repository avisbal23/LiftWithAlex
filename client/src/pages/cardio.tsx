import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UniversalNavigation } from "@/components/UniversalNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Loader2, Trash2, Clock, MapPin, Activity, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { CardioLogEntry } from "@shared/schema";

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
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");

  const { data: entries = [], isLoading } = useQuery<CardioLogEntry[]>({
    queryKey: ["/api/cardio-log-entries"],
  });

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
        <div className="text-center mb-8 mt-4">
          <h1 className="text-2xl font-bold mb-2">Cardio Tracker</h1>
          <p className="text-muted-foreground text-sm">
            Tap the microphone and describe your workout
          </p>
        </div>

        <div className="flex flex-col items-center mb-8">
          <Button
            data-testid="button-record-voice"
            onClick={toggleRecording}
            disabled={isProcessing}
            size="lg"
            className={`w-32 h-32 rounded-full transition-all duration-300 ${
              isRecording 
                ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                : isProcessing 
                  ? "bg-yellow-500" 
                  : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-12 h-12 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-12 h-12" />
            ) : (
              <Mic className="w-12 h-12" />
            )}
          </Button>
          
          <p className="mt-4 text-sm text-muted-foreground">
            {isProcessing 
              ? "Processing your workout..." 
              : isRecording 
                ? "Listening... Tap to stop and save" 
                : "Tap to start recording"}
          </p>

          {transcription && (
            <Card className="mt-4 w-full">
              <CardContent className="pt-4">
                <p className="text-sm italic text-muted-foreground">"{transcription}"</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Workouts
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
              </CardContent>
            </Card>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id} data-testid={`card-cardio-entry-${entry.id}`}>
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
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-muted-foreground">{entry.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}
