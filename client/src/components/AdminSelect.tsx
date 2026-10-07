"use client";

/**
 * AdminSelect — the one dropdown for the admin dashboard.
 *
 * It takes `<option>` children and an `onChange` receiving `{ target: { value } }`, like a native
 * `<select>`, so forms can switch to it without rewriting their handlers. It renders a styled
 * Radix menu in the admin palette (Settings → Appearance). An `<option value="">` becomes the
 * empty choice and is shown in the Placeholder colour when selected.
 */
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Radix doesn't allow "" as an item value, so the empty option travels under this key.
const EMPTY = "__admin_select_empty__";

type OptionProps = {
  value?: string | number;
  disabled?: boolean;
  children?: ReactNode;
};

function text(node: ReactNode): string {
  return Children.toArray(node)
    .map(child =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? text(child.props.children)
          : ""
    )
    .join("");
}

export default function AdminSelect({
  value,
  onChange,
  children,
  disabled,
  className,
  id,
  size = "md",
  "aria-label": ariaLabel,
}: {
  value: string | number | null | undefined;
  onChange: (event: { target: { value: string } }) => void;
  /** `<option>` elements, as in a native select. */
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
  /** "sm" for compact dropdowns inside question rows. */
  size?: "md" | "sm";
  "aria-label"?: string;
}) {
  const options = Children.toArray(children)
    .filter(
      (child): child is ReactElement<OptionProps> =>
        isValidElement(child) && child.type === "option"
    )
    .map(option => ({
      value: String(option.props.value ?? text(option.props.children)),
      label: text(option.props.children),
      disabled: option.props.disabled,
    }));
  const current = value === null || value === undefined ? "" : String(value);
  const isEmpty = current === "";

  return (
    <SelectPrimitive.Root
      value={isEmpty ? EMPTY : current}
      onValueChange={next => {
        // Radix sends "" by itself when the value changes before its items mount (e.g. a
        // form filled in after loading). Real choices never are "": the empty one is EMPTY.
        if (next === "") return;
        onChange({ target: { value: next === EMPTY ? "" : next } });
      }}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "admin-select flex w-full min-w-0 items-center justify-between gap-2 border border-[var(--admin-border)] bg-transparent px-3 text-left text-sm text-[var(--admin-heading)] outline-none transition-colors hover:border-[var(--admin-body)] focus-visible:border-[var(--admin-primary)] data-[state=open]:border-[var(--admin-primary)] disabled:cursor-not-allowed disabled:opacity-60",
          size === "sm" ? "h-9" : "h-11",
          isEmpty && "text-[var(--admin-placeholder)]",
          className
        )}
      >
        <span className="min-w-0 truncate">
          <SelectPrimitive.Value />
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--admin-body)] transition-transform [[data-state=open]>&]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="admin-select-menu z-[100] max-h-[min(320px,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] min-w-[180px] overflow-hidden"
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map(option => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value === "" ? EMPTY : option.value}
                disabled={option.disabled}
                className={cn(
                  "relative flex min-h-9 cursor-pointer select-none items-center rounded-[calc(var(--radius-control)-3px)] py-2 pl-3 pr-8 text-sm text-[var(--admin-heading)] outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-[var(--admin-card)] data-[state=checked]:font-medium data-[state=checked]:text-[var(--admin-primary)]",
                  option.value === "" && "text-[var(--admin-body)]"
                )}
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2.5">
                  <Check className="h-4 w-4" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
