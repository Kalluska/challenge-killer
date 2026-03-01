import "./globals.css";
import GlowBackground from "@/components/GlowBackground";
import PageTransition from "@/components/PageTransition";

export const metadata = {
  title: "Challenge KillerTM",
  description: "Stop blowing prop firm accounts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GlowBackground>
          <PageTransition>{children}</PageTransition>
        </GlowBackground>
      </body>
    </html>
  );
}
