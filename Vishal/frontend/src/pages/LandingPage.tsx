import { Link } from "react-router-dom";
import { BarChart3, Shield, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/auth";

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
    description: "Email and password authentication with encrypted session handling.",
  },
];

const staggerClasses = ["stagger-1", "stagger-2", "stagger-3"] as const;

export function LandingPage() {
  return (
    <div className="bg-mesh relative min-h-screen overflow-hidden">
      <div className="float-orb float-orb-indigo -left-32 top-0 h-96 w-96" />
      <div className="float-orb float-orb-cyan -right-24 bottom-0 h-80 w-80" />

      <header className="relative z-10 mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
        <div className="flex items-center gap-2 font-semibold text-indigo-700">
          <div className="icon-badge-3d flex h-9 w-9 items-center justify-center rounded-lg text-white">
            <Wallet className="h-5 w-5 shrink-0" />
          </div>
          Finance Tracker
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
          <Link to={ROUTES.login} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Sign in
            </Button>
          </Link>
          <Link to={ROUTES.register} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Sign up</Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <section className="animate-fade-in text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Modern finance tracking,
            <span className="text-gradient-primary"> built for clarity</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            A premium finance app to manage your money with confidence. Create an account
            or sign in to get started.
          </p>
          <div className="mx-auto mt-8 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
            <Link to={ROUTES.register} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                Get started
              </Button>
            </Link>
            <Link to={ROUTES.login} className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign in
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, index) => (
            <Card
              key={title}
              className={`group animate-fade-in ${staggerClasses[index] ?? ""}`}
            >
              <CardContent className="p-6">
                <div className="icon-badge-3d mb-4 flex h-10 w-10 items-center justify-center rounded-lg text-white">
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
