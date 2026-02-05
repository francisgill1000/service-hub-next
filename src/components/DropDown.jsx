import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

const DropDown = ({ categories, selectedId, onSelect, placeholder = "Select Category" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedCategory = categories.find(c => c.id === selectedId);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        } else {
            setSearchTerm('');
        }
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-[#151921] border border-white/10 rounded-xl px-5 py-4 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm ${!selectedId ? 'text-white/20' : 'text-white'}`}
            >
                <span>{selectedCategory ? selectedCategory.name : placeholder}</span>
                <ChevronDown
                    size={20}
                    className={`text-white/20 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-400' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c222d] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-white/5 bg-[#252c38]">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#151921] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-white/20"
                            />
                        </div>
                    </div>

                    <div className="py-1 max-h-60 overflow-y-auto custom-scrollbar">
                        {filtered.length > 0 ? (
                            filtered.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(item.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-5 py-3 text-left text-sm flex items-center justify-between hover:bg-blue-500/10 transition-colors ${selectedId === item.id ? 'text-blue-400 bg-blue-500/5' : 'text-white/70 hover:text-white'}`}
                                >
                                    {item.name}
                                    {selectedId === item.id && <Check size={16} />}
                                </button>
                            ))
                        ) : (
                            <div className="px-5 py-4 text-xs text-white/30 text-center italic">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DropDown;