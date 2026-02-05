"use client";

import { useEffect, useState } from "react";

import {
    MapPin,
    Crosshair,
    Satellite,
    Pencil,
    Loader2,
} from 'lucide-react';
import api from "@/utils/api";


export default function GPSTracker({ coordinates, onSuccess, setError = () => { } }) {

    const [isScanning, setIsScanning] = useState(false);
    const [isWaitingForPermission, setIsWaitingForPermission] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [isRetryVisible, setIsRetryVisible] = useState(false);

    const startGpsScan = () => {
        console.log("1. Initiation...");
        setError(null);
        setIsRetryVisible(false);
        setIsWaitingForPermission(true);

        // Set a safety timeout: If no response in 10s, show retry
        const safetyTimer = setTimeout(() => {
            if (isWaitingForPermission) {
                setIsWaitingForPermission(false);
                setIsRetryVisible(true);
                setError("The request is taking longer than expected.");
            }
        }, 10000);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                clearTimeout(safetyTimer);
                console.log("2. Signal Acquired", position.coords);
                const { latitude, longitude } = position.coords;

                // Store coordinates to be revealed after the animation
                window.pendingCoords = {
                    lat: latitude.toFixed(6),
                    lon: longitude.toFixed(6)
                };

                setIsWaitingForPermission(false);
                setIsScanning(true); // Triggers the visual scan bar
                setScanProgress(0);
            },
            (err) => {
                clearTimeout(safetyTimer);
                console.log("3. Error", err.message);
                setIsWaitingForPermission(false);
                setIsScanning(false);
                setError(`Location Error: ${err.message}`);
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    };


    const fetchLocation = async (coords) => {

        let config = {
            params: coords
        }

        try {
            const response = await api.get("/location", config);
            console.log(response.data);
            onSuccess(response.data);

        } catch (err) {
            console.error(err);
            setError("Failed to load services");
        } finally {
        }
    };



    // Update the Progress Effect to actually show the address
    useEffect(() => {
        let interval;
        if (isScanning) {
            interval = setInterval(() => {
                setScanProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setIsScanning(false);
                        // CRITICAL: Set the address here so the loading state ends
                        if (window.pendingCoords) {
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



    return (
        <>
            <div className="bg-[#151921] border border-white/10 rounded-3xl px-8 py-13 flex flex-col items-center text-center space-y-6 relative overflow-hidden">
                <div className={`absolute inset-0 bg-blue-500/5 transition-opacity duration-1000 ${(isScanning || isWaitingForPermission) ? 'opacity-100' : 'opacity-0'}`} />

                <div className="relative mt-2" >
                    <div className={`absolute -inset-4 border-2 border-blue-500/20 rounded-full ${(isScanning || isWaitingForPermission) ? 'animate-ping' : ''}`} />
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)] z-10 relative">
                        {(isScanning || isWaitingForPermission) ? <Loader2 className="animate-spin" size={28} /> : <Crosshair size={28} />}
                    </div>
                </div>

                <div className='mt-10'>
                    <h4 className="text-lg font-medium mb-1">
                        {isWaitingForPermission ? 'Check Browser Prompt' : 'Detect My Location'}
                    </h4>
                    <p className="text-white/40 text-xs">Using high-precision GPS radar mapping</p>
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
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 flex-shrink-0">
                    <MapPin size={22} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">
                        Detected GPS Coordinates
                    </p>
                    <p className="text-sm text-white/80 leading-relaxed truncate font-mono">
                        {coordinates.address}
                    </p>
                </div>
                <button className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors">
                    <Pencil size={18} />
                </button>
            </div>
        </>
    )
}