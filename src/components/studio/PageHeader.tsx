export function PageHeader({
  title,
  subtitle,
  links,
}: {
  title: string;
  subtitle: string;
  links?: { label: string; href: string }[];
}) {
  return (
    <header className="animate-float-up border-b border-border/60 px-6 py-8 lg:px-10">
      <h1 className="font-display text-4xl font-black tracking-tight lg:text-5xl">
        {title}
      </h1>
      {links ? (
        <nav className="label-mono mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-muted-foreground">
          {links.map((link, index) => (
            <span key={link.href} className="flex items-center gap-3">
              {index > 0 && <span aria-hidden="true">·</span>}
              <a href={link.href} className="transition-colors hover:text-neon-violet">
                {link.label}
              </a>
            </span>
          ))}
        </nav>
      ) : (
        <p className="label-mono mt-2 text-[11px] text-muted-foreground">
          {subtitle}
        </p>
      )}
    </header>
  );
}
