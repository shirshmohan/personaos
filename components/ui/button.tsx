import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors duration-150 ease-(--ease-quiet) disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-(--color-ink) text-(--color-surface) hover:bg-(--color-ink)/90",
        outline:
          "border border-(--color-border) bg-(--color-surface) hover:bg-(--color-surface-sunken)",
        ghost: "hover:bg-(--color-surface-sunken)",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render the child element with button styling (e.g. a Link). */
  asChild?: boolean;
}

function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, className }));

  if (asChild && React.isValidElement(props.children)) {
    const child = props.children as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      className: cn(classes, child.props.className),
    });
  }

  return <button className={classes} {...props} />;
}

export { Button, buttonVariants };
