import { useState, useEffect } from 'react';
import { Holding, Trade } from '@/types/finance';
import { loadHoldings, loadTrades } from '@/lib/csvParser';

export function useFinanceData() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [holdingsData, tradesData] = await Promise.all([
          loadHoldings(),
          loadTrades(),
        ]);
        setHoldings(holdingsData);
        setTrades(tradesData);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load financial data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  return { holdings, trades, isLoading, error };
}
