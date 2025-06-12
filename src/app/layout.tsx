
"use client"; // Adicionado para useEffect

import type {Metadata} from 'next'; // Metadata pode não ser totalmente eficaz com "use client" no root layout para PWA tags estáticas
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from 'react'; // Importado useEffect

// A definição de Metadata aqui pode ter limitações com "use client".
// Para PWA tags estáticas no <head>, é ideal que o layout raiz não seja "use client".
// No entanto, para registrar o service worker, precisamos de lógica do lado do cliente.
// Considere mover o registro do SW para um componente filho, se possível,
// ou usar abordagens alternativas para injetar tags no <head> se este layout precisar ser "use client".

// export const metadata: Metadata = { // Comentado pois "use client" pode afetar
//   title: 'Hiperfarma Business Meeting Manager',
//   description: 'Gerencie seus encontros de negócios Hiperfarma de forma eficiente.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => console.log('Service Worker registrado com escopo:', registration.scope))
        .catch((error) => console.log('Falha ao registrar Service Worker:', error));
    }
  }, []);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#383847" />
        {/* Adicione mais meta tags para PWA se necessário, como para iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Hiperfarma BMM" />
        {/* Você precisaria adicionar links para apple-touch-icon aqui se tivesse os ícones */}
        {/* <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" /> */}
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
