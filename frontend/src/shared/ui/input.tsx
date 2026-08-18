import * as React from "react"

import { cn } from "@/shared/utils"
import { DateInput } from "@/shared/ui/date-input"
import { inputClassName } from "@/shared/ui/input-styles"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  if (type === "date") {
    return <DateInput className={className} {...props} />
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputClassName, className)}
      {...props}
    />
  )
}

export { Input, inputClassName }
