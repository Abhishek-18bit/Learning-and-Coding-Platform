import { motion } from 'framer-motion';

interface RouteTransitionLayerProps {
    routeKey: string;
}

const RouteTransitionLayer = ({ routeKey }: RouteTransitionLayerProps) => {
    return (
        <motion.div
            key={routeKey}
            className="route-transition-layer"
            initial={{ opacity: 0.55, x: '-38%', scaleX: 1.1 }}
            animate={{ opacity: 0, x: '68%', scaleX: 0.98 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        />
    );
};

export default RouteTransitionLayer;

