import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Consultant Copilot',
    description: 'AI Meeting Assistant powered by Gemini 1.5 Flash',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
