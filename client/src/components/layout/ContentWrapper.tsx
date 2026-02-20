import type { PropsWithChildren } from 'react';

const ContentWrapper = ({ children }: PropsWithChildren) => {
    return (
        <main className="flex-1 overflow-y-auto min-w-0">
            <div className="mx-auto w-full max-w-screen-2xl px-6 py-6 lg:px-8 lg:py-8">
                {children}
            </div>
        </main>
    );
};

export default ContentWrapper;
