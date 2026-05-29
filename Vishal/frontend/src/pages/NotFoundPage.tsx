import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/auth";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-white p-4">
      <Card className="w-full max-w-md animate-fade-in border-white/40 bg-white/80 text-center shadow-xl backdrop-blur-md">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Wallet className="h-6 w-6" />
          </div>
          <CardTitle className="text-3xl">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">The page you&apos;re looking for doesn&apos;t exist.</p>
          <Link to={ROUTES.home}>
            <Button>Back to home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
