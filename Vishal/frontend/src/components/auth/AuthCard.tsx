import type { ReactNode } from "react";
import { Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card className="animate-fade-in w-full max-w-md">
      <CardHeader className="text-center">
        <div className="icon-badge-3d mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-white">
          <Wallet className="h-7 w-7" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
      {footer && (
        <div className="border-t border-indigo-100/60 px-6 pb-6 pt-2 text-center text-sm">
          {footer}
        </div>
      )}
    </Card>
  );
}
