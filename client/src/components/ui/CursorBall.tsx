import { useEffect, useRef } from 'react';

const FOLLOW_EASING = 0.16;
const CURSOR_SIZE = 18;

const CursorBall = () => {
    const cursorRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (isTouchDevice || prefersReducedMotion) {
            return;
        }

        const cursor = cursorRef.current;
        if (!cursor) {
            return;
        }

        let rafId = 0;
        let targetX = window.innerWidth / 2;
        let targetY = window.innerHeight / 2;
        let currentX = targetX;
        let currentY = targetY;
        let pressed = false;
        let visible = false;

        const render = () => {
            currentX += (targetX - currentX) * FOLLOW_EASING;
            currentY += (targetY - currentY) * FOLLOW_EASING;

            cursor.style.setProperty('--cursor-x', `${currentX - CURSOR_SIZE / 2}px`);
            cursor.style.setProperty('--cursor-y', `${currentY - CURSOR_SIZE / 2}px`);
            cursor.style.setProperty('--cursor-scale', pressed ? '0.82' : '1');

            rafId = window.requestAnimationFrame(render);
        };

        const show = () => {
            if (!visible) {
                visible = true;
                cursor.style.opacity = '1';
            }
        };

        const hide = () => {
            visible = false;
            cursor.style.opacity = '0';
        };

        const onPointerMove = (event: PointerEvent) => {
            targetX = event.clientX;
            targetY = event.clientY;
            show();
        };

        const onPointerDown = () => {
            pressed = true;
        };

        const onPointerUp = () => {
            pressed = false;
        };

        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerdown', onPointerDown, { passive: true });
        window.addEventListener('pointerup', onPointerUp, { passive: true });
        window.addEventListener('blur', hide);
        document.addEventListener('mouseleave', hide);

        rafId = window.requestAnimationFrame(render);

        return () => {
            window.cancelAnimationFrame(rafId);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('blur', hide);
            document.removeEventListener('mouseleave', hide);
        };
    }, []);

    return <div ref={cursorRef} className="cursor-ball" aria-hidden="true" />;
};

export default CursorBall;

