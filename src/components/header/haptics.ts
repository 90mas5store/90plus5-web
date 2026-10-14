export function triggerHaptic(duration = 10) {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
            navigator.vibrate(duration);
        } catch {
            // Silencioso si no está soportado
        }
    }
}
