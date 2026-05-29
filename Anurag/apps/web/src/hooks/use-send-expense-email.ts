import { useMutation } from "@tanstack/react-query";
import { apiPost } from "@/lib/api-client";
import { toast } from "sonner";

export function useSendExpenseEmail(period: "WEEKLY" | "MONTHLY" = "MONTHLY") {
  return useMutation({
    mutationFn: () =>
      apiPost<{ sent: boolean; email: string }>("/email/ai-summary", { period }),
    onSuccess: (data) => {
      toast.success(
        data?.email ? `Expense report sent to ${data.email}` : "Expense report sent"
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
