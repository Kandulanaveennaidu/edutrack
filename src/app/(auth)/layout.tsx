export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[hsl(0_0%_98.5%)] dark:bg-[hsl(240_10%_4%)] overflow-hidden">
      {/* Premium mesh gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(252_82%_58%/0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_0%_100%,hsl(280_68%_55%/0.06),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,hsl(199_89%_48%/0.04),transparent_40%)]" />
      {/* Dark mode adjustments */}
      <div className="pointer-events-none absolute inset-0 dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(252_90%_67%/0.10),transparent_60%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
