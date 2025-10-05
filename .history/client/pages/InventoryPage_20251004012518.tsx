import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  ArrowRight,
} from "lucide-react";

type ViewState = 
  | "main"
  | "inventory";

export default function InventoryPage() {
  const [currentView, setCurrentView] = useState<ViewState>("main");

  const handleBack = () => {
      setCurrentView("main");
  };

  const renderMainView = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-farm-800 mb-2">إدارة المخزون</h1>
        <p className="text-muted-foreground">مسؤول المخزن</p>
      </div>

      <div className="max-w-md mx-auto">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500 flex items-center justify-center">
              <Package className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-farm-800 mb-2">
              المخزون
            </h3>
            <p className="text-muted-foreground mb-4">
              إدارة المخزون العام
            </p>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("inventory")}
            >
              فتح
              <ArrowRight className="h-4 w-4 mr-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderInventoryView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">المخزون</h2>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-farm-800 mb-4">
                إدارة المخزون
            </h3>
              <p className="text-muted-foreground">
                هنا يمكنك إدارة المخزون العام للمزرعة
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-semibold text-farm-800 mb-2">إجمالي الأغنام</h4>
                <p className="text-2xl font-bold text-blue-600">150</p>
            </div>
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-semibold text-farm-800 mb-2">الذكور</h4>
                <p className="text-2xl font-bold text-green-600">75</p>
      </div>
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-semibold text-farm-800 mb-2">الإناث</h4>
                <p className="text-2xl font-bold text-pink-600">75</p>
    </div>
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-semibold text-farm-800 mb-2">العنابر</h4>
                <p className="text-2xl font-bold text-purple-600">3</p>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );






  const renderCurrentView = () => {
    switch (currentView) {
      case "main":
        return renderMainView();
      case "inventory":
        return renderInventoryView();
      default:
        return renderMainView();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {renderCurrentView()}
      </div>
    </div>
  );
}