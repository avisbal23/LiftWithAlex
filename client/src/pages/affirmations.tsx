import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, Download, Plus, Trash2, Search, Heart, Star, RotateCcw, Shuffle, Mic, MicOff, Play, Pause, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Affirmation, InsertAffirmation } from "@shared/schema";

export default function AffirmationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [newAffirmationText, setNewAffirmationText] = useState("");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  
  // Voice recording state
  const [voiceRecordings, setVoiceRecordings] = useState<Record<string, Blob>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingAffirmationId, setRecordingAffirmationId] = useState<string | null>(null);
  const [isPlayingCombined, setIsPlayingCombined] = useState(false);
  const [recordingSupported, setRecordingSupported] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(0);
  const [playlistUrls, setPlaylistUrls] = useState<string[]>([]);
  const [pressStartTime, setPressStartTime] = useState<number | null>(null);
  const [isPressingCard, setIsPressingCard] = useState<string | null>(null);
  
  // Refs for voice recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const combinedAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all affirmations
  const { data: affirmations = [], isLoading } = useQuery<Affirmation[]>({
    queryKey: ["/api/affirmations"],
  });

  // Fetch active affirmations
  const { data: activeAffirmations = [] } = useQuery<Affirmation[]>({
    queryKey: ["/api/affirmations/active"],
  });

  // Create affirmation mutation
  const createAffirmationMutation = useMutation({
    mutationFn: (data: InsertAffirmation) => apiRequest("POST", "/api/affirmations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations/active"] });
      setNewAffirmationText("");
      toast({ title: "Affirmation added successfully!" });
    },
  });

  // Update affirmation mutation
  const updateAffirmationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertAffirmation> }) =>
      apiRequest("PATCH", `/api/affirmations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations/active"] });
    },
  });

  // Delete affirmation mutation
  const deleteAffirmationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/affirmations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations/active"] });
      toast({ title: "Affirmation deleted successfully!" });
    },
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: (affirmationsData: InsertAffirmation[]) =>
      apiRequest("POST", "/api/affirmations/bulk", affirmationsData),
    onSuccess: (result: { imported: number; total: number; errors?: string[] }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations"] });
      setImportResults({ success: result.imported, errors: result.errors || [] });
      toast({
        title: `Successfully imported ${result.imported} affirmations!`,
        description: result.errors?.length ? `${result.errors.length} items had errors.` : undefined,
      });
    },
    onError: () => {
      toast({ title: "Import failed", description: "Please check your data format.", variant: "destructive" });
    },
  });

  // Random selection mutation
  const randomSelectMutation = useMutation({
    mutationFn: async () => {
      if (affirmations.length < 10) {
        throw new Error("Need at least 10 affirmations to randomly select");
      }

      // First deactivate all current active affirmations
      const deactivatePromises = activeAffirmations.map(affirmation =>
        apiRequest("PATCH", `/api/affirmations/${affirmation.id}`, { isActive: "false" })
      );
      await Promise.all(deactivatePromises);

      // Randomly select 10 affirmations
      const shuffled = [...affirmations].sort(() => Math.random() - 0.5);
      const selectedAffirmations = shuffled.slice(0, 10);

      // Activate the selected affirmations
      const activatePromises = selectedAffirmations.map(affirmation =>
        apiRequest("PATCH", `/api/affirmations/${affirmation.id}`, { isActive: "true" })
      );
      await Promise.all(activatePromises);

      return selectedAffirmations.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/affirmations/active"] });
      toast({
        title: "Random selection complete!",
        description: `Selected ${count} affirmations randomly.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Random selection failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check MediaRecorder support on component mount
  useEffect(() => {
    const checkRecordingSupport = () => {
      setRecordingSupported(
        !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder && MediaRecorder.isTypeSupported)
      );
    };
    checkRecordingSupport();
  }, []);

  // Get supported audio MIME type
  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];
    return types.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
  };

  // Start recording for a specific affirmation
  const startRecording = async (affirmationId: string) => {
    if (!recordingSupported) {
      toast({
        title: "Recording not supported",
        description: "Your browser doesn't support voice recording.",
        variant: "destructive"
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      const mimeType = getSupportedMimeType();
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      audioChunksRef.current = [];
      setIsRecording(true);
      setRecordingAffirmationId(affirmationId);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setVoiceRecordings(prev => ({
          ...prev,
          [affirmationId]: blob
        }));
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordingAffirmationId(null);
        
        toast({
          title: "Recording saved!",
          description: "Voice memo recorded successfully."
        });
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('Recording error:', event);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordingAffirmationId(null);
        toast({
          title: "Recording failed",
          description: "There was an error recording your voice memo.",
          variant: "destructive"
        });
      };

      mediaRecorderRef.current.start(1000); // 1-second chunks
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
      setRecordingAffirmationId(null);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record voice memos.",
        variant: "destructive"
      });
    }
  };

  // Stop current recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Delete a voice recording
  const deleteRecording = (affirmationId: string) => {
    setVoiceRecordings(prev => {
      const updated = { ...prev };
      delete updated[affirmationId];
      return updated;
    });
    toast({
      title: "Recording deleted",
      description: "Voice memo removed successfully."
    });
  };

  // Handle tap and hold recording
  const handleCardPressStart = (affirmationId: string, event: React.TouchEvent | React.MouseEvent) => {
    event.preventDefault();
    if (isRecording) return; // Don't start new recording if already recording
    
    const currentTime = Date.now();
    setPressStartTime(currentTime);
    setIsPressingCard(affirmationId);
    
    // Start recording after 300ms hold
    setTimeout(() => {
      if (isPressingCard === affirmationId && pressStartTime === currentTime) {
        startRecording(affirmationId);
      }
    }, 300);
  };

  const handleCardPressEnd = (affirmationId: string, event: React.TouchEvent | React.MouseEvent) => {
    event.preventDefault();
    setPressStartTime(null);
    setIsPressingCard(null);
    
    // Stop recording if currently recording this affirmation
    if (recordingAffirmationId === affirmationId && isRecording) {
      stopRecording();
    }
  };

  // Prevent context menu on long press
  const handleCardContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  // Initialize AudioContext
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Convert blob to ArrayBuffer
  const blobToArrayBuffer = async (blob: Blob): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  };

  // Detect silence threshold and trim audio
  const trimSilence = (audioBuffer: AudioBuffer, threshold = 0.01): AudioBuffer => {
    const audioContext = getAudioContext();
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Find start of audio (first sample above threshold)
    let startSample = 0;
    for (let i = 0; i < channelData.length; i++) {
      if (Math.abs(channelData[i]) > threshold) {
        startSample = Math.max(0, i - Math.floor(sampleRate * 0.1)); // Keep 0.1s before
        break;
      }
    }
    
    // Find end of audio (last sample above threshold)
    let endSample = channelData.length;
    for (let i = channelData.length - 1; i >= 0; i--) {
      if (Math.abs(channelData[i]) > threshold) {
        endSample = Math.min(channelData.length, i + Math.floor(sampleRate * 0.1)); // Keep 0.1s after
        break;
      }
    }
    
    // Create trimmed audio buffer
    const trimmedLength = endSample - startSample;
    const trimmedBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      trimmedLength,
      audioBuffer.sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const originalData = audioBuffer.getChannelData(channel);
      const trimmedData = trimmedBuffer.getChannelData(channel);
      for (let i = 0; i < trimmedLength; i++) {
        trimmedData[i] = originalData[startSample + i];
      }
    }
    
    return trimmedBuffer;
  };

  // Concatenate multiple audio buffers into one
  const concatenateAudioBuffers = (buffers: AudioBuffer[]): AudioBuffer => {
    if (buffers.length === 0) throw new Error('No audio buffers to concatenate');
    
    const audioContext = getAudioContext();
    const sampleRate = buffers[0].sampleRate;
    const numberOfChannels = buffers[0].numberOfChannels;
    
    // Calculate total length
    const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
    
    // Create combined buffer
    const combinedBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);
    
    // Copy data from all buffers
    let offset = 0;
    for (const buffer of buffers) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const combinedData = combinedBuffer.getChannelData(channel);
        const bufferData = buffer.getChannelData(channel);
        combinedData.set(bufferData, offset);
      }
      offset += buffer.length;
    }
    
    return combinedBuffer;
  };

  // Process and combine all recordings with silence removal
  const createGaplessAudio = async (): Promise<AudioBuffer | null> => {
    try {
      // Check Web Audio API support
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        throw new Error('Web Audio API not supported in this browser');
      }

      const recordedAffirmations = activeAffirmations.filter(aff => voiceRecordings[aff.id]);
      
      if (recordedAffirmations.length === 0) {
        toast({
          title: "No recordings found",
          description: "Please record voice memos for your active affirmations first.",
          variant: "destructive"
        });
        return null;
      }

      const audioContext = getAudioContext();
      
      // Ensure audio context is running
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const audioBuffers: AudioBuffer[] = [];

      // Process each recording
      for (const affirmation of recordedAffirmations) {
        const blob = voiceRecordings[affirmation.id];
        const arrayBuffer = await blobToArrayBuffer(blob);
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const trimmedBuffer = trimSilence(audioBuffer);
        audioBuffers.push(trimmedBuffer);
      }

      // Concatenate all trimmed buffers
      const combinedBuffer = concatenateAudioBuffers(audioBuffers);
      return combinedBuffer;
      
    } catch (error) {
      console.error('Error creating gapless audio:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      toast({
        title: "Audio processing failed",
        description: error instanceof Error ? error.message : "Could not combine recordings. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  // Prepare sequential playlist
  const preparePlaylist = () => {
    const recordedAffirmations = activeAffirmations.filter(aff => voiceRecordings[aff.id]);
    
    if (recordedAffirmations.length === 0) {
      toast({
        title: "No recordings found",
        description: "Please record voice memos for your active affirmations first.",
        variant: "destructive"
      });
      return [];
    }

    // Clean up previous URLs
    playlistUrls.forEach(url => URL.revokeObjectURL(url));

    // Create individual audio URLs for each recording
    const urls = recordedAffirmations.map(affirmation => {
      const recording = voiceRecordings[affirmation.id];
      return URL.createObjectURL(recording);
    });
    
    setPlaylistUrls(urls);
    setCurrentPlayingIndex(0);
    
    return urls;
  };

  // Play recordings sequentially with minimal gaps
  const playSequentially = (urls: string[], index: number = 0) => {
    if (index >= urls.length) {
      // All recordings finished
      setIsPlayingCombined(false);
      setCurrentPlayingIndex(0);
      return;
    }

    const audio = new Audio(urls[index]);
    currentAudioRef.current = audio;
    setCurrentPlayingIndex(index);
    
    // Preload next audio for smoother transitions
    if (index + 1 < urls.length) {
      const nextAudio = new Audio(urls[index + 1]);
      nextAudio.preload = 'auto';
    }
    
    audio.onplay = () => setIsPlayingCombined(true);
    audio.onended = () => {
      // Minimize gap by immediately playing next
      setTimeout(() => playSequentially(urls, index + 1), 50); // 50ms minimal gap
    };
    audio.onerror = () => {
      setIsPlayingCombined(false);
      toast({
        title: "Playback failed",
        description: `Error playing recording ${index + 1}`,
        variant: "destructive"
      });
    };

    audio.play().catch(error => {
      console.error('Playback error:', error);
      setIsPlayingCombined(false);
      toast({
        title: "Playback failed",
        description: `Could not play recording ${index + 1}`,
        variant: "destructive"
      });
    });
  };

  // Play recordings with minimal gaps
  const playCombinedRecording = () => {
    const urls = preparePlaylist();
    if (urls.length === 0) return;

    // Stop any current audio playback
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    if (combinedAudioSourceRef.current) {
      combinedAudioSourceRef.current.stop();
    }

    playSequentially(urls, 0);
    
    toast({
      title: "Playing recordings!",
      description: `Playing ${urls.length} voice memos with minimal gaps.`
    });
  };

  // Stop audio playback
  const stopCombinedRecording = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    if (combinedAudioSourceRef.current) {
      combinedAudioSourceRef.current.stop();
      combinedAudioSourceRef.current = null;
    }
    setIsPlayingCombined(false);
    setCurrentPlayingIndex(0);
  };

  // Clean up audio URLs and context on component unmount
  useEffect(() => {
    return () => {
      // Clean up URLs
      playlistUrls.forEach(url => URL.revokeObjectURL(url));
      Object.values(voiceRecordings).forEach(blob => {
        if (blob instanceof Blob) {
          URL.revokeObjectURL(URL.createObjectURL(blob));
        }
      });
      
      // Clean up Web Audio API resources
      if (combinedAudioSourceRef.current) {
        try {
          combinedAudioSourceRef.current.stop();
        } catch (error) {
          // Source may already be stopped
        }
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [playlistUrls, voiceRecordings]);

  const handleAddAffirmation = () => {
    if (!newAffirmationText.trim()) return;
    
    createAffirmationMutation.mutate({
      text: newAffirmationText.trim(),
      isActive: "false",
    });
  };

  const handleToggleActive = (affirmation: Affirmation) => {
    const isCurrentlyActive = affirmation.isActive === "true";
    
    // Check if trying to activate and already at limit
    if (!isCurrentlyActive && activeAffirmations.length >= 10) {
      toast({
        title: "Maximum affirmations reached",
        description: "You can only have 10 active affirmations at once. Deactivate one first.",
        variant: "destructive",
      });
      return;
    }

    updateAffirmationMutation.mutate({
      id: affirmation.id,
      data: { isActive: isCurrentlyActive ? "false" : "true" },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this affirmation?")) {
      deleteAffirmationMutation.mutate(id);
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;

    // Parse the text file - one affirmation per line
    const lines = importText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const affirmationsData: InsertAffirmation[] = lines.map(line => ({
      text: line,
      isActive: "false",
    }));

    bulkImportMutation.mutate(affirmationsData);
    setImportText("");
  };

  const handleRandomSelect = () => {
    if (affirmations.length < 10) {
      toast({
        title: "Not enough affirmations",
        description: "You need at least 10 affirmations to use random selection.",
        variant: "destructive",
      });
      return;
    }

    if (confirm("This will replace your current active affirmations with 10 randomly selected ones. Continue?")) {
      randomSelectMutation.mutate();
    }
  };

  const handleExport = () => {
    const exportData = affirmations.map(a => a.text).join('\n');
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'affirmations.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredAffirmations = affirmations.filter(affirmation =>
    affirmation.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading affirmations...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affirmations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Positive affirmations to boost your mindset and confidence
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-import-affirmations">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Import Affirmations</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="import-text">Paste affirmations (one per line)</Label>
                  <Textarea
                    id="import-text"
                    placeholder="I am confident and capable.&#10;I deserve success and happiness.&#10;I am worthy of love and respect."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="min-h-[200px]"
                    data-testid="textarea-import-affirmations"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleImport}
                    disabled={!importText.trim() || bulkImportMutation.isPending}
                    data-testid="button-confirm-import"
                  >
                    {bulkImportMutation.isPending ? "Importing..." : "Import Affirmations"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsImportDialogOpen(false)}
                    data-testid="button-cancel-import"
                  >
                    Cancel
                  </Button>
                </div>

                {importResults && (
                  <div className="space-y-2">
                    <div className="text-sm text-green-600 dark:text-green-400">
                      ✓ Successfully imported {importResults.success} affirmations
                    </div>
                    {importResults.errors.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-sm text-red-600 dark:text-red-400">
                          Errors encountered:
                        </div>
                        <div className="text-xs text-red-500 dark:text-red-400 max-h-32 overflow-y-auto">
                          {importResults.errors.map((error, index) => (
                            <div key={index}>• {error}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleExport} data-testid="button-export-affirmations">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Voice Memo Recording Section */}
      {recordingSupported && activeAffirmations.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-blue-600" />
              Voice Memo Recording
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tap & hold any affirmation card to record yourself saying it, then play back all recordings combined
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tap and Hold Recording Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeAffirmations.map((affirmation) => {
                const hasRecording = !!voiceRecordings[affirmation.id];
                const isCurrentlyRecording = recordingAffirmationId === affirmation.id;
                const isBeingPressed = isPressingCard === affirmation.id;
                
                return (
                  <div 
                    key={affirmation.id}
                    className={`relative p-3 rounded-lg border cursor-pointer transition-all duration-200 select-none ${
                      isCurrentlyRecording 
                        ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700 shadow-lg' 
                        : isBeingPressed
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700 transform scale-95'
                        : hasRecording 
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 hover:shadow-md' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700'
                    }`}
                    onTouchStart={(e) => handleCardPressStart(affirmation.id, e)}
                    onTouchEnd={(e) => handleCardPressEnd(affirmation.id, e)}
                    onMouseDown={(e) => handleCardPressStart(affirmation.id, e)}
                    onMouseUp={(e) => handleCardPressEnd(affirmation.id, e)}
                    onMouseLeave={(e) => handleCardPressEnd(affirmation.id, e)}
                    onContextMenu={handleCardContextMenu}
                    data-testid={`card-affirmation-${affirmation.id}`}
                  >
                    {/* Recording Status Indicator */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isCurrentlyRecording && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">REC</span>
                          </div>
                        )}
                        {hasRecording && !isCurrentlyRecording && (
                          <div className="flex items-center gap-1">
                            <Mic className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓</span>
                          </div>
                        )}
                        {!hasRecording && !isCurrentlyRecording && !isBeingPressed && (
                          <Mic className="h-3 w-3 text-gray-400" />
                        )}
                        {isBeingPressed && !isCurrentlyRecording && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Hold...</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Delete button for existing recordings */}
                      {hasRecording && !isCurrentlyRecording && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRecording(affirmation.id);
                          }}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950/20"
                          data-testid={`button-delete-recording-${affirmation.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Affirmation Text */}
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                      {affirmation.text}
                    </p>
                    
                    {/* Instruction Text */}
                    <div className="mt-2">
                      {isCurrentlyRecording ? (
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                          🎙️ Recording... Release to stop
                        </p>
                      ) : hasRecording ? (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          ✓ Recorded • Tap & hold to re-record
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Tap & hold to record
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Combined Playback Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {Object.keys(voiceRecordings).filter(id => activeAffirmations.some(a => a.id === id)).length} / {activeAffirmations.length} recorded
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                {Object.keys(voiceRecordings).some(id => activeAffirmations.some(a => a.id === id)) && (
                  <>
                    {isPlayingCombined ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={stopCombinedRecording}
                        className="bg-red-600 hover:bg-red-700"
                        data-testid="button-stop-combined-playback"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Stop Playback
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={playCombinedRecording}
                        disabled={isRecording}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="button-play-combined-recording"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Play All
                      </Button>
                    )}
                    
                    {isPlayingCombined && (
                      <Badge variant="secondary" className="text-xs">
                        Playing {currentPlayingIndex + 1} of {playlistUrls.length}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Recording Status */}
            {isRecording && recordingAffirmationId && (
              <div className="flex items-center justify-center p-2 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Recording in progress...</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Show recording not supported message */}
      {!recordingSupported && activeAffirmations.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center gap-2 p-4">
            <MicOff className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Voice recording is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active Affirmations Cards */}
      {activeAffirmations.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Active Affirmations</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomSelect}
                disabled={affirmations.length < 10 || randomSelectMutation.isPending}
                data-testid="button-random-select"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                {randomSelectMutation.isPending ? "Selecting..." : "Random 10"}
              </Button>
              <Badge variant="secondary" data-testid="badge-active-count">
                {activeAffirmations.length}/10 active
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeAffirmations.map((affirmation) => (
              <Card key={affirmation.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-green-500" data-testid={`card-active-affirmation-${affirmation.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Heart className="h-5 w-5 text-green-500 fill-current" />
                    </div>
                    <p className="text-sm leading-relaxed font-medium text-gray-900 dark:text-gray-100">
                      {affirmation.text}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        affirmations.length >= 10 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Active Affirmations</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRandomSelect}
                  disabled={affirmations.length < 10 || randomSelectMutation.isPending}
                  data-testid="button-random-select-empty"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  {randomSelectMutation.isPending ? "Selecting..." : "Random 10"}
                </Button>
                <Badge variant="secondary" data-testid="badge-active-count-empty">
                  0/10 active
                </Badge>
              </div>
            </div>
            <Card className="text-center py-8">
              <CardContent>
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No active affirmations selected. Choose your favorites manually or use random selection.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null
      )}

      {/* Add New Affirmation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Affirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Enter your positive affirmation..."
              value={newAffirmationText}
              onChange={(e) => setNewAffirmationText(e.target.value)}
              className="min-h-[80px]"
              data-testid="textarea-new-affirmation"
            />
            <Button
              onClick={handleAddAffirmation}
              disabled={!newAffirmationText.trim() || createAffirmationMutation.isPending}
              data-testid="button-add-affirmation"
            >
              {createAffirmationMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Affirmations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Affirmations ({affirmations.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search affirmations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-affirmations"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAffirmations.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? "No affirmations match your search." : "No affirmations yet. Add your first one above!"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Active</TableHead>
                  <TableHead>Affirmation</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffirmations.map((affirmation) => (
                  <TableRow key={affirmation.id} data-testid={`row-affirmation-${affirmation.id}`}>
                    <TableCell>
                      <Checkbox
                        checked={affirmation.isActive === "true"}
                        onCheckedChange={() => handleToggleActive(affirmation)}
                        disabled={updateAffirmationMutation.isPending}
                        data-testid={`checkbox-active-${affirmation.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <span data-testid={`text-affirmation-${affirmation.id}`}>
                        {affirmation.text}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(affirmation.id)}
                        disabled={deleteAffirmationMutation.isPending}
                        data-testid={`button-delete-${affirmation.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}