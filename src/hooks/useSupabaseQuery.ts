import { useCallback, useEffect, useState } from "react";
import { SupabaseError } from "../lib/supabaseClient";

type UseSupabaseQueryState<T> = {
  data: T | null;
  isLoading: boolean;
  error: SupabaseError | null;
  refetch: () => Promise<void>;
};

export function useSupabaseQuery<T>(
  fetcher: () => Promise<{ data: T | null; error: SupabaseError | null }>,
  dependencies: unknown[] = [],
): UseSupabaseQueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<SupabaseError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const execute = useCallback(async () => {
    setIsLoading(true);
    const result = await fetcher();
    setData(result.data);
    setError(result.error);
    setIsLoading(false);
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return {
    data,
    error,
    isLoading,
    refetch: execute,
  };
}
