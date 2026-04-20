import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderOpen, PenTool, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import BriefsDirectory from "./briefs/BriefsDirectory";
import BriefStarter from "./briefs/BriefStarter";
import BriefCreator from "./briefs/BriefCreator";

type SubView = "directory" | "new-brief";

const BriefsModule = () => {
  const navigate = useNavigate();
  const [subView, setSubView] = useState<SubView>("directory");
  const [activeBriefId, setActiveBriefId] = useState<string | null>(null);

  // Active brief session view (after starter completes)
  if (activeBriefId) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveBriefId(null);
              setSubView("directory");
            }}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} /> Volver al directorio
          </Button>
        </div>
        <BriefCreator briefId={activeBriefId} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <Tabs value={subView} onValueChange={(v) => setSubView(v as SubView)}>
        <div className="flex justify-end mb-6">
          <TabsList className="bg-secondary/50 border border-border/50 h-11">
            <TabsTrigger value="directory" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary px-5">
              <FolderOpen size={15} className="mr-1.5" /> Directorio
            </TabsTrigger>
            <TabsTrigger value="new-brief" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary px-5">
              <PenTool size={15} className="mr-1.5" /> Entrenar brief
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="directory">
          <BriefsDirectory
            onOpenBrand={(brandId) => navigate(`/brand/${brandId}`)}
            onNewBrief={() => setSubView("new-brief")}
          />
        </TabsContent>

        <TabsContent value="new-brief">
          <BriefStarter onStart={(id) => setActiveBriefId(id)} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BriefsModule;
