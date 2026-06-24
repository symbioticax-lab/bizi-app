import { type Person, PersonCard } from "./person-card";

type Props = {
  title: string;
  subtitle?: string;
  people: Person[];
  bookmarkable?: boolean;
};

/**
 * Horizontal-scroll rail of PersonCards. Renders nothing when empty so the
 * page doesn't show a hollow heading. The fixed card width keeps rails
 * visually distinct from the grid below.
 */
export function PersonRail({ title, subtitle, people, bookmarkable = false }: Props) {
  if (people.length === 0) return null;

  return (
    <section aria-label={title} className="space-y-2.5">
      <header className="space-y-0.5">
        <h3 className="text-base font-semibold tracking-tight md:text-lg">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </header>

      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max snap-x snap-mandatory gap-3">
          {people.map((p) => (
            <div key={p.id} className="w-40 shrink-0 snap-start sm:w-44 md:w-48">
              <PersonCard person={p} bookmarkable={bookmarkable} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
