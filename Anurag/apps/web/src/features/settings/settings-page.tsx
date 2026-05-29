import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut, apiDelete, apiPatch } from "@/lib/api-client";
import type { AiKeyStatus, EmailSettingsDto } from "@anurag/types";
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { NativeSelect } from "@/components/shared/native-select";
import { toast } from "sonner";
import { LogOut, Moon, Sun } from "lucide-react";

type AiProviderId = "gemini" | "openai" | "cohere";

const AI_PROVIDERS: { id: AiProviderId; label: string }[] = [
  { id: "gemini", label: "Google Gemini" },
  { id: "openai", label: "OpenAI" },
  { id: "cohere", label: "Cohere" },
];

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useLogout();
  const qc = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<AiProviderId>("cohere");
  const [preferredProvider, setPreferredProvider] = useState<AiProviderId>("cohere");
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [senderEmail, setSenderEmail] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");

  const { data: aiKeys } = useQuery({
    queryKey: ["ai-keys"],
    queryFn: () => apiGet<AiKeyStatus[]>("/users/me/ai-keys/status").then((r) => r.data),
  });

  const { data: emailSettings } = useQuery({
    queryKey: ["email-settings"],
    queryFn: () => apiGet<EmailSettingsDto>("/users/me/email-settings").then((r) => r.data),
  });

  useEffect(() => {
    if (emailSettings) {
      setSenderEmail(emailSettings.reportSenderEmail ?? "");
      setReceiverEmail(emailSettings.reportReceiverEmail ?? "");
    }
  }, [emailSettings]);

  useEffect(() => {
    if (user?.preferredAiProvider) {
      const p = user.preferredAiProvider as AiProviderId;
      setPreferredProvider(p);
      setProvider(p);
    }
  }, [user?.preferredAiProvider]);

  const savePreferredProvider = useMutation({
    mutationFn: (p: AiProviderId) => apiPatch("/users/me", { preferredAiProvider: p }),
    onSuccess: (_, p) => {
      if (user && accessToken) {
        setAuth({ ...user, preferredAiProvider: p }, accessToken);
      }
      toast.success("Active AI provider updated");
    },
    onError: (e: Error) => toast.error(e.message),
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

  const saveEmailSettings = useMutation({
    mutationFn: (): Promise<EmailSettingsDto> =>
      apiPatch<EmailSettingsDto>("/users/me/email-settings", {
        reportSenderEmail: senderEmail.trim() || null,
        reportReceiverEmail: receiverEmail.trim() || null,
      }),
    onSuccess: (data: EmailSettingsDto) => {
      qc.invalidateQueries({ queryKey: ["email-settings"] });
      if (user && accessToken) {
        setAuth(
          {
            ...user,
            reportSenderEmail: data.reportSenderEmail,
            reportReceiverEmail: data.reportReceiverEmail,
          },
          accessToken
        );
      }
      toast.success("Email settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setDark(!dark);
  };

  return (
    <div className="space-y-5 pb-4 sm:space-y-6 sm:pb-0">
      <PageHeader title="Settings" description="Profile, email reports, and AI keys" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-[var(--color-muted-foreground)]">Name:</span> {user?.name}
          </p>
          <p>
            <span className="text-[var(--color-muted-foreground)]">Account:</span> {user?.email}
          </p>
          <p>
            <span className="text-[var(--color-muted-foreground)]">Currency:</span> {user?.currency}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Configure sender and receiver for expense reports with AI summary. SMTP credentials
            stay in server environment variables.
          </p>
          <div className="space-y-2">
            <Label htmlFor="sender-email">Sender email</Label>
            <Input
              id="sender-email"
              type="email"
              placeholder="from@example.com"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
            />
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Shown as the From address. Must be allowed by your SMTP provider.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiver-email">Receiver email</Label>
            <Input
              id="receiver-email"
              type="email"
              placeholder="reports@example.com"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
            />
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Detailed expense report and AI summary are sent here.
            </p>
          </div>
          <Button
            className="w-full sm:w-auto"
            onClick={() => saveEmailSettings.mutate()}
            disabled={saveEmailSettings.isPending || !receiverEmail.trim()}
          >
            Save email settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Active provider (used for AI summary &amp; email)</Label>
            <NativeSelect
              value={preferredProvider}
              onChange={(e) => {
                const p = e.target.value as AiProviderId;
                setPreferredProvider(p);
                savePreferredProvider.mutate(p);
              }}
              disabled={savePreferredProvider.isPending}
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          {aiKeys?.map((k) => (
            <div
              key={k.provider}
              className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {AI_PROVIDERS.find((p) => p.id === k.provider)?.label ?? k.provider}
                </p>
                <p className="text-[var(--color-muted-foreground)]">
                  {k.configured ? k.keyHint : "Not configured"}
                </p>
              </div>
              {k.configured && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => removeKey.mutate(k.provider)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
            <Label>Provider</Label>
            <NativeSelect
              value={provider}
              onChange={(e) => setProvider(e.target.value as AiProviderId)}
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </NativeSelect>
            <Label>API Key</Label>
            <Input
              type="password"
              placeholder="Paste your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button
              className="w-full sm:w-auto"
              onClick={() => saveKey.mutate()}
              disabled={!apiKey || saveKey.isPending}
            >
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
