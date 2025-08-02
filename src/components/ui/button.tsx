import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { InlineSpinner } from "./spinner"
import { buttonVariants } from "./button-variants"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // 確保按鈕基本屬性，即使在使用 Slot 時也不丟失
    const buttonProps = {
      className: cn(buttonVariants({ variant, size, className })),
      ref,
      disabled: disabled || isLoading,
      type, // 確保有 type 屬性
      ...props
    }

    return (
      <Comp {...buttonProps}>
        {isLoading ? (
          <>
            <InlineSpinner />
            <span>{typeof children === 'string' ? '處理中...' : children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button }
