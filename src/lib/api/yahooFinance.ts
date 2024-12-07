import axios from 'axios';
import type { StockData } from '../types';

// Cache to store API responses
const cache = new Map();

const aggregateCandles = (dailyData: StockData[], interval: string): StockData[] => {
  if (interval === '1d') return dailyData;

  const aggregatedData: StockData[] = [];
  let currentCandle: StockData | null = null;

  for (const candle of dailyData) {
    const date = new Date(candle.time);
    let intervalStart: string;

    if (interval === '1wk') {
      // Set to Monday of the week
      const day = date.getUTCDay();
      const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
      intervalStart = new Date(date.setUTCDate(diff)).toISOString().split('T')[0];
    } else if (interval === '1mo') {
      // Set to first day of the month
      intervalStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().split('T')[0];
    } else {
      throw new Error(`Unsupported interval: ${interval}`);
    }

    if (!currentCandle || currentCandle.time !== intervalStart) {
      if (currentCandle) {
        aggregatedData.push(currentCandle);
      }
      currentCandle = {
        time: intervalStart,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      };
    } else {
      currentCandle.high = Math.max(currentCandle.high, candle.high);
      currentCandle.low = Math.min(currentCandle.low, candle.low);
      currentCandle.close = candle.close;
      currentCandle.volume += candle.volume;
    }
  }

  if (currentCandle) {
    aggregatedData.push(currentCandle);
  }

  return aggregatedData;
};

export async function fetchYahooFinanceData(symbol: string, interval: string, range: string): Promise<StockData[]> {
  const formattedSymbol = encodeURIComponent(`${symbol}.NS`);
  const cacheKey = `${formattedSymbol}-${range}-${interval}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
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

    if (!timestamp || !quote || !quote.open || !quote.high || !quote.low || !quote.close || !quote.volume) {
      throw new Error('Incomplete data for this stock symbol');
    }

    const dailyData: StockData[] = timestamp.map((time: number, index: number) => ({
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

    const finalData = aggregateCandles(dailyData, interval);

    cache.set(cacheKey, finalData);
    if (cache.size > 100) cache.delete(cache.keys().next().value);

    return finalData;
  } catch (error: any) {
    console.error('API Error:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      throw new Error('Stock symbol not found');
    }

    if (error.response?.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    }

    throw new Error(`Error fetching stock data: ${error.message}`);
  }
}

