import { cn } from "@/lib/utils";
import { Footer } from "@/modules/home/footer";
import { Header } from "@/modules/home/header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "ScriptsAI - %s",
    default: "ScriptsAI - Your AI Script Assistant",
  },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* GRID BACKGROUND */}
      <div
        className={cn(
          "absolute inset-0 z-0",
          "bg-[length:40px_40px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
        )}
      />

      {/* RADIAL FADE */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-white/70 dark:bg-black/70 [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)]" />

      <Header />
      <main className="z-20 relative w-full pt-0">{children}</main>
      <Footer />
    </div>
  );
}
