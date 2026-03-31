import { useMemo } from 'react';
import type { CSSProperties } from 'react';

interface BattleParticle {
    id: number;
    left: number;
    top: number;
    size: number;
    duration: number;
    delay: number;
    driftX: number;
    driftY: number;
}

const createParticle = (id: number): BattleParticle => ({
    id,
    left: (id * 41 + 7) % 100,
    top: (id * 29 + 11) % 100,
    size: 1 + ((id * 3) % 3),
    duration: 16 + ((id * 7) % 18),
    delay: (id * 1.7) % 20,
    driftX: ((id * 5) % 10) - 5,
    driftY: ((id * 11) % 14) - 7,
});

const BattleBackground = () => {
    const particles = useMemo(
        () => Array.from({ length: 24 }, (_, index) => createParticle(index + 1)),
        []
    );

    return (
        <div className="battle-bg" aria-hidden="true">
            <div className="battle-bg-base" />
            <div className="battle-bg-overlay" />
            <div className="battle-bg-glow" />
            <div className="battle-bg-grid-floor" />
            <div className="battle-bg-grid-floor battle-bg-grid-floor-l2" />
            <div className="battle-bg-digital-lines" />
            <div className="battle-bg-depth-blur" />

            <div className="battle-bg-particles">
                {particles.map((particle) => {
                    const style = {
                        left: `${particle.left}%`,
                        top: `${particle.top}%`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        animationDuration: `${particle.duration}s`,
                        animationDelay: `-${particle.delay}s`,
                        '--battle-particle-x': `${particle.driftX}px`,
                        '--battle-particle-y': `${particle.driftY}px`,
                    } as CSSProperties;

                    return <span key={particle.id} className="battle-bg-particle" style={style} />;
                })}
            </div>
        </div>
    );
};

export default BattleBackground;
