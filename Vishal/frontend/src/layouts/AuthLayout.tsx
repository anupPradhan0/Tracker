import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-mesh relative min-h-screen overflow-hidden">
      <div className="float-orb float-orb-indigo -left-24 top-20 h-72 w-72" />
      <div className="float-orb float-orb-cyan -right-16 bottom-10 h-80 w-80" />
      <div className="float-orb float-orb-violet left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
