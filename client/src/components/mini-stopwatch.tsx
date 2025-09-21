import { useState, useEffect, useRef } from "react";
import { Timer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

interface MiniStopwatchProps {
  storageKey?: string;
}

export default function MiniStopwatch({ storageKey = "workout-stopwatch" }: MiniStopwatchProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const animationRef = useRef<number | null>(null);

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
  const { data: timerData } = useQuery({
    queryKey: ["/api/timers", storageKey],
    retry: false,
    refetchInterval: 1000, // Refresh every second for live updates
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

  const state = loadStateFromAPI();

  // Format time display (compact version)
  const formatTime = (timeInMs: number): string => {
    const hours = Math.floor(timeInMs / 3600000);
    const minutes = Math.floor((timeInMs % 3600000) / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
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

  const totalTime = getTotalTime();
  const isRunning = state.isRunning;

  return (
    <div className="flex items-center space-x-2 px-3 py-1 rounded-md backdrop-blur-sm bg-white/10 dark:bg-gray-600/20 border border-white/20 dark:border-gray-500/30">
      <Timer className={`w-4 h-4 ${isRunning ? 'text-green-400' : 'text-white'} drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]`} />
      <span className={`text-sm font-mono font-semibold ${isRunning ? 'text-green-400' : 'text-white'} drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]`}>
        {formatTime(totalTime)}
      </span>
    </div>
  );
}