import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900",
  ghost: "text-neutral-500 underline",
};

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
