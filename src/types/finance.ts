export interface Holding {
  AsOfDate: string;
  OpenDate: string;
  CloseDate: string | null;
  ShortName: string;
  PortfolioName: string;
  StrategyRefShortName: string;
  Strategy1RefShortName: string;
  Strategy2RefShortName: string;
  CustodianName: string;
  DirectionName: string;
  SecurityId: string;
  SecurityTypeName: string;
  SecName: string;
  StartQty: number;
  Qty: number;
  StartPrice: number;
  Price: number;
  StartFXRate: number;
  FXRate: number;
  MV_Local: number;
  MV_Base: number;
  PL_DTD: number;
  PL_QTD: number;
  PL_MTD: number;
  PL_YTD: number;
}

export interface Trade {
  id: string;
  RevisionId: string;
  AllocationId: string;
  TradeTypeName: string;
  SecurityId: string;
  SecurityType: string;
  Name: string;
  Ticker: string | null;
  CUSIP: string | null;
  ISIN: string | null;
  TradeDate: string;
  SettleDate: string;
  Quantity: number;
  Price: number;
  TradeFXRate: number | null;
  Principal: number;
  Interest: number;
  TotalCash: number;
  AllocationQTY: number;
  AllocationPrincipal: number;
  AllocationInterest: number;
  AllocationFees: number;
  AllocationCash: number;
  PortfolioName: string;
  CustodianName: string;
  StrategyName: string;
  Strategy1Name: string;
  Strategy2Name: string;
  Counterparty: string;
  AllocationRule: string;
  IsCustomAllocation: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface FundSummary {
  name: string;
  totalHoldings: number;
  totalTrades: number;
  totalPL_YTD: number;
  totalMV_Base: number;
}
