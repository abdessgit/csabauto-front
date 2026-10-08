import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook réutilisable pour gérer le rate limiting HTTP 429 avec décompte.
 *
 * @param {number} defaultRetrySeconds - Nombre de secondes par défaut pour le décompte (ex: 60 pour login, 300 pour inscription)
 * @returns {{
 *   isRateLimited: boolean,
 *   rateLimitMessage: string,
 *   retryAfterSeconds: number,
 *   handleError: (error: any) => boolean
 * }}
 */
export function useRateLimitHandler(defaultRetrySeconds = 60) {
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [rateLimitMessage, setRateLimitMessage] = useState('');
    const [retryAfterSeconds, setRetryAfterSeconds] = useState(defaultRetrySeconds);

    const timerRef = useRef(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Nettoyage au démontage du composant pour éviter les fuites mémoire
    useEffect(() => {
        return () => {
            clearTimer();
        };
    }, [clearTimer]);

    const handleError = useCallback((error) => {
        if (error?.response?.status === 429) {
            const message = error.response.data?.error || 'Trop de tentatives, réessayez plus tard.';
            setRateLimitMessage(message);
            setIsRateLimited(true);

            // Vérifie si le backend fournit un en-tête Retry-After ou une durée
            const retryHeader = error.response.headers?.['retry-after'];
            const initialSeconds = retryHeader && !isNaN(Number(retryHeader))
                ? parseInt(retryHeader, 10)
                : defaultRetrySeconds;

            setRetryAfterSeconds(initialSeconds);

            // Nettoie un éventuel intervalle précédent avant d'en démarrer un nouveau
            clearTimer();

            timerRef.current = setInterval(() => {
                setRetryAfterSeconds((prev) => {
                    if (prev <= 1) {
                        clearTimer();
                        setIsRateLimited(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return true;
        }

        return false;
    }, [defaultRetrySeconds, clearTimer]);

    return {
        isRateLimited,
        rateLimitMessage,
        retryAfterSeconds,
        handleError,
    };
}
