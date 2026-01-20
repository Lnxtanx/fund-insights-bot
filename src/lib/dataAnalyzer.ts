import { Holding, Trade, FundSummary } from '@/types/finance';

export function getFundSummaries(holdings: Holding[], trades: Trade[]): FundSummary[] {
  const fundMap = new Map<string, FundSummary>();
  
  // Process holdings
  holdings.forEach(holding => {
    const fundName = holding.PortfolioName || holding.ShortName;
    if (!fundName) return;
    
    const existing = fundMap.get(fundName) || {
      name: fundName,
      totalHoldings: 0,
      totalTrades: 0,
      totalPL_YTD: 0,
      totalMV_Base: 0,
    };
    
    existing.totalHoldings += 1;
    existing.totalPL_YTD += holding.PL_YTD;
    existing.totalMV_Base += holding.MV_Base;
    
    fundMap.set(fundName, existing);
  });
  
  // Process trades
  trades.forEach(trade => {
    const fundName = trade.PortfolioName;
    if (!fundName) return;
    
    const existing = fundMap.get(fundName) || {
      name: fundName,
      totalHoldings: 0,
      totalTrades: 0,
      totalPL_YTD: 0,
      totalMV_Base: 0,
    };
    
    existing.totalTrades += 1;
    
    fundMap.set(fundName, existing);
  });
  
  return Array.from(fundMap.values());
}

export function getUniqueFunds(holdings: Holding[], trades: Trade[]): string[] {
  const funds = new Set<string>();
  holdings.forEach(h => funds.add(h.PortfolioName || h.ShortName));
  trades.forEach(t => funds.add(t.PortfolioName));
  return Array.from(funds).filter(Boolean).sort();
}

export function getUniqueSecurities(holdings: Holding[], trades: Trade[]): string[] {
  const securities = new Set<string>();
  holdings.forEach(h => securities.add(h.SecName));
  trades.forEach(t => securities.add(t.Name));
  return Array.from(securities).filter(Boolean).sort();
}

export function getTotalHoldingsForFund(holdings: Holding[], fundName: string): number {
  return holdings.filter(h => 
    h.PortfolioName.toLowerCase().includes(fundName.toLowerCase()) ||
    h.ShortName.toLowerCase().includes(fundName.toLowerCase())
  ).length;
}

export function getTotalTradesForFund(trades: Trade[], fundName: string): number {
  return trades.filter(t => 
    t.PortfolioName.toLowerCase().includes(fundName.toLowerCase())
  ).length;
}

export function getPL_YTDForFund(holdings: Holding[], fundName: string): number {
  return holdings
    .filter(h => 
      h.PortfolioName.toLowerCase().includes(fundName.toLowerCase()) ||
      h.ShortName.toLowerCase().includes(fundName.toLowerCase())
    )
    .reduce((sum, h) => sum + h.PL_YTD, 0);
}

export function getBestPerformingFunds(holdings: Holding[]): FundSummary[] {
  const fundPL = new Map<string, number>();
  
  holdings.forEach(h => {
    const fundName = h.PortfolioName || h.ShortName;
    if (!fundName) return;
    const current = fundPL.get(fundName) || 0;
    fundPL.set(fundName, current + h.PL_YTD);
  });
  
  return Array.from(fundPL.entries())
    .map(([name, pl]) => ({
      name,
      totalHoldings: holdings.filter(h => h.PortfolioName === name || h.ShortName === name).length,
      totalTrades: 0,
      totalPL_YTD: pl,
      totalMV_Base: holdings
        .filter(h => h.PortfolioName === name || h.ShortName === name)
        .reduce((sum, h) => sum + h.MV_Base, 0),
    }))
    .sort((a, b) => b.totalPL_YTD - a.totalPL_YTD);
}

export function getWorstPerformingFunds(holdings: Holding[]): FundSummary[] {
  return getBestPerformingFunds(holdings).reverse();
}

export function getSecurityTypeBreakdown(holdings: Holding[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  holdings.forEach(h => {
    const type = h.SecurityTypeName || 'Unknown';
    breakdown[type] = (breakdown[type] || 0) + 1;
  });
  return breakdown;
}

export function getTradeTypeBreakdown(trades: Trade[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  trades.forEach(t => {
    const type = t.TradeTypeName || 'Unknown';
    breakdown[type] = (breakdown[type] || 0) + 1;
  });
  return breakdown;
}
