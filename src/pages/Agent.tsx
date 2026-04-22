import { useSearchParams } from "react-router-dom";
import BriefCreator from "@/components/dashboard/briefs/BriefCreator";
import type { BriefKind } from "@/lib/briefService";

const Agent = () => {
  const [searchParams] = useSearchParams();
  const brandName = searchParams.get("brand") ?? undefined;
  const briefId = searchParams.get("briefId") ?? undefined;
  const brandId = searchParams.get("brandId") ?? undefined;
  const kindParam = searchParams.get("kind");
  const kind: BriefKind | undefined =
    kindParam === "strategic" || kindParam === "campaign" ? kindParam : undefined;

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <BriefCreator
        brandName={brandName}
        briefId={briefId}
        brandId={brandId}
        kind={kind}
      />
    </div>
  );
};

export default Agent;
