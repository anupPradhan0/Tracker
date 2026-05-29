import { useMutation } from "@tanstack/react-query";
import { apiPost, formatApiError } from "@/lib/api-client";
import { toast } from "sonner";

type SendExpenseEmailResult = { sent: boolean; email: string };

export function useSendExpenseEmail(period: "WEEKLY" | "MONTHLY" = "MONTHLY") {
  return useMutation({
    mutationFn: (): Promise<SendExpenseEmailResult> =>
      apiPost<SendExpenseEmailResult>("/email/ai-summary", { period }),
    onSuccess: (data: SendExpenseEmailResult) => {
      toast.success(
        data?.email ? `Expense report sent to ${data.email}` : "Expense report sent"
      );
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
}
