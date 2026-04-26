import BottomNav from "@/components/BottomNav";
import "./globals.css";
import Header from "@/components/Header";
import GuestHeader from "@/components/GuestHeader";
import ShopProviders from "./ShopProviders";

// We'll remove Geist since your design uses Manrope via the Google Fonts link
export const metadata = {
  title: "ServiceHub",
  description: "Your one-stop shop for professional services",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Fonts & Icons */}
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-brand-dark min-h-screen text-white">
        {/* Wrapping children in a div helps maintain that 
            mobile-app width (480px) across your whole site 
        */}
        <ShopProviders>
          <div className="relative flex min-h-screen w-full flex-col bg-brand-dark overflow-x-hidden">
            <Header />
            {/* <GuestHeader /> */}
            {children}
            {/* <BottomNav /> */}
          </div>
        </ShopProviders>
      </body>
    </html>
  );
}
