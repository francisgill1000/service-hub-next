"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Camera, CameraOff } from 'lucide-react';
import api from '@/utils/api';
import { useShop } from '@/context/ShopContext';

const extractToken = (rawValue) => {
    if (!rawValue) return '';

    try {
        const parsed = new URL(rawValue);
        const token = parsed.searchParams.get('token');
        if (token) return token;
    } catch (_) {
    }

    const uuidMatch = String(rawValue).match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    if (uuidMatch?.[0]) {
        return uuidMatch[0];
    }

    return '';
};

export default function ScanLoginPage() {
    const router = useRouter();
    const { shop, loading } = useShop();

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const rafRef = useRef(null);

    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('Point your camera at the desktop login QR code.');
    const [manualInput, setManualInput] = useState('');
    const [isScannerReady, setIsScannerReady] = useState(false);

    useEffect(() => {
        if (!loading && !shop) {
            router.push('/login');
        }
    }, [loading, shop, router]);

    const stopScanner = () => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const approveToken = async (token) => {
        if (!token || status === 'approving' || status === 'success') return;

        try {
            setStatus('approving');
            setMessage('Approving desktop login...');

            await api.post(`/shops/qr-login/approve/${token}`);

            setStatus('success');
            setMessage('Desktop login approved. You can return to your desktop now.');
            stopScanner();
        } catch (err) {
            setStatus('error');
            setMessage(err?.response?.data?.message || 'Could not approve login. Please scan a fresh QR and try again.');
        }
    };

    const startScanner = async () => {
        if (typeof window === 'undefined') return;

        if (!('BarcodeDetector' in window)) {
            setStatus('error');
            setMessage('QR scanner is not supported on this browser. Please use Chrome on Android or paste the QR URL below.');
            return;
        }

        try {
            setStatus('scanning');
            setMessage('Scanning for desktop login QR...');

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setIsScannerReady(true);

            const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

            const scan = async () => {
                if (!videoRef.current || status === 'approving' || status === 'success') {
                    return;
                }

                try {
                    const barcodes = await detector.detect(videoRef.current);
                    if (barcodes?.length) {
                        const rawValue = barcodes[0]?.rawValue || '';
                        const token = extractToken(rawValue);

                        if (token) {
                            await approveToken(token);
                            return;
                        }

                        setStatus('error');
                        setMessage('Scanned QR is invalid for login. Please scan desktop login QR.');
                    }
                } catch (_) {
                }

                rafRef.current = requestAnimationFrame(scan);
            };

            rafRef.current = requestAnimationFrame(scan);
        } catch (err) {
            setStatus('error');
            setMessage(err?.message || 'Unable to access camera. Please allow camera permission.');
            stopScanner();
        }
    };

    useEffect(() => {
        if (loading || !shop) return;
        startScanner();

        return () => stopScanner();
    }, [loading, shop]);

    if (loading || !shop) return null;

    return (
        <div className="min-h-screen bg-brand-dark text-white px-4 py-6 max-w-[480px] mx-auto pb-28">
            <div className="mb-5 flex items-center gap-3">
                <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <QrCode className="text-primary" size={22} />
                </div>
                <div>
                    <h1 className="text-lg font-bold">Scan Desktop Login QR</h1>
                    <p className="text-xs text-muted-text">Approve web login from inside your app</p>
                </div>
            </div>

            <div className="bg-card-dark border border-white/10 rounded-2xl p-3 overflow-hidden">
                <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-black">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />

                    {!isScannerReady && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70 px-4 text-center">
                            Initializing camera...
                        </div>
                    )}
                </div>

                <p className="mt-3 text-sm text-white/90">{message}</p>

                <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        onClick={startScanner}
                        className="flex-1 h-11 rounded-xl bg-primary text-white font-semibold inline-flex items-center justify-center gap-2"
                    >
                        <Camera size={16} />
                        Start Scan
                    </button>
                    <button
                        type="button"
                        onClick={stopScanner}
                        className="flex-1 h-11 rounded-xl bg-white/10 text-white font-semibold inline-flex items-center justify-center gap-2"
                    >
                        <CameraOff size={16} />
                        Stop
                    </button>
                </div>
            </div>

            <div className="mt-4 bg-card-dark border border-white/10 rounded-2xl p-4">
                <label className="text-xs text-muted-text">Paste QR URL (fallback)</label>
                <input
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="mt-2 w-full h-11 rounded-xl bg-white/5 border border-white/10 px-3 outline-none"
                    placeholder="https://.../login/qr?token=..."
                />
                <button
                    type="button"
                    onClick={() => approveToken(extractToken(manualInput))}
                    className="mt-3 w-full h-11 rounded-xl bg-white/10 text-white font-semibold"
                >
                    Approve from URL
                </button>
            </div>
        </div>
    );
}
