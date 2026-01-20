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

  return (
    <div className="flex items-center justify-center gap-6 py-3 border-b border-border text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4" />
        <span><strong className="text-foreground">{holdings.length.toLocaleString()}</strong> Holdings</span>
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        <span><strong className="text-foreground">{trades.length.toLocaleString()}</strong> Trades</span>
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-2">
        <Briefcase className="w-4 h-4" />
        <span><strong className="text-foreground">{uniqueFunds}</strong> Funds</span>
      </div>
    </div>
  );
}
