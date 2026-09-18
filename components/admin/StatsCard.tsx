import { type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string;
  iconBgColor?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
}: StatsCardProps) {
  return (
    <Card className="rounded-2xl border border-border/60 p-6 transition-shadow duration-200 hover:shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">
            {value}
          </p>
          {trend && (
            <p
              className={`mt-2 text-sm ${
                trend.isPositive ? 'text-primary' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div className={`${iconBgColor} ${iconColor} rounded-xl p-4`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
