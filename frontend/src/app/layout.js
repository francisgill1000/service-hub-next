import BottomNav from "@/components/BottomNav";
import "./globals.css";
import Header from "@/components/Header";
import GuestHeader from "@/components/GuestHeader";
import ShopProviders from "./ShopProviders";

// We'll remove Geist since your design uses Manrope via the Google Fonts link
export const metadata = {
  title: "Rezzy",
  description: "Your one-stop shop for professional services",
};

// Inline pre-paint script — applies the saved theme class on <html> before first
// paint to prevent a flash. Defaults to "light" — only opt into dark if the user
// has explicitly chosen it. Also applies the saved palette class (.theme-{name}).
const themeScript = `
(function () {
  var root = document.documentElement;
  try {
    var t = localStorage.getItem('rezzy.theme');
    if (t === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  } catch (e) { root.classList.remove('dark'); }
  try {
    var valid = ['charcoal','cream','blue','sage','rose','slate'];
    var p = localStorage.getItem('rezzy.palette');
    if (!p || valid.indexOf(p) === -1) p = 'charcoal';
    root.classList.add('theme-' + p);
  } catch (e) { root.classList.add('theme-charcoal'); }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
      <body className="antialiased bg-brand-bg min-h-screen text-brand-text">
        {/* Wrapping children in a div helps maintain that
            mobile-app width (480px) across your whole site
        */}
        <ShopProviders>
          <div className="relative flex min-h-screen w-full flex-col bg-brand-bg text-brand-text overflow-x-hidden">
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
