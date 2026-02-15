"use client";

import { useEffect, useRef, useState } from "react";
import {
    MapPin,
    Crosshair,
    Satellite,
    Pencil,
    Loader2,
} from "lucide-react";
import api from "@/utils/api";

/* =========================
   Distance Helper (meters)
========================= */
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function GPSTracker({ onSuccess, setError = () => { } }) {

    const [address, setAddress] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isWaitingForPermission, setIsWaitingForPermission] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [isRetryVisible, setIsRetryVisible] = useState(false);

    // Store last accepted location
    const lastCoordsRef = useRef(null);

    const startGpsScan = () => {
        setError(null);
        setIsRetryVisible(false);
        setIsWaitingForPermission(true);

        const safetyTimer = setTimeout(() => {
            setIsWaitingForPermission(false);
            setIsRetryVisible(true);
            setError("The request is taking longer than expected.");
        }, 10000);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                clearTimeout(safetyTimer);

                const { latitude, longitude } = position.coords;

                const newCoords = {
                    lat: latitude,
                    lon: longitude,
                };

                // ===== DISTANCE FILTER FIX =====
                if (lastCoordsRef.current) {
                    const distance = getDistanceInMeters(
                        lastCoordsRef.current.lat,
                        lastCoordsRef.current.lon,
                        newCoords.lat,
                        newCoords.lon
                    );

                    // Ignore GPS drift (< 30 meters)
                    if (distance < 100) {
                        console.log("GPS drift ignored:", distance.toFixed(2), "m");

                        // HARD STOP — prevent backend call
                        window.pendingCoords = null;
                        setIsWaitingForPermission(false);
                        setIsScanning(false);
                        setScanProgress(0);

                        const saved = localStorage.getItem("lastAcceptedCoords");
                        if (saved) {
                            const parsed = JSON.parse(saved);

                            lastCoordsRef.current = parsed;
                            onSuccess(parsed);
                            setAddress(parsed.address)
                        }

                        return;
                    }

                }


                window.pendingCoords = {
                    lat: latitude.toFixed(6),
                    lon: longitude.toFixed(6),
                };

                setIsWaitingForPermission(false);
                setIsScanning(true);
                setScanProgress(0);
            },
            (err) => {
                clearTimeout(safetyTimer);
                setIsWaitingForPermission(false);
                setIsScanning(false);
                setError(`Location Error: ${err.message}`);
            },
            {
                enableHighAccuracy: false, // IMPORTANT for indoor stability
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    };

    const fetchLocation = async (coords) => {
        try {
            const response = await api.get("/location", { params: coords });

            const locationData = {
                lat: parseFloat(response.data.lat),
                lon: parseFloat(response.data.lon),
                address: response.data.address,
            };

            // Save for distance comparison
            lastCoordsRef.current = locationData;

            // Persist across refresh
            localStorage.setItem(
                "lastAcceptedCoords",
                JSON.stringify(locationData)
            );

            onSuccess(locationData);
            setAddress(parsed.address)
        } catch (err) {
            setError("Failed to load services");
        }
    };


    useEffect(() => {
        let interval;
        if (isScanning) {
            interval = setInterval(() => {
                setScanProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setIsScanning(false);

                        if (window.pendingCoords && !isWaitingForPermission) {
                            fetchLocation(window.pendingCoords);
                        }
                        return 100;
                    }
                    return prev + 5;
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isScanning]);

    useEffect(() => {
        const saved = localStorage.getItem("lastAcceptedCoords");
        if (saved) {
            const parsed = JSON.parse(saved);

            lastCoordsRef.current = parsed;
            onSuccess(parsed); // shows address immediately
            setAddress(parsed.address)
        }
    }, []);

    return (
        <>
            <div className="bg-[#151921] border border-white/10 rounded-3xl px-8 py-13 flex flex-col items-center text-center space-y-6 relative overflow-hidden">
                <div className={`absolute inset-0 bg-blue-500/5 transition-opacity duration-1000 ${(isScanning || isWaitingForPermission) ? 'opacity-100' : 'opacity-0'}`} />

                <div className="relative mt-2">
                    <div className={`absolute -inset-4 border-2 border-blue-500/20 rounded-full ${(isScanning || isWaitingForPermission) ? 'animate-ping' : ''}`} />
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)] z-10 relative">
                        {(isScanning || isWaitingForPermission)
                            ? <Loader2 className="animate-spin" size={28} />
                            : <Crosshair size={28} />}
                    </div>
                </div>

                <div className="mt-10">
                    <h4 className="text-lg font-medium mb-1">
                        {isWaitingForPermission ? 'Check Browser Prompt' : 'Detect My Location'}
                    </h4>
                    <p className="text-white/40 text-xs">
                        Using high-precision GPS radar mapping
                    </p>
                </div>

                <button
                    onClick={startGpsScan}
                    disabled={isScanning || isWaitingForPermission}
                    className={`relative z-50 flex items-center gap-2 px-8 py-4 rounded-xl font-medium transition-all w-full justify-center shadow-lg
                    ${(isScanning || isWaitingForPermission)
                            ? 'bg-blue-600/50 text-white/70 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white shadow-blue-500/20'}`}
                >
                    {isWaitingForPermission ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Connecting to Satellites...</span>
                        </>
                    ) : isScanning ? (
                        <span>Scanning... {scanProgress}%</span>
                    ) : isRetryVisible ? (
                        <span>Try Again</span>
                    ) : (
                        <>
                            <Satellite size={18} />
                            <span>Start GPS Scan</span>
                        </>
                    )}
                </button>
            </div>

            <div className="bg-[#151921] border border-white/10 rounded-2xl p-4 flex items-center gap-4 group">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                    <MapPin size={22} />
                </div>

                <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">
                        Detected GPS Coordinates
                    </label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)} // make sure you have state
                        className="w-full bg-[#1E222B] text-white/80 placeholder:text-white/40 rounded-xl px-4 py-2 text-sm font-mono border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Enter coordinates..."
                    />
                </div>
            </div>

        </>
    );
}
