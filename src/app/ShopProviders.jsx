"use client";

import { ShopProvider } from "@/context/ShopContext";

export default function ShopProviders({ children }) {
  return <ShopProvider>{children}</ShopProvider>;
}

