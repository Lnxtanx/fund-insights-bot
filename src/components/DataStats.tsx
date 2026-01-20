import { Holding, Trade } from '@/types/finance';
import { Database, TrendingUp, Briefcase } from 'lucide-react';

interface DataStatsProps {
  holdings: Holding[];
  trades: Trade[];
}

export function DataStats({ holdings, trades }: DataStatsProps) {
  const uniqueFunds = new Set([
    ...holdings.map(h => h.PortfolioName),
    ...trades.map(t => t.PortfolioName),
  ]).size;

  const totalPL = holdings.reduce((sum, h) => sum + h.PL_YTD, 0);

  const formatCurrency = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 1000000) {
      return `${value >= 0 ? '' : '-'}$${(abs / 1000000).toFixed(1)}M`;
    }
    if (abs >= 1000) {
      return `${value >= 0 ? '' : '-'}$${(abs / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="grid grid-cols-3 gap-3 p-4 border-b border-border">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg">
        <Database className="w-4 h-4 text-primary" />
        <div>
          <div className="text-xs text-muted-foreground">Holdings</div>
          <div className="text-sm font-semibold">{holdings.length.toLocaleString()}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg">
        <TrendingUp className="w-4 h-4 text-primary" />
        <div>
          <div className="text-xs text-muted-foreground">Trades</div>
          <div className="text-sm font-semibold">{trades.length.toLocaleString()}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg">
        <Briefcase className="w-4 h-4 text-primary" />
        <div>
          <div className="text-xs text-muted-foreground">Funds</div>
          <div className="text-sm font-semibold">{uniqueFunds}</div>
        </div>
      </div>
    </div>
  );
}
