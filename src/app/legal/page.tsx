import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";

export default function LegalPage() {
  return (
    <div className="container max-w-2xl space-y-4 py-8">
      <BackButton fallbackHref="/dashboard" label="Back" />
      <Card>
        <CardHeader>
          <CardTitle>Terms &amp; Privacy</CardTitle>
          <CardDescription>How we operate and how we handle your data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Our full Terms of Service and Privacy Policy are coming soon.</p>
          <p>
            Questions in the meantime? Email{" "}
            <a href="mailto:legal@bizi.app" className="text-primary underline">legal@bizi.app</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
