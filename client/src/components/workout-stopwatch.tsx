import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Play, Pause, RotateCcw, Clock, ChevronDown, ChevronUp, Timer } from "lucide-react";

interface LapTime {
  id: number;
  time: string;
  lapTime: string;
}

export default function WorkoutStopwatch() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [laps, setLaps] = useState<LapTime[]>([]);
  const [lastLapTime, setLastLapTime] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format time display (MM:SS.ms)
  const formatTime = (timeInMs: number): string => {
    const minutes = Math.floor(timeInMs / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    const milliseconds = Math.floor((timeInMs % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Start/stop timer
  const toggleTimer = () => {
    if (isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 10);
      }, 10);
    }
    setIsRunning(!isRunning);
  };

  // Reset timer
  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    setLastLapTime(0);
  };

  // Add lap
  const addLap = () => {
    if (time > 0) {
      const lapTime = time - lastLapTime;
      const newLap: LapTime = {
        id: laps.length + 1,
        time: formatTime(time),
        lapTime: formatTime(lapTime)
      };
      setLaps(prev => [newLap, ...prev]);
      setLastLapTime(time);
    }
  };

  // Auto-clear at midnight
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const timeUntilMidnight = midnight.getTime() - now.getTime();
      
      setTimeout(() => {
        resetTimer();
        // Set up next midnight check
        const nextCheck = setInterval(() => {
          const currentTime = new Date();
          if (currentTime.getHours() === 0 && currentTime.getMinutes() === 0) {
            resetTimer();
          }
        }, 60000); // Check every minute after midnight
        
        return () => clearInterval(nextCheck);
      }, timeUntilMidnight);
    };

    checkMidnight();
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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
                {isRunning && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    <Clock className="w-3 h-3 mr-1" />
                    Running
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatTime(time)}
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
                className={isRunning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                data-testid="button-timer-toggle"
              >
                {isRunning ? (
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
                disabled={time === 0}
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
                disabled={time === 0 && laps.length === 0}
                data-testid="button-reset"
                className="backdrop-blur-sm bg-white/50 dark:bg-gray-700/50 border-white/30 dark:border-gray-500/40"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Lap Times */}
            {laps.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Lap Times</h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {laps.map((lap) => (
                    <div
                      key={lap.id}
                      className="flex justify-between items-center p-2 rounded-md backdrop-blur-sm bg-white/20 dark:bg-gray-600/20 border border-white/20 dark:border-gray-500/30"
                      data-testid={`lap-${lap.id}`}
                    >
                      <span className="text-sm font-medium">Lap {lap.id}</span>
                      <div className="flex gap-4 text-sm font-mono">
                        <span className="text-muted-foreground">+{lap.lapTime}</span>
                        <span className="font-medium">{lap.time}</span>
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