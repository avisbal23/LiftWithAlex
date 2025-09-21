import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Play, Pause, RotateCcw, Clock, ChevronDown, ChevronUp, Timer } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface LapTime {
  id: number;
  lapTime: string;
  lapTimeMs: number;
  startedAtMs: number;
}

interface StopwatchState {
  isRunning: boolean;
  sessionStartEpochMs: number;
  lapStartEpochMs: number;
  elapsedBeforeStartMs: number;
  lapElapsedBeforeStartMs: number;
  laps: LapTime[];
  dateKey: string;
  autoResetDaily: boolean;
}

interface WorkoutStopwatchProps {
  storageKey?: string;
}

export default function WorkoutStopwatch({ storageKey = "workout-stopwatch" }: WorkoutStopwatchProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const animationRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Get today's date key for daily reset
  const getTodayKey = (): string => {
    return new Date().toDateString();
  };

  // Default state
  const getDefaultState = (): StopwatchState => ({
    isRunning: false,
    sessionStartEpochMs: 0,
    lapStartEpochMs: 0,
    elapsedBeforeStartMs: 0,
    lapElapsedBeforeStartMs: 0,
    laps: [],
    dateKey: getTodayKey(),
    autoResetDaily: true
  });

  // Load timer state from database
  const { data: timerData, isLoading: isLoadingTimer } = useQuery({
    queryKey: ["/api/timers", storageKey],
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch(`/api/timers/${storageKey}`, { credentials: "include" });
        if (response.status === 404) {
          return null; // Timer doesn't exist yet
        }
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error: any) {
        if (error?.message?.includes('404')) {
          return null; // Timer doesn't exist yet
        }
        throw error;
      }
    }
  });

  // Convert database response to local state format
  const loadStateFromAPI = (): StopwatchState => {
    if (!timerData) return getDefaultState();

    try {
      // Check if we need to reset daily
      if (timerData.autoResetDaily && timerData.dateKey !== getTodayKey()) {
        return getDefaultState();
      }

      // Convert database lap times to local format
      const laps: LapTime[] = (timerData.lapTimes || []).map((dbLap: any) => ({
        id: dbLap.lapId,
        lapTime: dbLap.lapTime,
        lapTimeMs: dbLap.lapTimeMs,
        startedAtMs: dbLap.startedAtMs,
      }));

      return {
        isRunning: timerData.isRunning === 1,
        sessionStartEpochMs: timerData.sessionStartEpochMs || 0,
        lapStartEpochMs: timerData.lapStartEpochMs || 0,
        elapsedBeforeStartMs: timerData.elapsedBeforeStartMs || 0,
        lapElapsedBeforeStartMs: timerData.lapElapsedBeforeStartMs || 0,
        laps,
        dateKey: timerData.dateKey || getTodayKey(),
        autoResetDaily: timerData.autoResetDaily === 1,
      };
    } catch (error) {
      console.warn('Failed to parse timer data:', error);
      return getDefaultState();
    }
  };

  const [state, setState] = useState<StopwatchState>(getDefaultState);

  // Update local state when timer data loads from API
  useEffect(() => {
    if (!isLoadingTimer) {
      setState(loadStateFromAPI());
    }
  }, [timerData, isLoadingTimer, getTodayKey]);

  // Mutation to save timer state to database
  const saveTimerMutation = useMutation({
    mutationFn: async (newState: StopwatchState) => {
      // Convert local state to database format
      const timerPayload = {
        storageKey,
        isRunning: newState.isRunning ? 1 : 0,
        sessionStartEpochMs: newState.sessionStartEpochMs,
        lapStartEpochMs: newState.lapStartEpochMs,
        elapsedBeforeStartMs: newState.elapsedBeforeStartMs,
        lapElapsedBeforeStartMs: newState.lapElapsedBeforeStartMs,
        dateKey: newState.dateKey,
        autoResetDaily: newState.autoResetDaily ? 1 : 0,
      };

      // Save timer state
      const response = await apiRequest("PUT", `/api/timers/${storageKey}`, timerPayload);
      const timer = await response.json();

      // Clear existing lap times and save new ones
      await apiRequest("DELETE", `/api/timers/${storageKey}/laps`);
      
      // Save lap times if any exist
      if (newState.laps.length > 0) {
        for (const lap of newState.laps) {
          const lapPayload = {
            lapId: lap.id,
            lapTime: lap.lapTime,
            lapTimeMs: lap.lapTimeMs,
            startedAtMs: lap.startedAtMs,
          };
          await apiRequest("POST", `/api/timers/${storageKey}/laps`, lapPayload);
        }
      }

      return timer;
    },
    onSuccess: () => {
      // Invalidate the timer query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/timers", storageKey] });
    },
    onError: (error) => {
      console.warn('Failed to save timer state:', error);
    }
  });

  // Save state to database
  const saveStateToStorage = useCallback((newState: StopwatchState) => {
    saveTimerMutation.mutate(newState);
  }, [saveTimerMutation]);

  // Save state (throttled for non-critical updates)
  const saveState = useCallback((newState: StopwatchState, immediate = false) => {
    setState(newState);
    
    if (immediate) {
      // Critical actions save immediately
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      saveStateToStorage(newState);
    } else {
      // Throttled saves for animations/UI updates
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveStateToStorage(newState);
      }, 100);
    }
  }, [saveStateToStorage]);

  // Flush any pending saves immediately
  const flushSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
      // Save current state immediately
      saveStateToStorage(state);
    }
  }, [saveStateToStorage, state]);

  // Format time display (HH:MM:SS.ms or MM:SS.ms)
  const formatTime = (timeInMs: number): string => {
    const hours = Math.floor(timeInMs / 3600000);
    const minutes = Math.floor((timeInMs % 3600000) / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    const milliseconds = Math.floor((timeInMs % 1000) / 10);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }
  };

  // Calculate total elapsed time
  const getTotalElapsedTime = (): number => {
    const now = currentTime;
    const runningTime = state.isRunning ? Math.max(0, now - state.sessionStartEpochMs) : 0;
    return runningTime + state.elapsedBeforeStartMs;
  };

  // Calculate current lap time
  const getCurrentLapTime = (): number => {
    const now = currentTime;
    const runningLapTime = state.isRunning ? Math.max(0, now - state.lapStartEpochMs) : 0;
    return runningLapTime + state.lapElapsedBeforeStartMs;
  };

  // Calculate total time across all laps (including current lap)
  const getTotalTime = (): number => {
    const completedLapsTime = state.laps.reduce((total, lap) => total + lap.lapTimeMs, 0);
    const currentLapTime = getCurrentLapTime();
    return completedLapsTime + currentLapTime;
  };

  // Start/stop timer
  const toggleTimer = () => {
    const now = Date.now();
    
    if (state.isRunning) {
      // Pause: save elapsed time and stop
      const runningTime = Math.max(0, now - state.sessionStartEpochMs);
      const runningLapTime = Math.max(0, now - state.lapStartEpochMs);
      
      saveState({
        ...state,
        isRunning: false,
        elapsedBeforeStartMs: state.elapsedBeforeStartMs + runningTime,
        lapElapsedBeforeStartMs: state.lapElapsedBeforeStartMs + runningLapTime
      }, true); // immediate save
    } else {
      // Start: begin timing from now
      saveState({
        ...state,
        isRunning: true,
        sessionStartEpochMs: now,
        lapStartEpochMs: now
      }, true); // immediate save
    }
  };

  // Reset timer
  const resetTimer = () => {
    saveState(getDefaultState(), true); // immediate save
  };

  // Add lap
  const addLap = () => {
    const currentLapTime = getCurrentLapTime();
    if (currentLapTime > 0) {
      const now = Date.now();
      const newLap: LapTime = {
        id: state.laps.length + 1,
        lapTime: formatTime(currentLapTime),
        lapTimeMs: currentLapTime,
        startedAtMs: now - currentLapTime
      };

      saveState({
        ...state,
        laps: [newLap, ...state.laps],
        lapStartEpochMs: now,
        lapElapsedBeforeStartMs: 0
      }, true); // immediate save
    }
  };

  // Animation loop for smooth UI updates
  useEffect(() => {
    if (state.isRunning) {
      const animate = () => {
        setCurrentTime(Date.now());
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isRunning]);

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `stopwatch-${storageKey}` && e.newValue) {
        try {
          const newState: StopwatchState = JSON.parse(e.newValue);
          setState(newState);
        } catch (error) {
          console.warn('Failed to sync stopwatch state:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  // Add event listeners for tab close/visibility change to flush saves
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushSave();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        flushSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [flushSave]);

  const currentLapTime = getCurrentLapTime();
  const totalTime = getTotalTime();

  return (
    <Card className="mt-6 mb-6 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border border-white/30 dark:border-gray-700/50">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/20 to-transparent dark:from-gray-400/10"></div>
      
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <CollapsibleTrigger asChild>
          <CardHeader className="relative z-10 pb-3 cursor-pointer hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-lg">Workout Timer</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatTime(currentLapTime)}
                </span>
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="relative z-10 pt-0">
            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <Button
                onClick={toggleTimer}
                size="sm"
                className={state.isRunning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                data-testid="button-timer-toggle"
              >
                {state.isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </>
                )}
              </Button>

              <Button
                onClick={addLap}
                size="sm"
                variant="outline"
                disabled={currentLapTime === 0}
                data-testid="button-lap"
                className="backdrop-blur-sm bg-white/50 dark:bg-gray-700/50 border-white/30 dark:border-gray-500/40"
              >
                <Clock className="w-4 h-4 mr-2" />
                Lap
              </Button>

              <Button
                onClick={resetTimer}
                size="sm"
                variant="outline"
                disabled={currentLapTime === 0 && state.laps.length === 0}
                data-testid="button-reset"
                className="backdrop-blur-sm bg-white/50 dark:bg-gray-700/50 border-white/30 dark:border-gray-500/40"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Lap Times */}
            {state.laps.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Lap Times</h3>
                  <div className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400">
                    Total: {formatTime(totalTime)}
                  </div>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {state.laps.map((lap) => (
                    <div
                      key={lap.id}
                      className="flex justify-between items-center p-2 rounded-md backdrop-blur-sm bg-white/20 dark:bg-gray-600/20 border border-white/20 dark:border-gray-500/30"
                      data-testid={`lap-${lap.id}`}
                    >
                      <span className="text-sm font-medium">Lap {lap.id}</span>
                      <div className="flex gap-4 text-sm font-mono">
                        <span className="font-medium">{lap.lapTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}