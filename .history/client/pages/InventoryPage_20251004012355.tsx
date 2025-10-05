import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Package,
  ArrowRight,
  Save,
  X,
} from "lucide-react";

type ViewState = 
  | "main"
  | "inventory";

export default function InventoryPage() {
  const [currentView, setCurrentView] = useState<ViewState>("main");
  const [formData, setFormData] = useState<any>({});

  const handleBack = () => {
    if (currentView === "entry") {
      setCurrentView("main");
    } else if (currentView.startsWith("sheep_")) {
      setCurrentView("entry");
    }
  };

  const handleSave = () => {
    toast({
      title: "تم الحفظ بنجاح",
      description: "تم تسجيل البيانات بنجاح",
    });
    setFormData({});
    handleBack();
  };

  const renderMainView = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-farm-800 mb-2">إدارة المخزون</h1>
        <p className="text-muted-foreground">تسجيل دخول الأغنام</p>
      </div>

      <div className="max-w-md mx-auto">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500 flex items-center justify-center">
              <Package className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-farm-800 mb-2">
              تسجيل دخول الأغنام
            </h3>
            <p className="text-muted-foreground mb-4">
              تسجيل دخول الأغنام الجديدة
            </p>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("entry")}
            >
              فتح
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderEntryView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">تسجيل دخول الأغنام</h2>
      </div>

      <div className="max-w-md mx-auto">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-400 flex items-center justify-center">
              <CircleDot className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-farm-800 mb-2">
              تسجيل غنم
            </h3>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("sheep_entry")}
            >
              فتح
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );


  const renderSheepEntryView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">تسجيل غنم</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500 flex items-center justify-center">
              <CircleDot className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-farm-800 mb-2">
              ذكور
            </h3>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("sheep_male")}
            >
              فتح
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500 flex items-center justify-center">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-farm-800 mb-2">
              إناث
            </h3>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("sheep_female")}
            >
              فتح
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSheepForm = (type: "male" | "female") => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">
          تسجيل {type === "male" ? "ذكور" : "إناث"}
        </h2>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="number">رقم الغنم</Label>
            <Input
              id="number"
              placeholder="أدخل رقم الغنم"
              value={formData.number || ""}
              onChange={(e) => setFormData({...formData, number: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="weight">الوزن (كيلو)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="أدخل الوزن"
              value={formData.weight || ""}
              onChange={(e) => setFormData({...formData, weight: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="barn">العنبر</Label>
            <Select value={formData.barn || ""} onValueChange={(value) => setFormData({...formData, barn: value})}>
              <SelectTrigger>
                <SelectValue placeholder="اختر العنبر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="barn1">عنبر 1</SelectItem>
                <SelectItem value="barn2">عنبر 2</SelectItem>
                <SelectItem value="barn3">عنبر 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 ml-2" />
              حفظ
            </Button>
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <X className="h-4 w-4 ml-2" />
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );




  const renderCurrentView = () => {
    switch (currentView) {
      case "main":
        return renderMainView();
      case "entry":
        return renderEntryView();
      case "sheep_entry":
        return renderSheepEntryView();
      case "sheep_male":
        return renderSheepForm("male");
      case "sheep_female":
        return renderSheepForm("female");
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