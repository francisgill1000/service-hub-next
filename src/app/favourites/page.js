"use client";

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Heart, 
  Compass, 
  MessageCircle, 
  User, 
  Star, 
  Trash2,
  ChevronRight,
  Search,
  MoreVertical
} from 'lucide-react';

/**
 * ServiceHub - Favorites Favouriteslication
 * A responsive React Favouriteslication for managing favorite service providers.
 * Includes state management for toggling favorites and removing them.
 */

const INITIAL_SERVICES = [
  {
    id: '1',
    name: 'Elite Home Services',
    rating: 4.9,
    distance: '1.5 km',
    price: 35,
    image: 'https://images.unsplash.com/photo-1581578731522-9b7d77a60663?auto=format&fit=crop&q=80&w=400',
    category: 'Cleaning'
  },
  {
    id: '2',
    name: 'Spark & Shine Auto',
    rating: 4.8,
    distance: '2.2 km',
    price: 50,
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=400',
    category: 'Automotive'
  },
  {
    id: '3',
    name: 'Luxe Grooming Studio',
    rating: 5.0,
    distance: '0.8 km',
    price: 45,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400',
    category: 'Beauty'
  },
  {
    id: '4',
    name: 'Green Thumb Gardens',
    rating: 4.7,
    distance: '3.1 km',
    price: 40,
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=400',
    category: 'Gardening'
  }
];

const Favourites = () => {
  const [favorites, setFavorites] = useState(INITIAL_SERVICES);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('favorites');
  const [searchTerm, setSearchTerm] = useState('');

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.filter(service => service.id !== id));
  };

  const filteredFavorites = favorites.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B121B] text-white font-sans selection:bg-primary/30">
      <div className="relative flex min-h-screen w-full flex-col max-w-[480px] mx-auto overflow-x-hidden shadow-2xl bg-[#0B121B]">
        
        {/* Search Bar */}
        <div className="px-6 py-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#92adc9] transition-colors group-focus-within:text-[#007AFF]" />
            <input 
              type="text"
              placeholder="Search saved services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#16202A] border-none rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-[#007AFF]/50 placeholder:text-[#92adc9]/50 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 px-6 pb-32">
          {filteredFavorites.length > 0 ? (
            <div className="flex flex-col">
              {filteredFavorites.map((service, index) => (
                <React.Fragment key={service.id}>
                  <div className="py-5 flex gap-4 items-center group relative animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-[#16202A]">
                      <img 
                        alt={service.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        src={service.image}
                        onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                      />
                      <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {service.category}
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between h-24 py-1">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-white leading-tight pr-2 line-clamp-1">{service.name}</h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                            <span className="text-white text-xs font-bold">{service.rating}</span>
                            <span className="text-[#92adc9] text-xs">• {service.distance}</span>
                          </div>
                        </div>
                        
                        {isEditing ? (
                          <button 
                            onClick={() => toggleFavorite(service.id)}
                            className="p-2 -mr-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors animate-in zoom-in"
                          >
                            <Trash2 size={20} />
                          </button>
                        ) : (
                          <Heart className="w-5 h-5 text-[#007AFF] fill-current" />
                        )}
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <p className="text-white font-black text-lg">
                            ${service.price}
                            <span className="text-[#92adc9] font-medium text-xs ml-0.5">/hr</span>
                          </p>
                        </div>
                        <button className="bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-[#007AFF]/20 active:scale-95">
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                  {index !== filteredFavorites.length - 1 && (
                    <div className="h-[1px] w-full bg-white/5"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in">
              <div className="size-20 bg-[#16202A] rounded-full flex items-center justify-center mb-6">
                <Heart className="w-10 h-10 text-[#92adc9]/30" />
              </div>
              <h2 className="text-xl font-bold mb-2">No favorites yet</h2>
              <p className="text-[#92adc9] text-sm max-w-[240px] leading-relaxed">
                When you find a service you love, tap the heart icon to save it here.
              </p>
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-8 text-[#007AFF] font-bold text-sm bg-[#007AFF]/10 px-6 py-3 rounded-2xl hover:bg-[#007AFF]/20 transition-colors"
              >
                Browse Services
              </button>
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-20 bg-[#0B121B]/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-4 z-[100]">
          <NavItem 
            icon={<Home size={24} />} 
            label="Home" 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
          />
          <NavItem 
            icon={<Heart size={24} />} 
            label="Favorites" 
            active={activeTab === 'favorites'} 
            onClick={() => setActiveTab('favorites')} 
          />
          <NavItem 
            icon={<Compass size={24} />} 
            label="Explore" 
            active={activeTab === 'explore'} 
            onClick={() => setActiveTab('explore')} 
          />
          <NavItem 
            icon={<MessageCircle size={24} />} 
            label="Chat" 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
          />
          <NavItem 
            icon={<User size={24} />} 
            label="Profile" 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
          />
        </nav>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 relative px-4 ${
      active ? 'text-[#007AFF]' : 'text-[#92adc9]/60 hover:text-[#92adc9]'
    }`}
  >
    {active && (
      <span className="absolute -top-1 w-1 h-1 bg-[#007AFF] rounded-full animate-pulse" />
    )}
    <div className={`${active ? 'scale-110' : 'scale-100'} transition-transform`}>
      {React.cloneElement(icon, { fill: active ? 'currentColor' : 'none', strokeWidth: active ? 2.5 : 2 })}
    </div>
    <span className={`text-[10px] font-bold tracking-wide uppercase ${active ? 'opacity-100' : 'opacity-60'}`}>
      {label}
    </span>
  </button>
);

export default Favourites;