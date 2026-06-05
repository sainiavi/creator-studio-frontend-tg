export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header className="animate-float-up border-b border-border/60 px-6 py-8 lg:px-10">
      <h1 className="font-display text-4xl font-black tracking-tight lg:text-5xl">
        {title}
      </h1>
      <p className="label-mono mt-2 text-[11px] text-muted-foreground">
        {subtitle}
      </p>
    </header>
  );
}