export type WorkingHours = {
  day?: string;
  start_time?: string;
  end_time?: string;
  is_closed?: boolean;
};

export type Service = {
  id: number;
  title?: string;
  name?: string;
  price?: number | string;
  duration?: number | string;
  description?: string;
  image?: string;
};

export type StaffMember = {
  id: number;
  name: string;
  is_active?: boolean;
};

export type Invoice = {
  id: number;
  status?: string;
  amount?: number | string;
  paid?: boolean;
};

export type Shop = {
  id: number;
  name: string;
  shop_code?: string;
  logo?: string;
  hero_image?: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  latitude?: number | string;
  longitude?: number | string;
  is_open?: boolean;
  working_hours?: WorkingHours[];
  catalogs?: Service[];
  [key: string]: unknown;
};

export type Booking = {
  id: number;
  status?: string;
  date?: string;
  show_date?: string;
  start_time?: string;
  end_time?: string;
  charges?: number | string;
  booking_reference?: string;
  reminder_sent?: boolean;
  reminder_sent_at?: string | null;
  customer_name?: string;
  customer_whatsapp?: string;
  staff_id?: number | null;
  shop_id?: number;
  customer?: { name?: string; phone?: string };
  staff?: StaffMember | null;
  shop?: { id?: number; name?: string; location?: string };
  services?: Service[];
  invoice?: Invoice | null;
};

export type ShopBookingsResponse = {
  data: Booking[];
  total_bookings?: number;
  total_revenue?: number | string;
  current_page?: number;
  last_page?: number;
};

export type Paginated<T> = {
  data: T[];
  current_page?: number;
  last_page?: number;
};

export type WaAccountInfo = {
  connected: boolean;
  phone_number?: string | null;
  phone_number_id?: string;
  waba_id?: string | null;
  status?: string;
  token_preview?: string;
};

export type WaContact = {
  id: number;
  wa_number: string;
  name?: string | null;
  last_message_preview?: string | null;
  last_message_direction?: 'in' | 'out' | null;
  last_message_at?: string | null;
  unread_count?: number;
};

export type WaMessage = {
  id: number;
  direction: 'in' | 'out';
  type?: string;
  body: string;
  status?: string | null;
  created_at?: string;
};
