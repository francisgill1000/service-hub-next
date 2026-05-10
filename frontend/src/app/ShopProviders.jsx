"use client";

import { ShopProvider } from "@/context/ShopContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { ThemeProvider } from "@/context/ThemeContext";

export default function ShopProviders({ children }) {
  return (
    <ThemeProvider>
      <ShopProvider>
        <NotificationsProvider>{children}</NotificationsProvider>
      </ShopProvider>
    </ThemeProvider>
  );
}

