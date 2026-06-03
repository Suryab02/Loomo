import { useState, useEffect, useRef } from 'react';
import type { JobStatus } from '../types';

import { JobListParams } from '../types';

export function useDashboardFilters() {
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [searchInput, setSearchInput] = useState('');
  const [listParams, setListParams] = useState<JobListParams>({
    q: '',
    status: '',
    platform: '',
    sort: 'created_at',
    order: 'desc',
    page: 1,
    per_page: 50,
  });

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setListParams((p) => ({ ...p, q: searchInput.trim(), page: 1 }));
    }, 320);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); }
  }, [searchInput]);

  const resetFilters = () => {
    setSearchInput('');
    setListParams((p) => ({ ...p, q: '', status: '', platform: '', page: 1 }));
  };

  return { 
    searchInput, 
    setSearchInput, 
    listParams, 
    setListParams, 
    resetFilters 
  };
}
