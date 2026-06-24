import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileItemDialog } from "./profile-item-dialog";
import { deleteOfferingAction, deleteWantAction } from "@/app/profile/items/actions";

type Item = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
};

type Props = {
  kind: "offering" | "want";
  title: string;
  items: Item[];
  manageable: boolean;
};

export function ProfileItemsCard({ kind, title, items, manageable }: Props) {
  const deleteAction = kind === "offering" ? deleteOfferingAction : deleteWantAction;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {manageable && <ProfileItemDialog kind={kind} triggerVariant="add" />}
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card/40 p-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{it.title}</span>
                    {it.category && <Badge variant="muted">{it.category}</Badge>}
                  </div>
                  {it.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{it.description}</p>
                  )}
                  {it.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {it.tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
                    </div>
                  )}
                </div>

                {manageable && (
                  <div className="flex shrink-0 gap-1">
                    <ProfileItemDialog
                      kind={kind}
                      triggerVariant="edit"
                      initial={{
                        id: it.id,
                        title: it.title,
                        description: it.description ?? "",
                        category: it.category ?? "",
                        tags: it.tags,
                      }}
                    />
                    <form action={deleteAction}>
                      <input type="hidden" name="id" value={it.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${kind}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            {manageable
              ? `No ${kind === "offering" ? "offerings" : "wants"} yet — add one to help people find you.`
              : `No ${kind === "offering" ? "offerings" : "wants"} listed.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
