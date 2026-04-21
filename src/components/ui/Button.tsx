/**
 * Reusable Button component with consistent styling and variants
 */
"use client";

import React from "react";
import {
  getButtonClassName,
  sizeVariants,
  buttonVariants,
} from "@/lib/componentUtils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof sizeVariants;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Elite Coffee Shop Button Component
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Add to Cart
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={getButtonClassName(variant, size, className)}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin me-2" />}
        {!loading && leftIcon && <span className="me-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ms-2">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
