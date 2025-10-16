import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";

const Prospects = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("crm_user");
    if (!user) {
      navigate("/auth");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6">
          <Card className="p-8 text-center border-border/50">
            <h2 className="text-2xl font-bold mb-2">Gestion des prospects</h2>
            <p className="text-muted-foreground">À venir...</p>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Prospects;
