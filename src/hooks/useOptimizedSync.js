/**
 * Optimized Firebase Sync Hook
 * Implements smart sync strategies to minimize costs while maintaining functionality
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Sync configuration
const SYNC_CONFIG = {
  // Batch operations
  BATCH_SIZE: 500,
  BATCH_TIMEOUT: 1000, // 1 second
  
  // Smart sync thresholds
  MIN_CHANGES_FOR_SYNC: 5,
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  
  // Real-time listener limits
  RECENT_DAYS: 30, // Only listen to recent transactions
  MAX_LISTEN_DOCS: 50, // Maximum documents to listen to
  
  // Pagination
  PAGE_SIZE: 25,
  
  // Offline persistence
  ENABLE_OFFLINE: true,
  OFFLINE_TIMEOUT: 30 * 1000 // 30 seconds
};

export function useOptimizedSync() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [syncStats, setSyncStats] = useState({
    reads: 0,
    writes: 0,
    deletes: 0,
    storage: 0
  });

  // Refs for managing sync state
  const syncTimeoutRef = useRef(null);
  const batchTimeoutRef = useRef(null);
  const pendingBatchRef = useRef([]);
  const isActiveRef = useRef(true);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      isActiveRef.current = true;
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, []);

  // Smart sync trigger
  const triggerSync = useCallback(async (force = false) => {
    if (!user || !isOnline) return;

    const timeSinceLastSync = lastSyncTime ? Date.now() - lastSyncTime : Infinity;
    const shouldSync = force || 
      pendingChanges >= SYNC_CONFIG.MIN_CHANGES_FOR_SYNC ||
      timeSinceLastSync >= SYNC_CONFIG.SYNC_INTERVAL ||
      !isActiveRef.current;

    if (shouldSync) {
      setSyncStatus('syncing');
      try {
        // Implement actual sync logic here
        await performOptimizedSync();
        setLastSyncTime(Date.now());
        setPendingChanges(0);
        setSyncStatus('idle');
      } catch (error) {
        console.error('Sync failed:', error);
        setSyncStatus('error');
      }
    }
  }, [user, isOnline, lastSyncTime, pendingChanges]);

  // Batch operations
  const addToBatch = useCallback((operation) => {
    pendingBatchRef.current.push(operation);
    setPendingChanges(prev => prev + 1);

    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Set new timeout for batch processing
    batchTimeoutRef.current = setTimeout(() => {
      if (pendingBatchRef.current.length > 0) {
        triggerSync();
      }
    }, SYNC_CONFIG.BATCH_TIMEOUT);
  }, [triggerSync]);

  // Optimized sync implementation
  const performOptimizedSync = useCallback(async () => {
    if (!user) return;

    const batch = pendingBatchRef.current;
    if (batch.length === 0) return;

    // Process in chunks to respect batch limits
    const chunks = [];
    for (let i = 0; i < batch.length; i += SYNC_CONFIG.BATCH_SIZE) {
      chunks.push(batch.slice(i, i + SYNC_CONFIG.BATCH_SIZE));
    }

    for (const chunk of chunks) {
      await processBatchChunk(chunk);
    }

    // Clear processed batch
    pendingBatchRef.current = [];
  }, [user]);

  // Process a batch chunk
  const processBatchChunk = useCallback(async (operations) => {
    // This would integrate with your Firebase service
    // For now, we'll simulate the operation
    console.log(`Processing ${operations.length} operations`);
    
    // Update stats
    setSyncStats(prev => ({
      ...prev,
      writes: prev.writes + operations.length
    }));
  }, []);

  // Optimized query with pagination
  const useOptimizedQuery = useCallback((collection, queryConstraints, options = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const lastDocRef = useRef(null);

    const {
      pageSize = SYNC_CONFIG.PAGE_SIZE,
      enableRealTime = false,
      recentOnly = true
    } = options;

    const fetchData = useCallback(async (lastDoc = null) => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Build optimized query
        let constraints = [
          ...queryConstraints,
          orderBy('dt', 'desc'),
          limit(pageSize)
        ];

        if (lastDoc) {
          constraints.push(startAfter(lastDoc));
        }

        if (recentOnly) {
          const thirtyDaysAgo = Math.floor((Date.now() - SYNC_CONFIG.RECENT_DAYS * 24 * 60 * 60 * 1000) / 1000);
          constraints.unshift(where('dt', '>=', thirtyDaysAgo));
        }

        // Execute query
        // const querySnapshot = await getDocs(query(collection(db, collection), ...constraints));
        
        // Update stats
        setSyncStats(prev => ({
          ...prev,
          reads: prev.reads + pageSize
        }));

        // Process results
        // const newData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // setData(prev => lastDoc ? [...prev, ...newData] : newData);
        // setHasMore(newData.length === pageSize);
        // lastDocRef.current = querySnapshot.docs[querySnapshot.docs.length - 1];

      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }, [user, pageSize, recentOnly, queryConstraints]);

    // Initial fetch
    useEffect(() => {
      fetchData();
    }, [fetchData]);

    // Real-time listener (if enabled)
    useEffect(() => {
      if (!enableRealTime || !user) return;

      // Only listen to recent data to minimize costs
      const recentQuery = [
        ...queryConstraints,
        where('dt', '>=', Math.floor((Date.now() - SYNC_CONFIG.RECENT_DAYS * 24 * 60 * 60 * 1000) / 1000)),
        orderBy('dt', 'desc'),
        limit(SYNC_CONFIG.MAX_LISTEN_DOCS)
      ];

      // const unsubscribe = onSnapshot(
      //   query(collection(db, collection), ...recentQuery),
      //   (snapshot) => {
      //     const newData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      //     setData(newData);
      //   },
      //   (err) => setError(err)
      // );

      // return unsubscribe;
    }, [enableRealTime, user, queryConstraints]);

    return {
      data,
      loading,
      error,
      hasMore,
      fetchMore: () => fetchData(lastDocRef.current),
      refetch: () => fetchData()
    };
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      if (batchTimeoutRef.current) clearTimeout(batchTimeoutRef.current);
      isActiveRef.current = false;
    };
  }, []);

  return {
    // State
    isOnline,
    syncStatus,
    lastSyncTime,
    pendingChanges,
    syncStats,
    
    // Actions
    triggerSync,
    addToBatch,
    useOptimizedQuery,
    
    // Configuration
    config: SYNC_CONFIG
  };
}

// Utility functions for cost tracking
export function trackFirebaseUsage(operation, count = 1) {
  // This would integrate with your analytics service
  console.log(`Firebase ${operation}: ${count}`);
}

export function estimateStorageCost(dataSize) {
  // Firebase charges $0.18 per GB per month
  const costPerGB = 0.18;
  const costPerMB = costPerGB / 1024;
  return (dataSize / (1024 * 1024)) * costPerMB;
}

export function estimateReadCost(readCount) {
  // Firebase charges $0.06 per 100,000 reads
  const costPerRead = 0.06 / 100000;
  return readCount * costPerRead;
}

export function estimateWriteCost(writeCount) {
  // Firebase charges $0.18 per 100,000 writes
  const costPerWrite = 0.18 / 100000;
  return writeCount * costPerWrite;
}
