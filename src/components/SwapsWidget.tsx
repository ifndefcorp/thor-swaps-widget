import React, { useEffect, useState } from 'react';
import axios from 'axios';


interface Asset {
  asset: string;
  amount: number;
}

export interface StreamingSwap {
  tx_id: string;
  count: number;
  quantity: number;
  interval: number;
  source_asset: string;
  target_asset: string;
  deposit: number;
  trade_target?: number;
  inputAsset?: Asset;
  outputAsset?: Asset;
  remainingSwaps: number;
  completionPercent: number;
  eta: string;
}

const THOR_NODE_URL = "https://thornode.ninerealms.com/thorchain";

interface SwapsWidgetStyles {
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

interface SwapsWidgetProps {
  styles?: SwapsWidgetStyles;
}

const SwapsWidget: React.FC<SwapsWidgetProps> = ({ styles }) => {
  const [swaps, setSwaps] = useState<StreamingSwap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const updateStreamingSwaps = async () => {
    try {
      setLoading(true);
      
      // Use THOR_NODE_URL instead of thorNodeUrl
      const response = await axios.get(`${THOR_NODE_URL}/swaps/streaming`);
      const swapsData: StreamingSwap[] = response.data;

      // Fetch details for each swap
      const enrichedSwaps = await Promise.all(
        swapsData.map(async (swap) => {
          const details = await fetchSwapDetails(swap.tx_id);
          
          if (!details) return null;

          // Extract input/output assets from details
          const inputAsset = details.tx?.coins[0] ? {
            asset: details.tx.coins[0].asset,
            amount: details.tx.coins[0].amount / 1e8,
          } : undefined;

          const outputAsset = details.out_txs?.[0]?.coins[0] ? {
            asset: details.out_txs[0].coins[0].asset,
            amount: details.out_txs[0].coins[0].amount / 1e8,
          } : undefined;

          const remainingSwaps = swap.quantity - swap.count;
          const completionPercent = (swap.count / swap.quantity) * 100;
          const remainingIntervals = swap.interval * remainingSwaps;

          return {
            ...swap,
            inputAsset,
            outputAsset,
            remainingSwaps,
            completionPercent,
            eta: calculateETA(remainingIntervals),
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
    updateStreamingSwaps();
    // Update every 10 seconds
    const interval = setInterval(updateStreamingSwaps, 10000);
    return () => clearInterval(interval);
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (swaps.length === 0) return <div>No active streaming swaps</div>;

  return (
    <div className="swaps-widget" style={widgetStyles.widget}>
      <div className="swaps-header">
        <h2 style={widgetStyles.title}>Ongoing Streaming Swaps</h2>
        <div className="swaps-summary" style={widgetStyles.body}>
          <span>Total Swaps: {swaps.length}</span>
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