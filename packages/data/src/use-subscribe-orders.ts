import { useEffect, useRef } from "react";
import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

export interface SubscribeOrdersOptions {
  /** Filter by partner/chef id (admin use) */
  cookId?: string;
  /** Filter by anonymous session id (web use) */
  sessionId?: string;
  /** Filter by authenticated customer id */
  customerId?: string;
}

/**
 * Subscribe to INSERT/UPDATE events on the orders table, scoped by cookId, sessionId or customerId.
 * Automatically cleans up on unmount and retries once on error.
 */
export function useSubscribeOrders(
  supabase: SupabaseClient | null,
  options: SubscribeOrdersOptions,
  onChange: (payload: { eventType: "INSERT" | "UPDATE"; new: Record<string, unknown>; old: Record<string, unknown> }) => void
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!supabase) return;

    let channel: RealtimeChannel | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 5;

    function subscribe() {
      if (!supabase) return;
      const filter = buildFilter(options);
      channel = supabase
        .channel(`orders:${JSON.stringify(options)}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "orders", ...(filter ? { filter } : {}) },
          (payload) => onChangeRef.current({ eventType: "INSERT", new: payload.new as Record<string, unknown>, old: {} })
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders", ...(filter ? { filter } : {}) },
          (payload) => onChangeRef.current({ eventType: "UPDATE", new: payload.new as Record<string, unknown>, old: payload.old as Record<string, unknown> })
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" && retryCount < MAX_RETRIES) {
            retryCount++;
            const delay = Math.min(1000 * 2 ** retryCount, 30000);
            retryTimeout = setTimeout(() => {
              if (channel && supabase) supabase.removeChannel(channel);
              subscribe();
            }, delay);
          }
        });
    }

    subscribe();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (channel && supabase) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, options.cookId, options.sessionId, options.customerId]);
}

function buildFilter(options: SubscribeOrdersOptions): string | undefined {
  if (options.cookId) return `chef_id=eq.${options.cookId}`;
  if (options.customerId) return `customer_id=eq.${options.customerId}`;
  if (options.sessionId) return `session_id=eq.${options.sessionId}`;
  return undefined;
}
