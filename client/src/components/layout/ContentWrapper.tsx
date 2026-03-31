import type { PropsWithChildren } from 'react';

interface ContentWrapperProps extends PropsWithChildren {
    fullWidth?: boolean;
}

const ContentWrapper = ({ children, fullWidth = false }: ContentWrapperProps) => {
    return (
        <main className="flex-1 overflow-y-auto min-w-0">
            <div
                className={
                    fullWidth
                        ? 'w-full px-3 py-3 lg:px-4 lg:py-4'
                        : 'mx-auto w-full max-w-[120rem] px-3 py-3 lg:px-4 lg:py-4 2xl:px-6 2xl:py-5'
                }
            >
                {children}
            </div>
        </main>
    );
};

export default ContentWrapper;
