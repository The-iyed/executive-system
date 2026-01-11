import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * Reusable hook for managing URL query parameters
 */
export const useUrlParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Get a query parameter value
   */
  const getParam = useCallback(
    (key: string, defaultValue: string = ''): string => {
      return searchParams.get(key) || defaultValue;
    },
    [searchParams]
  );

  /**
   * Get a query parameter as a number
   */
  const getNumberParam = useCallback(
    (key: string, defaultValue: number = 0): number => {
      const value = searchParams.get(key);
      if (!value) return defaultValue;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    },
    [searchParams]
  );

  /**
   * Set a query parameter
   */
  const setParam = useCallback(
    (key: string, value: string | number | null) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        if (value === null || value === '' || value === undefined) {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
        return newParams;
      });
    },
    [setSearchParams]
  );

  /**
   * Set multiple query parameters at once
   */
  const setParams = useCallback(
    (params: Record<string, string | number | null>) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        Object.entries(params).forEach(([key, value]) => {
          if (value === null || value === '' || value === undefined) {
            newParams.delete(key);
          } else {
            newParams.set(key, String(value));
          }
        });
        return newParams;
      });
    },
    [setSearchParams]
  );

  /**
   * Remove a query parameter
   */
  const removeParam = useCallback(
    (key: string) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete(key);
        return newParams;
      });
    },
    [setSearchParams]
  );

  /**
   * Get all current params as an object
   */
  const getAllParams = useMemo(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  return {
    getParam,
    getNumberParam,
    setParam,
    setParams,
    removeParam,
    getAllParams,
    searchParams,
  };
};
