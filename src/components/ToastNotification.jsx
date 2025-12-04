import { useEffect } from "react";
import "../ToastNotification.css";

export function ToastNotification({ message, type = 'info', duration = 5000, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`toast-container toast-${type}`}>
            <div className={`toast-progress-bar toast-progress-${type}`} style={{ animationDuration: `${duration}ms` }}></div>
            <div className="toast-message">{message}</div>
        </div>
    );
}
