import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToHash() {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        if (!hash) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            return;
        }

        const id = hash.replace('#', '');
        let timer = null;

        const scrollToTarget = () => {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                return true;
            }
            return false;
        };

        // Try immediately
        if (!scrollToTarget()) {
            // If element is not rendered yet (e.g. after navigating between pages), retry with slight delays
            timer = setTimeout(() => {
                if (!scrollToTarget()) {
                    timer = setTimeout(scrollToTarget, 200);
                }
            }, 80);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [pathname, hash]);

    return null;
}
