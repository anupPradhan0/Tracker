import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/auth";

export function NotFoundPage() {
  return (
    <div className="bg-mesh relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="float-orb float-orb-indigo -left-24 top-20 h-72 w-72" />
      <div className="float-orb float-orb-cyan -right-16 bottom-10 h-80 w-80" />
      <Card className="relative z-10 w-full max-w-md animate-fade-in text-center">
        <CardHeader>
          <div className="icon-badge-3d mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white">
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
