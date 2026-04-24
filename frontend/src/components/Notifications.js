"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useNotifications } from "@/context/NotificationsContext";

export default function Notifications() {

    const router = useRouter();
    const { notifications, ensureAudioContext } = useNotifications();
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
                    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => { });
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
                    <div style={{ padding: '8px 12px', fontWeight: 600 }} className="border-b border-slate-700">Notifications</div>
                    {notifications.length === 0 ? (
                        <div style={{ padding: 12, color: '#6b7280' }}>No notifications</div>
                    ) : (
                        notifications.map((n, i) => (
                            <div
                                key={i}
                                onClick={() => { router.push(n.data.notification_url); setOpen(false); }}
                                style={{ padding: 10, fontSize: 13 }}
                                className="border-b border-slate-700  bg-slate-900">
                                <div style={{ marginBottom: 4 }}>{typeof n.message === 'object' ? JSON.stringify(n.message) : n.message}</div>
                                <div style={{ fontSize: 12 }}>{n.timestamp}</div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
