"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DatePickerProps {
  /** Value as YYYY-MM-DD string */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Id for the trigger (for label htmlFor / accessibility) */
  id?: string;
}

/**
 * shadcn Popover + Calendar date picker.
 * @see https://ui.shadcn.com/docs/components/radix/date-picker
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
  id,
}: DatePickerProps) {
  const date = value ? new Date(value + "T12:00:00") : undefined;

  const handleSelect = (d: Date | undefined) => {
    if (d) {
      onChange(format(d, "yyyy-MM-dd"));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          disabled={disabled}
          data-empty={!date}
          className={cn(
            "w-full justify-start text-left font-normal",
            "data-[empty=true]:text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={handleSelect} defaultMonth={date} />
      </PopoverContent>
    </Popover>
  );
}
