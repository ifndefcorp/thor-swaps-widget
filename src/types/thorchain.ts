export interface AssetEntity {
  chain: string;
  symbol: string;
  ticker: string;
  synth?: boolean;
  trade?: boolean;
  address?: string;
}

export interface Pool {
  asset: string;
  assetDepth: string;
  runeDepth: string;
  assetPriceUSD?: string;
  decimals?: number;
}

export interface MimirValue {
  [key: string]: number;
}

export interface NetworkConstants {
  int_64_values: {
    [key: string]: number;
  };
}

export interface ParseConstantOptions {
  filter?: (value: number) => any;
  extraText?: string | ((value: number) => string);
}

export interface ParsedMemo {
  type: string | null;
  asset?: string | null;
  destAddr?: string | null;
  limit?: string | null;
  interval?: number | null;
  quantity?: number | null;
  affiliate?: string | null;
  fee?: string | null;
  asymmetry?: boolean | string;
  bps?: string | null;
  withdrawAsset?: string | null;
  address?: string;
  hash?: string;
  nodeAddress?: string;
  provider?: string;
  amount?: string;
} 