import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useThorchain = () => {
  const navigate = useNavigate();

  const goto = useCallback((url: string) => {
    navigate(url);
  }, [navigate]);

  const gotoAddr = useCallback((address: string) => {
    navigate(`/address/${address}`);
  }, [navigate]);

  const gotoTx = useCallback((hash: string) => {
    if (hash === '0000000000000000000000000000000000000000000000000000000000000000' || !hash) {
      return;
    }
    navigate(`/tx/${hash}`);
  }, [navigate]);

  const gotoNode = useCallback((signer: string) => {
    navigate(`/node/${signer}`);
  }, [navigate]);

  const gotoPool = useCallback((pool: string) => {
    navigate(`/pool/${pool}`);
  }, [navigate]);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Could not copy text: ', err);
      return false;
    }
  }, []);

  return {
    goto,
    gotoAddr,
    gotoTx,
    gotoNode,
    gotoPool,
    copy,
  };
}; 