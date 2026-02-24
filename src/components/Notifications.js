"use client";

import { useShop } from "@/context/ShopContext";
import { useEffect, useState } from "react";

export default function Notifications() {

    const { shop } = useShop();

    const [notifications, setNotifications] = useState([]);

    let clientId = shop?.id;

    

    useEffect(() => {
        // const evtSource = new EventSource(`http://localhost:5000/stream?clientId=${clientId}`);
        const evtSource = new EventSource(`https://push.eloquentservice.com/stream?clientId=${clientId}`);

        

        evtSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setNotifications((prev) => [data, ...prev]);
        };

        evtSource.onerror = () => {
            evtSource.close();
            setTimeout(() => {
                // reconnect on error
                // new EventSource(`http://localhost:5000/stream?clientId=${clientId}`);
                new EventSource(`https://push.eloquentservice.com/stream?clientId=${clientId}`);
            }, 1000);
        };

        return () => evtSource.close();
    }, [clientId]);

    return (
        <div style={{ padding: "20px" }}>
            <h2>Notifications (Shop {clientId})</h2>
            <ul>
                {notifications.map((n, i) => (
                    <li key={i}>
                        {n.timestamp}: {typeof n.message === "object" ? JSON.stringify(n.message) : n.message}
                    </li>
                ))}
            </ul>
        </div>
    );
}