import { Holding, Trade } from '@/types/finance';

export interface GlobalStats {
    totalHoldings: number;
    totalTrades: number;
    totalMarketValue: number;
    totalPL: number;
    uniqueFundsCount: number;
    dateRange: {
        start: string;
        end: string;
    };
    topFundByPL: string;
    topFundByMV: string;
}

export function calculateGlobalStats(holdings: Holding[], trades: Trade[]): GlobalStats {
    const totalMarketValue = holdings.reduce((sum, h) => sum + h.MV_Base, 0);
    const totalPL = holdings.reduce((sum, h) => sum + h.PL_YTD, 0);

    const uniqueFunds = new Set([
        ...holdings.map(h => h.PortfolioName),
        ...trades.map(t => t.PortfolioName)
    ]);

    // Find top funds for "At a glance" info
    const sortedByPL = [...holdings].sort((a, b) => b.PL_YTD - a.PL_YTD);
    const sortedByMV = [...holdings].sort((a, b) => b.MV_Base - a.MV_Base);

    // Calculate Date Range from Trades
    let minDate = new Date();
    let maxDate = new Date(0);

    if (trades.length > 0) {
        const dates = trades.map(t => {
            const d = new Date(t.TradeDate);
            return isNaN(d.getTime()) ? null : d;
        }).filter(d => d !== null) as Date[];

        if (dates.length > 0) {
            minDate = new Date(Math.min(...dates.map(d => d.getTime())));
            maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        }
    }

    return {
        totalHoldings: holdings.length,
        totalTrades: trades.length,
        totalMarketValue,
        totalPL,
        uniqueFundsCount: uniqueFunds.size,
        dateRange: {
            start: minDate.toLocaleDateString(),
            end: maxDate.toLocaleDateString()
        },
        topFundByPL: sortedByPL[0]?.PortfolioName || 'N/A',
        topFundByMV: sortedByMV[0]?.PortfolioName || 'N/A'
    };
}

export function formatGlobalStats(stats: GlobalStats): string {
    const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    const num = new Intl.NumberFormat('en-US');

    return `
GLOBAL PORTFOLIO STATS:
- Total Funds: ${num.format(stats.uniqueFundsCount)}
- Total Holdings Records: ${num.format(stats.totalHoldings)}
- Total Trade Records: ${num.format(stats.totalTrades)}
- Total Market Value: ${currency.format(stats.totalMarketValue)}
- Total YTD P&L: ${currency.format(stats.totalPL)}
- Best Performing Fund (YTD): ${stats.topFundByPL}
- Largest Holding (MV): ${stats.topFundByMV}
- Trading Activity Range: ${stats.dateRange.start} to ${stats.dateRange.end}
`.trim();
}
