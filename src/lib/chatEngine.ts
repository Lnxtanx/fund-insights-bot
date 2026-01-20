import { Holding, Trade } from '@/types/finance';
import {
  getFundSummaries,
  getUniqueFunds,
  getTotalHoldingsForFund,
  getTotalTradesForFund,
  getPL_YTDForFund,
  getBestPerformingFunds,
  getWorstPerformingFunds,
  getSecurityTypeBreakdown,
  getTradeTypeBreakdown,
} from './dataAnalyzer';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function processQuestion(
  question: string,
  holdings: Holding[],
  trades: Trade[]
): string {
  const q = question.toLowerCase().trim();
  
  // Check for greetings
  if (q.match(/^(hi|hello|hey|greetings)/)) {
    return "Hello! I'm your financial data assistant. I can help you with questions about your holdings and trades data. Try asking about:\n\n• Total holdings or trades for a fund\n• Best/worst performing funds by P&L\n• Security types breakdown\n• Specific fund performance\n\nWhat would you like to know?";
  }
  
  // Total holdings count
  if (q.includes('total') && q.includes('holding') && !q.includes('fund')) {
    const total = holdings.length;
    return `📊 **Total Holdings**: ${formatNumber(total)} positions across all funds.`;
  }
  
  // Total trades count
  if (q.includes('total') && q.includes('trade') && !q.includes('fund')) {
    const total = trades.length;
    return `📈 **Total Trades**: ${formatNumber(total)} trades recorded.`;
  }
  
  // Holdings for specific fund
  const holdingsForFundMatch = q.match(/(?:holdings?|positions?)\s+(?:for|in|of)\s+(.+?)(?:\?|$)/);
  if (holdingsForFundMatch || (q.includes('holding') && q.includes('fund'))) {
    const funds = getUniqueFunds(holdings, trades);
    const searchTerm = holdingsForFundMatch?.[1]?.trim() || '';
    
    if (searchTerm) {
      const matchedFund = funds.find(f => f.toLowerCase().includes(searchTerm.toLowerCase()));
      if (matchedFund) {
        const count = getTotalHoldingsForFund(holdings, matchedFund);
        const pl = getPL_YTDForFund(holdings, matchedFund);
        return `📊 **${matchedFund}** has **${formatNumber(count)}** holdings with a YTD P&L of **${formatCurrency(pl)}**.`;
      }
    }
    
    // List all funds with holdings count
    const summaries = getFundSummaries(holdings, trades)
      .filter(s => s.totalHoldings > 0)
      .sort((a, b) => b.totalHoldings - a.totalHoldings)
      .slice(0, 10);
    
    const list = summaries
      .map(s => `• **${s.name}**: ${formatNumber(s.totalHoldings)} holdings`)
      .join('\n');
    
    return `📊 **Holdings by Fund** (Top 10):\n\n${list}\n\nAsk about a specific fund for more details!`;
  }
  
  // Trades for specific fund
  const tradesForFundMatch = q.match(/(?:trades?)\s+(?:for|in|of)\s+(.+?)(?:\?|$)/);
  if (tradesForFundMatch || (q.includes('trade') && q.includes('fund'))) {
    const funds = getUniqueFunds(holdings, trades);
    const searchTerm = tradesForFundMatch?.[1]?.trim() || '';
    
    if (searchTerm) {
      const matchedFund = funds.find(f => f.toLowerCase().includes(searchTerm.toLowerCase()));
      if (matchedFund) {
        const count = getTotalTradesForFund(trades, matchedFund);
        return `📈 **${matchedFund}** has **${formatNumber(count)}** trades recorded.`;
      }
    }
    
    // List all funds with trades count
    const summaries = getFundSummaries(holdings, trades)
      .filter(s => s.totalTrades > 0)
      .sort((a, b) => b.totalTrades - a.totalTrades)
      .slice(0, 10);
    
    const list = summaries
      .map(s => `• **${s.name}**: ${formatNumber(s.totalTrades)} trades`)
      .join('\n');
    
    return `📈 **Trades by Fund** (Top 10):\n\n${list}\n\nAsk about a specific fund for more details!`;
  }
  
  // Best performing funds
  if (q.includes('best') || q.includes('top') || (q.includes('perform') && !q.includes('worst'))) {
    const best = getBestPerformingFunds(holdings).slice(0, 5);
    const list = best
      .map((f, i) => `${i + 1}. **${f.name}**: ${formatCurrency(f.totalPL_YTD)} YTD P&L`)
      .join('\n');
    
    return `🏆 **Top 5 Best Performing Funds** (by YTD P&L):\n\n${list}`;
  }
  
  // Worst performing funds
  if (q.includes('worst') || q.includes('bottom') || q.includes('poor')) {
    const worst = getWorstPerformingFunds(holdings).slice(0, 5);
    const list = worst
      .map((f, i) => `${i + 1}. **${f.name}**: ${formatCurrency(f.totalPL_YTD)} YTD P&L`)
      .join('\n');
    
    return `📉 **Bottom 5 Performing Funds** (by YTD P&L):\n\n${list}`;
  }
  
  // Fund performance / P&L
  if (q.includes('performance') || q.includes('p&l') || q.includes('profit') || q.includes('loss')) {
    const summaries = getBestPerformingFunds(holdings).slice(0, 10);
    const list = summaries
      .map(s => `• **${s.name}**: ${formatCurrency(s.totalPL_YTD)}`)
      .join('\n');
    
    const totalPL = holdings.reduce((sum, h) => sum + h.PL_YTD, 0);
    
    return `📊 **Fund Performance** (YTD P&L):\n\n${list}\n\n**Total Portfolio P&L**: ${formatCurrency(totalPL)}`;
  }
  
  // Security types
  if (q.includes('security') && (q.includes('type') || q.includes('breakdown'))) {
    const breakdown = getSecurityTypeBreakdown(holdings);
    const list = Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `• **${type}**: ${formatNumber(count)}`)
      .join('\n');
    
    return `📋 **Security Type Breakdown**:\n\n${list}`;
  }
  
  // Trade types
  if (q.includes('trade') && q.includes('type')) {
    const breakdown = getTradeTypeBreakdown(trades);
    const list = Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `• **${type}**: ${formatNumber(count)}`)
      .join('\n');
    
    return `📋 **Trade Type Breakdown**:\n\n${list}`;
  }
  
  // List all funds
  if (q.includes('list') && q.includes('fund')) {
    const funds = getUniqueFunds(holdings, trades);
    const list = funds.map(f => `• ${f}`).join('\n');
    return `📑 **All Funds** (${funds.length} total):\n\n${list}`;
  }
  
  // Search for specific fund by name
  const funds = getUniqueFunds(holdings, trades);
  for (const fund of funds) {
    if (q.includes(fund.toLowerCase())) {
      const holdingsCount = getTotalHoldingsForFund(holdings, fund);
      const tradesCount = getTotalTradesForFund(trades, fund);
      const pl = getPL_YTDForFund(holdings, fund);
      
      return `📊 **${fund}** Summary:\n\n• Holdings: ${formatNumber(holdingsCount)}\n• Trades: ${formatNumber(tradesCount)}\n• YTD P&L: ${formatCurrency(pl)}`;
    }
  }
  
  // Help / what can you do
  if (q.includes('help') || q.includes('what can you') || q.includes('capabilities')) {
    return `🤖 **I can help you with:**\n\n• **Holdings**: "Total holdings" or "Holdings for [fund name]"\n• **Trades**: "Total trades" or "Trades for [fund name]"\n• **Performance**: "Best performing funds" or "Worst performing funds"\n• **P&L**: "Show P&L" or "Fund performance"\n• **Breakdowns**: "Security types" or "Trade types"\n• **Lists**: "List all funds"\n\nJust ask a question about your financial data!`;
  }
  
  // Default: not found
  return "Sorry, I cannot find the answer to your question in the provided data. Try asking about:\n\n• Total holdings or trades\n• Holdings/trades for a specific fund\n• Best or worst performing funds\n• P&L and performance data\n• Security or trade type breakdowns";
}
