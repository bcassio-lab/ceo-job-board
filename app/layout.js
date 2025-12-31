import './globals.css'

export const metadata = {
  title: 'CEO Fresno Fair Chance Job Board',
  description: 'Curated job opportunities for returning citizens',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
