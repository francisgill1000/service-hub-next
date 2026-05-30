export type WorkingHours = { start_time?: string; end_time?: string };

export type Service = {
  id: number;
  title?: string;
  name?: string;
  price?: number | string;
  image?: string;
};

export type Shop = {
  id: number;
  name: string;
  logo?: string;
  hero_image?: string;
  location?: string;
  shop_code?: string;
  rating?: number | string;
  distance?: string;
  distance_km?: number | string;
  is_open?: boolean;
  is_favourite?: boolean;
  today_working_hours?: WorkingHours;
  catalogs?: Service[];
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
  customer_name?: string;
  customer?: { name?: string };
  shop?: { name?: string; location?: string };
  services?: Service[];
};

export type Paginated<T> = {
  data: T[];
  current_page?: number;
  last_page?: number;
};
