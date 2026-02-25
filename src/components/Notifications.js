"use client";

import { useShop } from "@/context/ShopContext";
import { Bell } from "lucide-react";
import { useEffect, useState, useRef } from "react";

export default function Notifications() {

    const { shop } = useShop();

    const [notifications, setNotifications] = useState([]);
    const audioCtxRef = useRef(null);

    function ensureAudioContext() {
        if (!audioCtxRef.current) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            audioCtxRef.current = new Ctx();
        }
        return audioCtxRef.current;
    }

    function playChime() {
        const ctx = ensureAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.45);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.0);
    }

    let clientId = shop?.id;



    useEffect(() => {
        if (!clientId) return;

        const evtSource = new EventSource(`http://localhost:5000/stream?clientId=${clientId}`);
        // const evtSource = new EventSource(`https://push.eloquentservice.com/stream?clientId=${clientId}`);



        evtSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setNotifications((prev) => [data, ...prev]);
            try {
                playChime();
            } catch (e) {
                // ignore audio errors
            }
        };

        evtSource.onerror = () => {
            evtSource.close();
            setTimeout(() => {
                // reconnect on error
                new EventSource(`http://localhost:5000/stream?clientId=${clientId}`);
                // new EventSource(`https://push.eloquentservice.com/stream?clientId=${clientId}`);
            }, 1000);
        };

        return () => evtSource.close();
    }, [clientId]);
    const [open, setOpen] = useState(false);

    const bellStyle = {
        position: 'relative',
        width: 44,
        height: 44,
        borderRadius: '999px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
    };

    const badgeStyle = {
        position: 'absolute',
        top: 4,
        right: 4,
        minWidth: 20,
        height: 20,
        padding: '0 6px',
        borderRadius: 10,
        background: '#ef4444',
        color: '#fff',
        fontSize: 12,
        lineHeight: '20px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
    };

    const dropdownStyle = {
        position: 'absolute',
        right: 0,
        marginTop: 8,
        width: 320,
        maxHeight: 320,
        overflowY: 'auto',
        // background: '#fff',
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        padding: 8,
        zIndex: 50,
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>

            <button
                aria-label={`Notifications (${notifications.length})`}
                onClick={() => {
                    setOpen((s) => !s);
                    const ctx = ensureAudioContext();
                    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
                }}
                className="flex size-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 transition-transform active:scale-95"
                style={bellStyle}
            >
                <Bell size={20} />

                {notifications.length > 0 && (
                    <span style={badgeStyle}>{notifications.length > 99 ? '99+' : notifications.length}</span>
                )}
            </button>


            {open && (
                <div style={dropdownStyle} className="bg-white dark:bg-[#1c2331]" >
                    <div style={{ padding: '8px 12px',  fontWeight: 600 }} className="border-b border-slate-700">Notifications</div>
                    {notifications.length === 0 ? (
                        <div style={{ padding: 12, color: '#6b7280' }}>No notifications</div>
                    ) : (
                        notifications.map((n, i) => (
                            <div key={i} style={{ padding: 10,  fontSize: 13 }} className="border-b border-slate-700  bg-slate-900">
                                <div style={{  marginBottom: 4 }}>{typeof n.message === 'object' ? JSON.stringify(n.message) : n.message}</div>
                                <div style={{ fontSize: 12 }}>{n.timestamp}</div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}