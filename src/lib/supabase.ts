import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase connection settings are missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: { apikey: supabaseAnonKey },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Tool = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  duration: string;
  price_usd: number;
  price_kes: number;
  category: string;
  is_active: boolean;
  sort_order: number;
  remote_connect: 'anydesk' | 'ultraviewer' | null;
  delivery_mode: 'instant' | 'minutes';
  source: 'inventory' | 'api';
  created_at: string;
  updated_at: string;
};

export type ToolLogin = {
  id: string;
  tool_id: string;
  login_email: string;
  login_password: string;
  status: 'available' | 'used';
  rental_id: string | null;
  created_at: string;
};

export type Rental = {
  id: string;
  user_id: string;
  tool_id: string | null;
  tool_name: string;
  status: 'pending' | 'paid' | 'completed' | 'expired' | 'cancelled';
  payment_method: string;
  transaction_code: string;
  amount_usd: number;
  amount_kes: number;
  admin_notes: string;
  anydesk_id: string;
  ultraviewer_id: string;
  ultraviewer_password: string;
  delivered_email: string;
  delivered_password: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  is_admin: boolean;
  admin_role: 'main' | 'manager' | 'support';
  balance_usdt: number;
  balance_kes: number;
  is_disabled: boolean;
  preferred_currency: 'USD' | 'KES';
  created_at: string;
};

export type AutomationSettings = {
  id: number;
  api_type: string;
  api_name: string;
  provider_url: string;
  username: string;
  provider_status: 'active' | 'inactive';
  auto_update_price: boolean;
  auto_update_quantity: boolean;
  auto_update_delivery: boolean;
  enabled: boolean;
  cron_enabled: boolean;
  interval_minutes: number;
  last_synced_at: string | null;
  updated_at: string;
};

export type SiteSettings = {
  id: number;
  scrolling_text_1: string;
  scrolling_text_2: string;
  footer_text: string;
  usdt_rate: number;
  whatsapp_number: string;
  mpesa_number: string;
  email: string;
  binance_id: string;
  binance_name: string;
  hero_title: string;
  hero_subtitle: string;
  server_logo_url: string;
  scroll_font_size: number;
  maintenance_mode: boolean;
  created_at: string;
  updated_at: string;
};

export type MediaImage = {
  id: string;
  url: string;
  label: string;
  created_at: string;
};
