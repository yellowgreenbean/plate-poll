import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`rounded-md border border-neutral-300 px-3 py-2 text-sm transition-colors duration-150 focus:border-accent dark:border-neutral-700 dark:bg-neutral-900 ${className}`}
      {...props}
    />
  );
}
