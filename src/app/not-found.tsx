import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold">Nothing here</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        That listing or profile may have been removed, or the link is wrong.
      </p>
      <Button asChild><Link href="/">Back home</Link></Button>
    </div>
  );
}
