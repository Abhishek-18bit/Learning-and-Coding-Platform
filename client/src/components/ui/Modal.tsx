import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import Card from './Card';
import Button from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    maxWidthClassName?: string;
}

const Modal = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    maxWidthClassName = 'max-w-xl',
}: ModalProps) => {
    useEffect(() => {
        if (!isOpen) return;
        const onEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Close modal backdrop"
                onClick={onClose}
                className="absolute inset-0 bg-background/75 backdrop-blur-sm modal-fade-overlay"
            />

            <Card
                variant="glass"
                className={`relative w-full ${maxWidthClassName} p-0 overflow-hidden modal-fade-panel`}
            >
                <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
                    <div className="min-w-0">
                        {title && <h3 className="typ-h3 mb-0 text-gray-900">{title}</h3>}
                        {description && <p className="typ-muted mt-1">{description}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="!p-2">
                        <X size={16} />
                    </Button>
                </div>

                <div className="px-6 py-5">{children}</div>

                {footer && <div className="border-t border-border px-6 py-4">{footer}</div>}
            </Card>
        </div>
    );
};

export default Modal;
