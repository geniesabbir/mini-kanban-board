import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { Navbar } from '../components/navbar';

export const metadata: Metadata = {
  title: 'Mini Kanban Board - Collaboration & Task Management',
  description:
    'Full-stack Mini Kanban Board application with drag-and-drop task movement, JWT auth, and board sharing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-50 text-gray-900 antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
