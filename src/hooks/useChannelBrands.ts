import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChannelBrands, updateChannelBrands } from "@/lib/channelService";
import type { ChannelBrandAssignment } from "@/types/channels";
import { toast } from "sonner";

export function useChannelBrands(channelId: string | null) {
  return useQuery({
    queryKey: ["channel-brands", channelId],
    queryFn: () => getChannelBrands(channelId!),
    enabled: !!channelId,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateChannelBrands() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      channelId,
      assignments,
    }: {
      channelId: string;
      assignments: Omit<ChannelBrandAssignment, "brand_name">[];
    }) => updateChannelBrands(channelId, assignments),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["channel-brands", variables.channelId] });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      toast.success("Asignaciones actualizadas");
    },
    onError: (err) => {
      toast.error("Error actualizando asignaciones", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });
}
