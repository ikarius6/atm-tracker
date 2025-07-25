import './globals.css'

export const metadata = {
  title: 'ATM Empty Tracker',
  description: 'Reporta cajeros automáticos vacíos en tu área',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
