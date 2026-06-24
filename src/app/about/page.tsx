import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";

export default function AboutPage() {
  return (
    <div className="container max-w-2xl space-y-4 py-8">
      <BackButton fallbackHref="/dashboard" label="Back" />
      <Card>
        <CardHeader>
          <CardTitle>About BIZI</CardTitle>
          <CardDescription>Trade skills, not money.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            BIZI is a trust-based barter marketplace where you exchange services with people in your
            community — no cash required.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
