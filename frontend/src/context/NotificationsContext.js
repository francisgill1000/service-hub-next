"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useShop } from "@/context/ShopContext";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
    const { shop } = useShop();
    const clientId = shop?.id;

    const [notifications, setNotifications] = useState([]);
    const audioCtxRef = useRef(null);
    const femaleVoiceRef = useRef(null);

    useEffect(() => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

        const FEMALE_NAME_HINTS = [
            "zira", "samantha", "karen", "tessa", "victoria", "moira",
            "fiona", "serena", "susan", "veena", "allison", "ava", "kate",
            "female", "woman", "google us english", "google uk english female",
        ];

        const pickFemaleVoice = () => {
            const voices = window.speechSynthesis.getVoices() || [];
            if (!voices.length) return null;

            const byHint = voices.find((v) => {
                const n = (v.name || "").toLowerCase();
                return FEMALE_NAME_HINTS.some((h) => n.includes(h));
            });
            if (byHint) return byHint;

            const anyEnFemale = voices.find(
                (v) => v.lang?.toLowerCase().startsWith("en") && /female|woman/i.test(v.name)
            );
            if (anyEnFemale) return anyEnFemale;

            return voices.find((v) => v.lang?.toLowerCase().startsWith("en")) || voices[0];
        };

        const loadVoice = () => {
            femaleVoiceRef.current = pickFemaleVoice();
        };

        loadVoice();
        window.speechSynthesis.addEventListener?.("voiceschanged", loadVoice);
        return () => {
            window.speechSynthesis.removeEventListener?.("voiceschanged", loadVoice);
        };
    }, []);

    function ensureAudioContext() {
        if (typeof window === "undefined") return null;
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
        if (ctx.state === "suspended") {
            ctx.resume().catch(() => { });
        }

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
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

    function speak(text) {
        if (typeof window === "undefined") return;
        if (!("speechSynthesis" in window)) return;
        try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            const voice = femaleVoiceRef.current;
            if (voice) {
                u.voice = voice;
                u.lang = voice.lang || "en-US";
            } else {
                u.lang = "en-US";
            }
            u.rate = 1;
            u.pitch = 1.1;
            u.volume = 1;
            window.speechSynthesis.speak(u);
        } catch (e) {
            // ignore speech errors
        }
    }

    useEffect(() => {
        if (!clientId) return;

        const evtSource = new EventSource(
            `https://push.eloquentservice.com/stream?clientId=${clientId}`
        );

        evtSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setNotifications((prev) => [data, ...prev]);
            try {
                playChime();
            } catch (e) {
                // ignore audio errors
            }
            // Speak after the chime finishes (~1s)
            setTimeout(() => speak("Hi, You have a new booking"), 1100);
        };

        evtSource.onerror = () => {
            evtSource.close();
        };

        return () => evtSource.close();
    }, [clientId]);

    const value = {
        notifications,
        setNotifications,
        ensureAudioContext,
    };

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationsContext);
    if (!ctx) {
        return { notifications: [], setNotifications: () => { }, ensureAudioContext: () => null };
    }
    return ctx;
}
