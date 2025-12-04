import { createContext, useContext, useState, useCallback } from "react";
import { ToastNotification } from "../components/ToastNotification";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notification, setNotification] = useState(null);

    const showNotification = useCallback((message, typeOrDuration = 'info', duration = 5000) => {
        let finalType = 'info';
        let finalDuration = duration;

        if (typeof typeOrDuration === 'number') {
            finalDuration = typeOrDuration;
        } else if (typeof typeOrDuration === 'string') {
            finalType = typeOrDuration;
            // If 3rd arg is provided, use it, otherwise keep default 5000
            if (arguments.length > 2 && typeof duration === 'number') {
                finalDuration = duration;
            }
        }

        setNotification({ message, type: finalType, duration: finalDuration });
    }, []);

    const closeNotification = useCallback(() => {
        setNotification(null);
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {notification && (
                <ToastNotification
                    message={notification.message}
                    type={notification.type}
                    duration={notification.duration}
                    onClose={closeNotification}
                />
            )}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
}
