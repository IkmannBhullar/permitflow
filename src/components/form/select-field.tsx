"use client"

import { useId } from "react"
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type SelectOption = { value: string; label: string }

/** Radix Select cannot hold an empty value, so "no selection" travels as this sentinel. */
const NONE = "__none__"

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  description,
  placeholder = "Select…",
  noneLabel,
}: {
  control: Control<T>
  name: FieldPath<T>
  label: string
  options: SelectOption[]
  description?: string
  placeholder?: string
  /** When set, adds an option that maps to null (e.g. "Unassigned"). */
  noneLabel?: string
}) {
  const id = useId()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Select
            name={field.name}
            value={field.value ?? (noneLabel ? NONE : "")}
            onValueChange={(v) => field.onChange(v === NONE ? null : v)}
          >
            <SelectTrigger
              id={id}
              aria-invalid={fieldState.invalid}
              className="w-full"
              onBlur={field.onBlur}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {noneLabel ? <SelectItem value={NONE}>{noneLabel}</SelectItem> : null}
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
