import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-farm-100">
            <Construction className="h-8 w-8 text-farm-600" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            هذه الصفحة قيد التطوير. يمكنك متابعة المحادثة لإضافة المحتوى المطلوب.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            العودة للخلف
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
