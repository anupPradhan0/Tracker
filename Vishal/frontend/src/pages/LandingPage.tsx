import { Link } from "react-router-dom";
import { BarChart3, Shield, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Wallet,
    title: "Track spending",
    description: "Organize your finances in a clean, structured workspace.",
  },
  {
    icon: BarChart3,
    title: "Weekly insights",
    description: "See patterns and stay on top of your budget goals.",
  },
  {
    icon: Shield,
    title: "Secure sign-in",
    description: "Google authentication with encrypted session handling.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold text-blue-700">
          <Wallet className="h-6 w-6" />
          Finance Tracker
        </div>
        <Link to="/login">
          <Button variant="outline">Sign in</Button>
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-8">
        <section className="animate-fade-in text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Modern finance tracking,
            <span className="text-blue-600"> built for clarity</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            A premium finance app to manage your money with confidence. Sign in with
            Google to get started.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/login">
              <Button size="lg">Get started</Button>
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="animate-fade-in">
              <CardContent className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{description}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
