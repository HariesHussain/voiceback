import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'VoiceBack — AI Revenue Recovery Agent',
  description: 'AI-assisted payment recovery and revenue recovery agent for Razorpay merchants',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0F0F0F] text-gray-100 font-sans antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
