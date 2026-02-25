import type { SupabaseClient } from "@supabase/supabase-js";
import { OrderStatus } from "@home-chef/shared";

/** Anonymous session key used in localStorage */
export const SESSION_KEY = "ridendine_session_v1";

export interface OrderDraft {
  chef_id: string;
  customer_name?: string;
  customer_email?: string;
  session_id?: string;
  delivery_address?: string;
  notes?: string;
  total_cents: number;
  items?: Array<{ menu_item_id?: string; name: string; price_cents: number; quantity: number }>;
}

export class OrdersRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async createOrder(draft: OrderDraft) {
    const { items, ...orderFields } = draft;
    const { data: order, error } = await this.supabase
      .from("orders")
      .insert({ ...orderFields, status: OrderStatus.DRAFT })
      .select()
      .single();
    if (error) throw error;

    if (items && items.length > 0) {
      const lineItems = items.map((i) => ({ ...i, order_id: order.id }));
      const { error: itemsErr } = await this.supabase.from("order_items").insert(lineItems);
      if (itemsErr) throw itemsErr;
    }

    return order;
  }

  async submitOrder(orderId: string) {
    const { data, error } = await this.supabase
      .from("orders")
      .update({ status: OrderStatus.SUBMITTED })
      .eq("id", orderId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateOrderStatus(orderId: string, nextStatus: OrderStatus) {
    const { data, error } = await this.supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async listOrdersByCook(cookId: string) {
    const { data, error } = await this.supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("chef_id", cookId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async listOrdersByCustomer(customerIdOrSessionId: string) {
    const { data, error } = await this.supabase
      .from("orders")
      .select("*, order_items(*)")
      .or(`customer_id.eq.${customerIdOrSessionId},session_id.eq.${customerIdOrSessionId}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async getOrder(orderId: string) {
    const { data, error } = await this.supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();
    if (error) throw error;
    return data;
  }
}
