import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={`
      peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full
      border-2 border-transparent shadow-sm transition-colors
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]
      disabled:cursor-not-allowed disabled:opacity-50
      data-[state=checked]:bg-zinc-50 data-[state=unchecked]:bg-zinc-800
      ${className || ""}
    `}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={`
        pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform
        data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0
        data-[state=checked]:bg-zinc-900 data-[state=unchecked]:bg-zinc-400
      `}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
