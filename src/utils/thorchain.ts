import moment from 'moment';
import { formatBN, bnOrZero } from '@xchainjs/xchain-util';
import { AssetEntity, Pool, ParsedMemo } from '../types/thorchain';

// Asset utilities
export const assetFromString = (assetStr: string): AssetEntity | null => {
  if (!assetStr) return null;

  const parts = assetStr.split('.');
  if (parts.length !== 2) return null;

  const [chain, symbol] = parts;
  return {
    chain,
    symbol,
    ticker: symbol.split('-')[0],
  };
};

export const assetToString = (asset: AssetEntity): string => {
  return `${asset.chain}.${asset.symbol}`;
};

export const isSynthAsset = (asset: AssetEntity): boolean => {
  return !!asset.synth;
};

// Formatting utilities
export const formatAddress = (address: string): string => {
  if (address && address.length > 12) {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }
  return address;
};

export const formatTimeNow = (timestamp: number): string => {
  return moment(timestamp * 1e3).fromNow();
};

export const addressFormatV2 = (
  address: string,
  length: number = 6,
  isOnlyLast: boolean = false
): string => {
  if (!address) return address;
  return `${isOnlyLast ? '' : address.slice(0, length) + '...'}${address.slice(-length)}`;
};

// Amount formatting utilities
export const baseAmountFormat = (number: string | number): string => {
  if (!number) return '-';
  return (+number / 1e8).toFixed(4);
};

export const baseAmountFormatOrZero = (number: string | number): string => {
  return formatBN(bnOrZero(number).div(1e8), 8);
};

// Asset color utilities
export const getAssetColor = (asset: string): string => {
  const colorMap: { [key: string]: string } = {
    'BTC.BTC': '#EF8F1C',
    'ETH.ETH': '#627EEA',
    'LTC.LTC': '#335E9D',
    'DOGE.DOGE': '#BCA23E',
    'BNB.BNB': '#F0BC18',
    'BSC.BNB': '#F0BC18',
    'BCH.BCH': '#4DCA48',
    'AVAX.AVAX': '#E84142',
    'GAIA.ATOM': '#303249',
    'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48': '#2775ca',
    'AVAX.USDC-0XB97EF9EF8734C71904D8002F8B6BC66DD9C48A6E': '#2775ca',
    'BNB.BUSD-BD1': '#ffc300',
    'ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7': '#26A17B',
  };

  return colorMap[asset] || popRandomColor();
};

// Helper function for random colors
const popRandomColor = (): string => {
  const defaultColors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
  ];
  const rand = Math.random();
  return defaultColors[Math.floor(rand * defaultColors.length)];
};

// USD calculation utilities
export const amountToUSD = (
  asset: string | AssetEntity,
  amount: number,
  pools: Pool[]
): number => {
  if (!asset || !amount || !pools) {
    console.debug('[amountToUSD] Invalid input:', { asset, amount, poolsLength: pools?.length });
    return 0;
  }

  const assetObj = typeof asset === 'string' ? assetFromString(asset) : asset;
  if (!assetObj) return 0;

  const copyAsset = { ...assetObj };
  
  if (isSynthAsset(copyAsset)) {
    copyAsset.synth = false;
  }
  if (copyAsset.trade) {
    delete copyAsset.trade;
  }

  const assetString = assetToString(copyAsset);
  const pool = pools.find(p => p.asset === assetString);

  if (!pool) {
    console.debug(`[amountToUSD] No pool found for asset: ${assetString}`);
    return 0;
  }

  // Calculate price in RUNE first
  const decimals = pool.decimals || 8;
  const assetDepth = parseInt(pool.assetDepth) / Math.pow(10, decimals);
  const runeDepth = parseInt(pool.runeDepth) / 1e8;
  
  if (!assetDepth || !runeDepth) {
    console.debug(`[amountToUSD] Invalid pool depths:`, { assetDepth, runeDepth });
    return 0;
  }

  // Price in RUNE = runeDepth / assetDepth
  const priceInRune = runeDepth / assetDepth;
  
  // Get RUNE price in USD
  const runeUsdPrice = usdPerRune(pools);
  
  // Calculate final USD value - divide by 100 to correct the scale
  const usdValue = (amount / 1e8) * priceInRune * runeUsdPrice / 100;

  console.debug(`[amountToUSD] Calculation:`, {
    asset: assetString,
    amount: amount / 1e8,
    priceInRune,
    runeUsdPrice,
    usdValue
  });

  return usdValue;
};

export const usdPerRune = (pools: Pool[]): number => {
  let asset = 0;
  let rune = 0;

  const anchorPools = [
    'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48',
    'ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7',
    'AVAX.USDC-0XB97EF9EF8734C71904D8002F8B6BC66DD9C48A6E',
    'BNB.BUSD-BD1',
  ];

  pools.forEach((p) => {
    if (anchorPools.includes(p.asset)) {
      const decimals = p.decimals || 8;
      asset += parseInt(p.assetDepth) / Math.pow(10, decimals);
      rune += parseInt(p.runeDepth) / 1e8;
    }
  });

  return asset / rune;
};

// Memo parsing utility
export const parseMemo = (memo: string): ParsedMemo => {
  if (!memo) return { type: null };

  const parts = memo.split(':');
  const type = parts[0]?.toLowerCase();

  if (type === 'swap') {
    const [limit, interval, quantity] = parts[3] ? parts[3].split('/') : [];
    return {
      type,
      asset: parts[1] || null,
      destAddr: parts[2] || null,
      limit: limit || null,
      interval: parseInt(interval) || null,
      quantity: parseInt(quantity) || null,
      affiliate: parts[4] || null,
      fee: parts[5] || null,
    };
  }

  // Add other memo type parsing as needed...
  
  return {
    type,
    asset: parts[1] || null,
  };
}; 