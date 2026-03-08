import { useCallback, useEffect, useRef, useState } from "react";

export function usePullToRefresh(expectedSettles: number) {
  const [refreshToken, setRefreshToken] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingLoads, setPendingLoads] = useState(0);
  const activeRefreshToken = useRef<number | null>(null);

  const beginRefresh = useCallback(() => {
    setRefreshing(true);
    setPendingLoads(expectedSettles);
    setRefreshToken((value) => {
      const nextToken = value + 1;
      activeRefreshToken.current = nextToken;
      return nextToken;
    });
  }, [expectedSettles]);

  const settleRefresh = useCallback((token: number) => {
    if (activeRefreshToken.current !== token) {
      return;
    }

    setPendingLoads((value) => Math.max(0, value - 1));
  }, []);

  useEffect(() => {
    if (refreshing && pendingLoads === 0) {
      setRefreshing(false);
      activeRefreshToken.current = null;
    }
  }, [pendingLoads, refreshing]);

  return {
    refreshing,
    refreshToken,
    beginRefresh,
    settleRefresh,
  };
}
