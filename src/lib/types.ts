export interface Stock {
  Symbol: string;
  "Company Name": string;
}

export interface StockData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Interval {
  label: string;
  value: string;
  range: string;
}

