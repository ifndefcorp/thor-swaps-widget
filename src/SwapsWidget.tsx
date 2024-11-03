import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { amountToUSD } from './Utils';
import { StreamingSwap, Pool } from './Models';

const THOR_NODE_URL = "https://thornode.ninerealms.com/thorchain";

export interface SwapsWidgetStyles {
  fonts?: {
    titleFont?: string;
    bodyFont?: string;
    detailFont?: string;
  };
  colors?: {
    primaryText?: string;
    secondaryText?: string;
  };
  cornerRadius?: string;
}

export interface SwapsWidgetProps {
  styles?: SwapsWidgetStyles;
}

const SwapsWidget: React.FC<SwapsWidgetProps> = ({ styles }) => {
  const [swaps, setSwaps] = useState<StreamingSwap[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUsdValue, setTotalUsdValue] = useState<number>(0);

  // Utility functions
  const formatNumber = (num: number, decimals: number = 4): string => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(num);
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const getTxUrl = (txId: string): string => {
    return `https://thorchain.net/tx/${txId}`;
  };

  const calculateETA = (remainingIntervals: number): string => {
    // Each block is roughly 6 seconds
    const seconds = remainingIntervals * 6;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const fetchSwapDetails = async (txId: string) => {
    try {
      const response = await axios.get(`${THOR_NODE_URL}/tx/status/${txId}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching swap details for ${txId}:`, err);
      return null;
    }
  };

  const fetchPools = async () => {
    try {
      const response = await axios.get(`${THOR_NODE_URL}/pools`);
      const poolsData = response.data.map((pool: any) => ({
        asset: pool.asset,
        assetDepth: pool.balance_asset,
        runeDepth: pool.balance_rune,
        decimals: pool.decimals || 8
      }));
      
      // Log relevant pool data with proper typing
      console.debug('Fetched pools:', poolsData.map((p: Pool) => ({
        asset: p.asset,
        assetDepth: p.assetDepth.slice(0, 10) + '...',
        runeDepth: p.runeDepth.slice(0, 10) + '...',
        decimals: p.decimals
      })));
      
      setPools(poolsData);
    } catch (err) {
      console.error('Error fetching pools:', err);
      setError('Failed to fetch pools data');
    }
  };

  const calculateTotalUsdValue = (swapsData: StreamingSwap[], poolsData: Pool[]): number => {
    if (!poolsData || poolsData.length === 0) {
      console.debug('No pools data available for USD calculation');
      return 0;
    }

    console.debug('Calculating USD value with pools:', poolsData.length);

    return swapsData.reduce((total, swap) => {
      if (!swap.deposit || !swap.source_asset) {
        console.debug('Skipping swap due to missing data:', { 
          hasDeposit: !!swap.deposit, 
          hasSourceAsset: !!swap.source_asset 
        });
        return total;
      }
      
      const normalizedAsset = swap.source_asset.replace('/', '.');
      const relevantPool = poolsData.find(p => p.asset === normalizedAsset);
      
      console.debug('Pool data for calculation:', {
        asset: normalizedAsset,
        pool: relevantPool ? {
          asset: relevantPool.asset,
          assetDepth: relevantPool.assetDepth,
          runeDepth: relevantPool.runeDepth,
          decimals: relevantPool.decimals
        } : 'No pool found'
      });
      
      const usdValue = amountToUSD(
        normalizedAsset,
        swap.deposit,
        poolsData
      );
      
      console.debug('Individual swap USD calculation:', {
        originalAsset: swap.source_asset,
        normalizedAsset,
        depositAmount: swap.deposit / 1e8,
        poolsCount: poolsData.length,
        relevantPool: relevantPool ? {
          asset: relevantPool.asset,
          assetDepth: relevantPool.assetDepth.slice(0, 10) + '...',
          runeDepth: relevantPool.runeDepth.slice(0, 10) + '...',
          decimals: relevantPool.decimals
        } : 'No pool found',
        usdValue,
        runningTotal: total + usdValue
      });
      
      return total + usdValue;
    }, 0);
  };

  const updateStreamingSwaps = async () => {
    try {
      setLoading(true);
      
      // Fetch pools first and keep the data in memory
      let poolsData: Pool[] = pools;
      if (pools.length === 0) {
        const response = await axios.get(`${THOR_NODE_URL}/pools`);
        poolsData = response.data.map((pool: any) => ({
          asset: pool.asset,
          assetDepth: pool.balance_asset,
          runeDepth: pool.balance_rune,
          decimals: pool.decimals || 8
        }));
        setPools(poolsData);
      }
      
      const response = await axios.get(`${THOR_NODE_URL}/swaps/streaming`);
      const swapsData = response.data;

      // Log streaming swaps data
      console.debug('Fetched streaming swaps:', swapsData.map((s: any) => ({
        tx_id: s.tx_id,
        source_asset: s.source_asset,
        deposit: s.deposit
      })));

      // Calculate total USD value using poolsData directly instead of pools state
      const totalUsd = calculateTotalUsdValue(swapsData, poolsData);
      console.debug('Final total USD value:', totalUsd);
      setTotalUsdValue(totalUsd);

      // Fetch details for each swap
      const enrichedSwaps = await Promise.all(
        swapsData.map(async (swap: any) => {
          const details = await fetchSwapDetails(swap.tx_id);
          
          if (!details) return null;

          return {
            tx_id: swap.tx_id,
            count: swap.count || 0,
            quantity: swap.quantity || 1,
            interval: swap.interval || 0,
            source_asset: swap.source_asset,
            target_asset: swap.target_asset,
            deposit: swap.deposit || 0,
            inputAsset: {
              asset: swap.source_asset,
              amount: (swap.deposit || 0) / 1e8,
            },
            outputAsset: details.out_txs?.[0]?.coins[0] ? {
              asset: details.out_txs[0].coins[0].asset,
              amount: details.out_txs[0].coins[0].amount / 1e8,
            } : undefined,
            remainingSwaps: (swap.quantity || 1) - (swap.count || 0),
            completionPercent: ((swap.count || 0) / (swap.quantity || 1)) * 100,
            eta: calculateETA((swap.interval || 0) * ((swap.quantity || 1) - (swap.count || 0))),
          };
        })
      );

      setSwaps(enrichedSwaps.filter(Boolean) as StreamingSwap[]);
      setError(null);
    } catch (err) {
      setError('Failed to fetch streaming swaps');
      console.error('Error fetching streaming swaps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      await fetchPools();
      // Wait for pools to be set in state
      await new Promise(resolve => setTimeout(resolve, 100));
      if (isMounted) {
        await updateStreamingSwaps();
      }
    };
    
    init();

    // Update every 10 seconds
    const interval = setInterval(updateStreamingSwaps, 10000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Create dynamic styles
  const widgetStyles = {
    widget: {
      borderRadius: styles?.cornerRadius || '8px',
    },
    title: {
      fontFamily: styles?.fonts?.titleFont || 'inherit',
      color: styles?.colors?.primaryText || 'inherit',
    },
    body: {
      fontFamily: styles?.fonts?.bodyFont || 'inherit',
      color: styles?.colors?.primaryText || 'inherit',
    },
    details: {
      fontFamily: styles?.fonts?.detailFont || 'inherit',
      color: styles?.colors?.secondaryText || '#666',
    },
  };

  // Format USD value with appropriate suffix (K, M, B)
  const formatUsdValue = (value: number): string => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (swaps.length === 0) return <div>No active streaming swaps</div>;

  return (
    <div className="swaps-widget" style={widgetStyles.widget}>
      <div className="swaps-header">
        <h2 style={widgetStyles.title}>Ongoing Streaming Swaps</h2>
        <div className="swaps-summary" style={widgetStyles.body}>
          <div className="stats-container">
            <div className="stats-item">
              <span className="item-value">Amount: </span>
              <span className="total-swaps mono">
                {totalUsdValue ? formatUsdValue(totalUsdValue) : '-'}
              </span>
            </div>
            <div className="stats-item">
              <span className="item-value">Count: </span>
              <span className="total-swaps mono">{swaps.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="swaps-list">
        {swaps.map((swap) => (
          <div key={swap.tx_id} className="swap-item" style={widgetStyles.widget}>
            <div className="swap-assets" style={widgetStyles.body}>
              {swap.inputAsset && (
                <span className="asset">
                  {formatNumber(swap.inputAsset.amount)} {swap.inputAsset.asset}
                </span>
              )}
              <span>→</span>
              {swap.outputAsset && (
                <span className="asset">
                  {formatNumber(swap.outputAsset.amount)} {swap.outputAsset.asset}
                </span>
              )}
            </div>

            <div className="swap-details">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${swap.completionPercent}%` }}
                />
              </div>
              <span style={widgetStyles.body}>{formatNumber(swap.completionPercent || 0, 1)}%</span>
            </div>

            <div className="swap-info" style={widgetStyles.details}>
              <span>
                TX:{' '}
                <a 
                  href={getTxUrl(swap.tx_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-link"
                >
                  {formatAddress(swap.tx_id)}
                </a>
              </span>
              <span>{swap.interval} Blocks/Swap</span>
              <span>ETA: {swap.eta}</span>
              <span>Remaining: {swap.remainingSwaps} swaps</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SwapsWidget;