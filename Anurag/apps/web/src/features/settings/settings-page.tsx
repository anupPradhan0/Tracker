import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut, apiDelete } from "@/lib/api-client";
import type { AiKeyStatus } from "@anurag/types";
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogOut, Moon, Sun } from "lucide-react";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const qc = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<"gemini" | "openai">("gemini");
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  const { data: aiKeys } = useQuery({
    queryKey: ["ai-keys"],
    queryFn: () => apiGet<AiKeyStatus[]>("/users/me/ai-keys/status").then((r) => r.data),
  });

  const saveKey = useMutation({
    mutationFn: () => apiPut(`/users/me/ai-keys/${provider}`, { apiKey }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-keys"] });
      setApiKey("");
      toast.success("API key saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeKey = useMutation({
    mutationFn: (p: string) => apiDelete(`/users/me/ai-keys/${p}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-keys"] });
      toast.success("API key removed");
    },
  });

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setDark(!dark);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-[var(--color-muted-foreground)]">Name:</span> {user?.name}
          </p>
          <p>
            <span className="text-[var(--color-muted-foreground)]">Email:</span> {user?.email}
          </p>
          <p>
            <span className="text-[var(--color-muted-foreground)]">Currency:</span> {user?.currency}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiKeys?.map((k) => (
            <div key={k.provider} className="flex items-center justify-between text-sm">
              <span className="capitalize">{k.provider}</span>
              <span className="text-[var(--color-muted-foreground)]">
                {k.configured ? k.keyHint : "Not configured"}
              </span>
              {k.configured && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeKey.mutate(k.provider)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
            <Label>Provider</Label>
            <select
              className="flex h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm"
              value={provider}
              onChange={(e) => setProvider(e.target.value as "gemini" | "openai")}
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
            </select>
            <Label>API Key</Label>
            <Input
              type="password"
              placeholder="Paste your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button onClick={() => saveKey.mutate()} disabled={!apiKey || saveKey.isPending}>
              Save key
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <span className="text-sm font-medium">Appearance</span>
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        className="w-full"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}
