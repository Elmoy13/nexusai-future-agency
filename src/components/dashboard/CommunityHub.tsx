import { useNavigate } from "react-router-dom";
import { MessageSquare, Users, Hexagon, Sparkles, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CommunityHub = () => {
  const navigate = useNavigate();

  const brands = [
    {
      id: "aero-dynamics",
      name: "Aero Dynamics",
      campaigns: [
        {
          id: "drone-x10",
          name: "Lanzamiento Drone X10",
          unreadCount: 12,
          aiResponses: 47,
          humanRequired: 3,
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <MessageSquare className="text-primary" size={28} />
          Community & Social
        </h2>
        <p className="text-muted-foreground mt-1">
          Gestiona la comunicación omnicanal con IA autónoma y base de conocimiento RAG.
        </p>
      </div>

      {/* Brands Grid */}
      <div className="grid gap-6">
        {brands.map((brand) => (
          <Card
            key={brand.id}
            className="bg-card/50 border-border/30 hover:border-primary/30 transition-all duration-300"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center border border-primary/30">
                    <Hexagon className="text-primary" size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{brand.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">Inbox activo</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary">
                  <Users size={12} className="mr-1" />
                  {brand.campaigns.reduce((acc, c) => acc + c.unreadCount, 0)} sin leer
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {brand.campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 rounded-xl bg-muted/20 border border-border/20 hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="text-cyan-400" size={18} />
                      <span className="font-medium">{campaign.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        {campaign.aiResponses} respuestas IA
                      </span>
                      <span className="flex items-center gap-1 text-amber-400">
                        🧑‍💻 {campaign.humanRequired} requiere humano
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => navigate(`/community/${campaign.id}`)}
                      className="bg-gradient-to-r from-primary/80 to-cyan-500/80 hover:from-primary hover:to-cyan-500 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      <Sparkles size={14} className="mr-2" />
                      💬 Abrir Omnichannel Inbox
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CommunityHub;
