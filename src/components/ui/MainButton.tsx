import clsx from "clsx";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "outline";
  className?: string;
  isLoading?: boolean;
}

export default function MainButton({
  children,
  variant = "primary",
  className = "",
  isLoading = false,
  ...props
}: ButtonProps) {
  const base = "rounded-full font-semibold transition-all flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-[#E50914] text-white px-6 py-2 hover:bg-[#b0060e]",
    outline:
      "border border-[#444] text-gray-200 px-5 py-2 hover:bg-white/5 hover:text-white",
  };
  return (
    <button
      className={clsx(base, variants[variant], className, (isLoading || props.disabled) && "opacity-70 cursor-not-allowed")}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
      {children}
    </button>
  );
}
