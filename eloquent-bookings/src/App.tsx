import { Routes, Route } from 'react-router-dom';
import { CustomerProvider } from '@/context/CustomerContext';
import { MobileLayout } from '@/layout/MobileLayout';
import Home from '@/pages/Home';
import Explore from '@/pages/Explore';
import NearMe from '@/pages/NearMe';
import Favourites from '@/pages/Favourites';
import Bookings from '@/pages/Bookings';
import BookingView from '@/pages/BookingView';
import ShopDetail from '@/pages/ShopDetail';
import ShopChat from '@/pages/ShopChat';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Account from '@/pages/Account';

export default function App() {
  return (
    <CustomerProvider>
      <Routes>
        {/* Full-screen routes (no tab bar) */}
        <Route path="/shop/:id" element={<ShopDetail />} />
        <Route path="/shop/:id/chat" element={<ShopChat />} />
        <Route path="/booking/:id" element={<BookingView />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Tabbed routes */}
        <Route element={<MobileLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/near-me" element={<NearMe />} />
          <Route path="/favourites" element={<Favourites />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/account" element={<Account />} />
        </Route>
      </Routes>
    </CustomerProvider>
  );
}
