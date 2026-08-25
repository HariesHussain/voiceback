export const metadata = {
  title: 'VoiceBack — AI Revenue Recovery Agent',
  description: 'AI-assisted payment recovery and revenue recovery agent',
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
