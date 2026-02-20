import { useMemo } from 'react';
import type { CSSProperties } from 'react';

interface Particle {
    id: number;
    left: number;
    top: number;
    size: number;
    duration: number;
    delay: number;
    driftX: number;
    driftY: number;
}

const createParticle = (id: number): Particle => ({
    id,
    left: (id * 37 + 11) % 100,
    top: (id * 53 + 17) % 100,
    size: 2 + ((id * 7) % 5),
    duration: 10 + (id % 9),
    delay: (id * 1.8) % 14,
    driftX: ((id * 3) % 7) - 3,
    driftY: 12 + ((id * 5) % 18),
});

const AmbientParticles = () => {
    const particles = useMemo(() => Array.from({ length: 28 }, (_, index) => createParticle(index + 1)), []);

    return (
        <div className="ambient-particles" aria-hidden="true">
            {particles.map((particle) => {
                const style = {
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    animationDuration: `${particle.duration}s`,
                    animationDelay: `-${particle.delay}s`,
                    '--particle-drift-x': `${particle.driftX}px`,
                    '--particle-drift-y': `${particle.driftY}px`,
                } as CSSProperties;

                return <span key={particle.id} className="ambient-particle" style={style} />;
            })}
        </div>
    );
};

export default AmbientParticles;

