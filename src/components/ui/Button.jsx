// components/ui/Button.jsx
import clsx from "clsx";

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base = "rounded-full font-semibold transition-all";
  const variants = {
    primary: "bg-[#E50914] text-white px-6 py-2 hover:bg-[#b0060e]",
    outline:
      "border border-[#444] text-gray-200 px-5 py-2 hover:bg-white/5 hover:text-white",
  };
  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
