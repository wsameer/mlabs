import { useEffect, useRef, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";

export interface SearchInputProps {
  value: string;
  onDebouncedChange: (next: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  value,
  onDebouncedChange,
  placeholder = "Search description…",
  debounceMs = 250,
  className,
}: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (value !== prevValue) {
    setPrevValue(value);
    setLocal(value);
  }

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (local === value) return;
    timer.current = setTimeout(() => onDebouncedChange(local), debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [local, value, debounceMs, onDebouncedChange]);

  return (
    <div className={`relative flex items-center ${className ?? ""}`}>
      <SearchIcon className="pointer-events-none absolute left-2 size-3.5 text-muted-foreground" />
      <Input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="h-8 pl-7 pr-7 text-xs"
      />
      {local.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 size-6"
          aria-label="Clear search"
          onClick={() => {
            setLocal("");
            onDebouncedChange("");
          }}
        >
          <XIcon className="size-3" />
        </Button>
      )}
    </div>
  );
}
