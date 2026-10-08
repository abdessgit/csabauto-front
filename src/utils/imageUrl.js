const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const PLACEHOLDER_CAR_IMAGE =
    "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23161616'/%3E%3Cpath d='M140 250 L180 175 Q205 145 245 145 L355 145 Q395 145 420 175 L460 250 Z' fill='%23222222' stroke='%23f5c400' stroke-width='4'/%3E%3Ccircle cx='205' cy='260' r='32' fill='%230f0f0f' stroke='%23f5c400' stroke-width='5'/%3E%3Ccircle cx='395' cy='260' r='32' fill='%230f0f0f' stroke='%23f5c400' stroke-width='5'/%3E%3Ctext x='50%25' y='345' text-anchor='middle' fill='%23777777' font-family='sans-serif' font-size='16' font-weight='700' letter-spacing='2'%3ECS AB AUTO%3C/text%3E%3C/svg%3E";

export function getImageUrl(photoPath) {
    if (!photoPath) return PLACEHOLDER_CAR_IMAGE;
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://') || photoPath.startsWith('data:')) {
        return photoPath;
    }
    const cleanBase = API_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    const cleanPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
    return `${cleanBase}${cleanPath}`;
}
