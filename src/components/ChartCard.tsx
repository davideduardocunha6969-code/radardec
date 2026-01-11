import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

const ChartCard = ({ title, subtitle, children, className }: ChartCardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover",
        className
      )}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
};

export default ChartCard;
