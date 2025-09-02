import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";

interface OptimizedInputProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  min?: string;
  max?: string;
  "data-testid"?: string;
  debounceMs?: number;
}

export function OptimizedInput({
  value,
  onChange,
  type = "text",
  placeholder,
  className,
  min,
  max,
  "data-testid": testId,
  debounceMs = 500
}: OptimizedInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Update local value when prop changes (from external updates)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === "number" ? 
      (parseInt(e.target.value) || 0) : 
      e.target.value;
    
    // Update local state immediately for responsive UI
    setLocalValue(newValue);
    
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Set new timeout for API call
    const newTimeoutId = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
    
    setTimeoutId(newTimeoutId);
  }, [onChange, type, timeoutId, debounceMs]);

  return (
    <Input
      type={type}
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      min={min}
      max={max}
      data-testid={testId}
    />
  );
}