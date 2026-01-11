import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "accent" | "success" | "warning";
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: "bg-card",
  primary: "gradient-primary text-primary-foreground",
  accent: "gradient-accent text-accent-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
};

const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  className,
  onClick,
}: MetricCardProps) => {
  const isColored = variant !== "default";
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === "Enter" && onClick() : undefined}
      className={cn(
        "relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:scale-[1.02]",
        variantStyles[variant],
        !isColored && "shadow-card hover:shadow-card-hover",
        isColored && "shadow-lg",
        isClickable && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p
            className={cn(
              "text-sm font-medium",
              isColored ? "opacity-90" : "text-muted-foreground"
            )}
          >
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p
              className={cn(
                "text-sm",
                isColored ? "opacity-80" : "text-muted-foreground"
              )}
            >
              {subtitle}
            </p>
          )}
          {trend && (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-sm font-medium",
                trend.isPositive
                  ? isColored
                    ? "opacity-90"
                    : "text-success"
                  : isColored
                  ? "opacity-90"
                  : "text-destructive"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "rounded-lg p-3",
              isColored ? "bg-white/20" : "bg-primary/10"
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
