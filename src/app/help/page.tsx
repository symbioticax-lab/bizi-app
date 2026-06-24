import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";

export default function HelpPage() {
  return (
    <div className="container max-w-2xl space-y-4 py-8">
      <BackButton fallbackHref="/dashboard" label="Back" />
      <Card>
        <CardHeader>
          <CardTitle>Help &amp; support</CardTitle>
          <CardDescription>We&apos;re here to help you trade with confidence.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Need a hand? Email us at{" "}
            <a href="mailto:support@bizi.app" className="text-primary underline">support@bizi.app</a>{" "}
            and we&apos;ll get back to you.
          </p>
          <p>More help articles are on the way.</p>
        </CardContent>
      </Card>
    </div>
  );
}
