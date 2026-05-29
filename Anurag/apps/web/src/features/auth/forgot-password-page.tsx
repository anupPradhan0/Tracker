import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            Password reset via email is coming soon. Contact support if you need help.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
