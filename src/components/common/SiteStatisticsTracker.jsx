import { useEffect } from 'react';
import { startStatisticsPolling, publishStatistics } from '../../services/siteStatistics';

// FRONTEND UI ONLY: site-wide anonymous presence, independent of route/auth state.
export default function SiteStatisticsTracker() {
  useEffect(() => startStatisticsPolling(publishStatistics), []);
  return null;
}
