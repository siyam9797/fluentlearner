import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

/**
 * The admin's one on/off switch: 44×24 pill, admin Primary colour when on, Placeholder grey when off.
 * Colours come from Settings → Appearance, so it follows the theme (and dark mode).
 */
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none",
        "data-[state=checked]:bg-[var(--admin-primary,#c07f50)] data-[state=unchecked]:bg-[color-mix(in_srgb,var(--admin-body,#646f79)_45%,transparent)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--admin-primary,#c07f50)] focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
