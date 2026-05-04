import { useState } from "react";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@workspace/ui/components/calendar";
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";

import { parseDateString, toDateString } from "@/lib/timezone";

interface DatePickerFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  testId?: string;
}

function formatDisplayDate(date: Date | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined): boolean {
  return !!date && !isNaN(date.getTime());
}

export function DatePickerField({
  id,
  label,
  value,
  onChange,
  error,
  testId,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseDateString(value) : undefined;
  const [month, setMonth] = useState<Date | undefined>(selectedDate);

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          value={formatDisplayDate(selectedDate)}
          placeholder="January 01, 2026"
          className="text-xs"
          data-testid={testId}
          onChange={(e) => {
            const parsed = new Date(e.target.value);
            if (isValidDate(parsed)) {
              onChange(toDateString(parsed));
              setMonth(parsed);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <InputGroupButton
                  variant="ghost"
                  aria-label="Select date"
                  data-testid={testId ? `${testId}-trigger` : undefined}
                >
                  <CalendarIcon />
                </InputGroupButton>
              }
            />
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                month={month}
                onMonthChange={setMonth}
                onSelect={(date) => {
                  if (date) {
                    onChange(toDateString(date));
                    setMonth(date);
                  }
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
