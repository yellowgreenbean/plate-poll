export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`w-full max-w-sm rounded-xl border border-neutral-200 p-6 shadow-sm dark:border-neutral-800 ${className}`}
    >
      {children}
    </div>
  );
}
