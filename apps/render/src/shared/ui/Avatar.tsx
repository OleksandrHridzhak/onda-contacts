import React from "react";
import { getColorStyle } from "shared/lib/color";

interface AvatarProps {
  initials: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export function Avatar({
  initials,
  color,
  size = "md",
  className = "",
}: AvatarProps): React.ReactElement {
  const style = getColorStyle(color);
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${style.bg} ${style.text} ${sizeClasses[size]} ${className}`.trim()}
    >
      {initials}
    </div>
  );
}
