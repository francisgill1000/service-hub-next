import { Box, Car, Home, Paintbrush, Pickaxe, Scissors, ShieldCheck, Wind, Zap } from "lucide-react";

const shops = [
    {
        id: 1,
        name: "Precision Plumbing Co.",
        status: "Open Now",
        statusColor: "text-emerald-400",
        rating: 4.9,
        reviews: 120,
        distance: "0.8 km",
        price: 45,
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952"
    },
    {
        id: 2,
        name: "FlowMaster Repairs",
        status: "Closing Soon",
        statusColor: "text-amber-400",
        rating: 4.7,
        reviews: 85,
        distance: "1.2 km",
        price: 38,
        image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc"
    },
    {
        id: 3,
        name: "Elite Pipe Solutions",
        status: "Open Now",
        statusColor: "text-emerald-400",
        rating: 4.8,
        reviews: 210,
        distance: "1.5 km",
        price: 55,
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4"
    },
    {
        id: 4,
        name: "Reliable Rooters",
        status: "Open Now",
        statusColor: "text-emerald-400",
        rating: 4.6,
        reviews: 45,
        distance: "2.1 km",
        price: 40,
        image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea"
    },
    {
        id: 5,
        name: "RapidFix Plumbing",
        status: "Available Today",
        statusColor: "text-sky-400",
        rating: 4.5,
        reviews: 98,
        distance: "2.4 km",
        price: 42,
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a"
    },
    {
        id: 6,
        name: "AquaCare Services",
        status: "Open Now",
        statusColor: "text-emerald-400",
        rating: 4.3,
        reviews: 60,
        distance: "3.0 km",
        price: 35,
        image: "https://images.unsplash.com/photo-1590856029620-9c9a60c9b4a6"
    },
    {
        id: 7,
        name: "PrimeFlow Experts",
        status: "Limited Slots",
        statusColor: "text-orange-400",
        rating: 4.9,
        reviews: 175,
        distance: "0.6 km",
        price: 60,
        image: "https://images.unsplash.com/photo-1617104551722-3b2d0c66fc3f"
    },
    {
        id: 8,
        name: "CityWide Plumbing",
        status: "Open Now",
        statusColor: "text-emerald-400",
        rating: 4.2,
        reviews: 34,
        distance: "4.2 km",
        price: 30,
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
    },
    {
        id: 9,
        name: "PipePro Mechanics",
        status: "Closing Soon",
        statusColor: "text-amber-400",
        rating: 4.6,
        reviews: 140,
        distance: "1.8 km",
        price: 48,
        image: "https://images.unsplash.com/photo-1600573472591-ee6c34c8a5b5"
    },
    {
        id: 10,
        name: "Neighborhood Plumbers",
        status: "Available Today",
        statusColor: "text-sky-400",
        rating: 4.4,
        reviews: 52,
        distance: "3.7 km",
        price: 37,
        image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea"
    }
];

const services = [
    { id: null, label: 'All Services', icon: Box },
    { id: 'barber', label: 'Barber', icon: Scissors },
    { id: 'plumbing', label: 'Plumbing', icon: Pickaxe },
    { id: 'ac-repair', label: 'AC Repair', icon: Wind },
    { id: 'electrician', label: 'Electrician', icon: Zap },
    { id: 'car-wash', label: 'Car Wash', icon: Car },
    { id: 'painting', label: 'Painting', icon: Paintbrush },
    { id: 'cleaning', label: 'Cleaning', icon: Home },
    { id: 'pest-control', label: 'Pest Control', icon: ShieldCheck },
];

export { shops, services };