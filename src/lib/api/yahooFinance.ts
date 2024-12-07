import axios from 'axios';
import type { StockData } from '../types';

export async function fetchYahooFinanceData(symbol: string, range: string): Promise<StockData[]> {
  try {
    const formattedSymbol = encodeURIComponent(`${symbol}.NS`);
    const response = await axios.get(
      `/api/yahoo-finance/v8/finance/chart/${formattedSymbol}`,
      {
        params: { range, interval: '1d', events: 'history', includeAdjustedClose: true },
      }
    );

    const { chart } = response.data;
    if (!chart?.result?.[0]) {
      throw new Error('No data available for this symbol');
    }

    const { timestamp, indicators } = chart.result[0];
    const quote = indicators.quote[0];

    if (!timestamp || !quote) {
      throw new Error('Incomplete data for this stock symbol');
    }

    return timestamp.map((time: number, index: number) => ({
      time: new Date(time * 1000).toISOString().split('T')[0],
      open: quote.open[index],
      high: quote.high[index],
      low: quote.low[index],
      close: quote.close[index],
      volume: quote.volume[index],
    })).filter((candle: StockData) => 
      candle.open != null && 
      candle.high != null && 
      candle.low != null && 
      candle.close != null && 
      candle.volume != null
    );
  } catch (error: any) {
    console.error('API Error:', error.response?.data || error.message);
    throw new Error(`Error fetching stock data: ${error.message}`);
  }
}

