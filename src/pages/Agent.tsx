import { useSearchParams } from "react-router-dom";
import BriefCreator from "@/components/dashboard/briefs/BriefCreator";

const Agent = () => {
  const [searchParams] = useSearchParams();
  const brandName = searchParams.get("brand") ?? undefined;

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <BriefCreator brandName={brandName} />
    </div>
  );
};

export default Agent;
