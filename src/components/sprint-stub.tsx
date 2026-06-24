import Link from "next/link";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SprintStub({ title, sprint, hint }: { title: string; sprint: string; hint?: string }) {
  return (
    <div className="container max-w-2xl py-16">
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Construction className="size-5" />
        </div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Lands in <span className="text-foreground">{sprint}</span> per the project plan.
          {hint ? ` ${hint}` : ""}
        </p>
        <Button asChild variant="outline" className="mt-5"><Link href="/dashboard">Back to dashboard</Link></Button>
      </div>
    </div>
  );
}
