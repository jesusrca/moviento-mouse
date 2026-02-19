import "./globals.css";

export const metadata = {
  title: "Movimiento 3D",
  description: "Modelo 3D que sigue el mouse"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
