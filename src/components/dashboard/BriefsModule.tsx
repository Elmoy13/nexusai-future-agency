import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderOpen, PenTool } from "lucide-react";
import BrandPortfolioDirectory from "./briefs/BrandPortfolioDirectory";
import BrandHub from "./briefs/BrandHub";
import IdentityGenerator from "./briefs/IdentityGenerator";
import BriefCreator from "./briefs/BriefCreator";

type SubView = "directory" | "brand-hub" | "new-brief";

const BriefsModule = () => {
  const navigate = useNavigate();
  const [subView, setSubView] = useState<SubView>("directory");
  const [selectedBrand, setSelectedBrand] = useState<string>("");

  const openBrand = (name: string) => {
    setSelectedBrand(name);
    setSubView("brand-hub");
  };

  if (subView === "brand-hub" && selectedBrand) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        <BrandHub brandName={selectedBrand} onBack={() => setSubView("directory")} />
        <IdentityGenerator />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <Tabs value={subView === "new-brief" ? "new-brief" : "directory"} onValueChange={(v) => setSubView(v as SubView)}>
        <div className="flex justify-end mb-6">
          <TabsList className="bg-secondary/50 border border-border/50 h-11">
            <TabsTrigger value="directory" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary px-5">
              <FolderOpen size={15} className="mr-1.5" /> Directorio
            </TabsTrigger>
            <TabsTrigger value="new-brief" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary px-5">
              <PenTool size={15} className="mr-1.5" /> Entrenar Brief
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="directory">
          <BrandPortfolioDirectory
            onOpenBrand={openBrand}
            onNewBrand={() => navigate("/agente/nueva-marca")}
          />
        </TabsContent>

        <TabsContent value="new-brief">
          <BriefCreator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BriefsModule;
