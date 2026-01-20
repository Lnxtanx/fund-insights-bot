import { Holding, Trade } from '@/types/finance';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

function parseNumber(value: string): number {
  if (!value || value === 'NULL' || value === '') return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

export async function loadHoldings(): Promise<Holding[]> {
  const response = await fetch('/data/holdings.csv');
  const text = await response.text();
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const holdings: Holding[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    
    const holding: Holding = {
      AsOfDate: values[0] || '',
      OpenDate: values[1] || '',
      CloseDate: values[2] === 'NULL' ? null : values[2],
      ShortName: values[3] || '',
      PortfolioName: values[4] || '',
      StrategyRefShortName: values[5] || '',
      Strategy1RefShortName: values[6] || '',
      Strategy2RefShortName: values[7] || '',
      CustodianName: values[8] || '',
      DirectionName: values[9] || '',
      SecurityId: values[10] || '',
      SecurityTypeName: values[11] || '',
      SecName: values[12] || '',
      StartQty: parseNumber(values[13]),
      Qty: parseNumber(values[14]),
      StartPrice: parseNumber(values[15]),
      Price: parseNumber(values[16]),
      StartFXRate: parseNumber(values[17]),
      FXRate: parseNumber(values[18]),
      MV_Local: parseNumber(values[19]),
      MV_Base: parseNumber(values[20]),
      PL_DTD: parseNumber(values[21]),
      PL_QTD: parseNumber(values[22]),
      PL_MTD: parseNumber(values[23]),
      PL_YTD: parseNumber(values[24]),
    };
    
    holdings.push(holding);
  }
  
  return holdings;
}

export async function loadTrades(): Promise<Trade[]> {
  const response = await fetch('/data/trades.csv');
  const text = await response.text();
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const trades: Trade[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    
    const trade: Trade = {
      id: values[0] || '',
      RevisionId: values[1] || '',
      AllocationId: values[2] || '',
      TradeTypeName: values[3] || '',
      SecurityId: values[4] || '',
      SecurityType: values[5] || '',
      Name: values[6] || '',
      Ticker: values[7] === 'NULL' ? null : values[7],
      CUSIP: values[8] === 'NULL' ? null : values[8],
      ISIN: values[9] === 'NULL' ? null : values[9],
      TradeDate: values[10] || '',
      SettleDate: values[11] || '',
      Quantity: parseNumber(values[12]),
      Price: parseNumber(values[13]),
      TradeFXRate: values[14] === 'NULL' ? null : parseNumber(values[14]),
      Principal: parseNumber(values[15]),
      Interest: parseNumber(values[16]),
      TotalCash: parseNumber(values[17]),
      AllocationQTY: parseNumber(values[18]),
      AllocationPrincipal: parseNumber(values[19]),
      AllocationInterest: parseNumber(values[20]),
      AllocationFees: parseNumber(values[21]),
      AllocationCash: parseNumber(values[22]),
      PortfolioName: values[23] || '',
      CustodianName: values[24] || '',
      StrategyName: values[25] || '',
      Strategy1Name: values[26] || '',
      Strategy2Name: values[27] || '',
      Counterparty: values[28] || '',
      AllocationRule: values[29] || '',
      IsCustomAllocation: parseNumber(values[30]),
    };
    
    trades.push(trade);
  }
  
  return trades;
}
