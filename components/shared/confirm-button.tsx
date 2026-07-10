"use client";

import { useEffect, useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * A destructive action should ask. Two-step rather than a modal: the button
 * becomes its own confirmation, and reverts after a few seconds if ignored.
 * No dialog to trap focus, nothing to dismiss.
 */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = "Are you sure?",
  ...props
}: Omit<ButtonProps, "onClick"> & {
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <Button
      type="button"
      {...props}
      onClick={() => {
        if (!armed) return setArmed(true);
        setArmed(false);
        onConfirm();
      }}
    >
      {armed ? confirmLabel : children}
    </Button>
  );
}
