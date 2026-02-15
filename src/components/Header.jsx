"use client";
import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useShop } from "@/context/ShopContext";
import GuestHeader from "./GuestHeader";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { shop, logoutShop } = useShop();

  const isGuestRoute =
    pathname === "/login" || pathname === "/register";

  const isShopRoute = pathname?.startsWith("/shop");

  if (!isShopRoute) return <GuestHeader />;

  return (
    <header className="sticky top-0 z-40 bg-[#f5f6f8]/50 dark:bg-[#101622]/100 backdrop-blur-md">
      <div className="flex items-center p-4 justify-between max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="size-10 rounded-full border-2 border-blue-600/30 bg-slate-300 bg-cover bg-center"
              style={{ backgroundImage: 'url("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix")' }}
            />
            <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-[#101622] rounded-full" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Welcome back,</p>
            <h2 className="text-lg font-bold leading-tight tracking-tight">{shop?.name ?? "Your Shop"}</h2>
          </div>
        </div>
        <button
          onClick={() => {
            logoutShop();
            router.push("/login");
          }}
          className="flex size-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 transition-transform active:scale-95"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  )
}
