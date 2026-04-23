import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateConversationActiveBrand } from "@/lib/conversationService";
import { toast } from "sonner";

export function useUpdateConversationActiveBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      brandId,
    }: {
      conversationId: string;
      brandId: string;
    }) => updateConversationActiveBrand(conversationId, brandId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Marca activa actualizada");
    },
    onError: (err) => {
      toast.error("Error cambiando marca activa", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}
