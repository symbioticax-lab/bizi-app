import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "./star-rating";
import { reviewTagLabel } from "@/lib/review-tags";
import { initials, formatRelative } from "@/lib/utils";

type Reviewer = {
  username: string;
  display_name: string;
  avatar_url: string | null;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  tags: string[];
  created_at: string;
};

export function ReviewCard({ review, reviewer }: { review: Review; reviewer: Reviewer }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <header className="flex items-center justify-between gap-2">
          <Link href={`/profile/${reviewer.username}`} className="flex items-center gap-2 hover:underline">
            <Avatar className="h-8 w-8">
              {reviewer.avatar_url && <AvatarImage src={reviewer.avatar_url} alt="" />}
              <AvatarFallback>{initials(reviewer.display_name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium leading-tight">{reviewer.display_name}</div>
              <div className="text-xs text-muted-foreground">@{reviewer.username}</div>
            </div>
          </Link>
          <StarRating value={review.rating} size="sm" readOnly />
        </header>

        {review.comment && <p className="whitespace-pre-line text-sm">{review.comment}</p>}

        {review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {review.tags.map((t) => <Badge key={t} variant="muted">{reviewTagLabel(t)}</Badge>)}
          </div>
        )}

        <p className="text-xs text-muted-foreground">{formatRelative(review.created_at)}</p>
      </CardContent>
    </Card>
  );
}
