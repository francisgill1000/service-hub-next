"use client";

import { ShopProvider } from "@/context/ShopContext";
import { NotificationsProvider } from "@/context/NotificationsContext";

export default function ShopProviders({ children }) {
  return (
    <ShopProvider>
      <NotificationsProvider>{children}</NotificationsProvider>
    </ShopProvider>
  );
}

