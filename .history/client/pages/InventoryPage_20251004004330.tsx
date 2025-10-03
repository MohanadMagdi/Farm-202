import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatArabicNumber } from "@/lib/arabic-utils";
import { toast } from "@/hooks/use-toast";
import {
  Package,
  Scale,
  Utensils,
  PillBottle,
  CircleDot,
  Heart,
  Wheat,
  Leaf,
  Shield,
  Syringe,
  ArrowRight,
  ArrowLeft,
  Save,
  X,
} from "lucide-react";

type ViewState = 
  | "main"
  | "entry"
  | "dispense"
  | "sheep_entry"
  | "feed_entry"
  | "medicine_entry"
  | "sheep_male"
  | "sheep_female"
  | "feed_concentrated"
  | "feed_filler"
  | "medicine_vaccines"
  | "medicine_treatments"
  | "dispense_feed"
  | "dispense_medicine"
  | "dispense_feed_concentrated"
  | "dispense_feed_filler"
  | "dispense_medicine_vaccines"
  | "dispense_medicine_treatments";

export default function InventoryPage() {
  const [currentView, setCurrentView] = useState<ViewState>("main");
  const [formData, setFormData] = useState<any>({});

  const handleBack = () => {
    if (currentView === "entry" || currentView === "dispense") {
      setCurrentView("main");
    } else if (currentView.startsWith("sheep_") || currentView.startsWith("feed_") || currentView.startsWith("medicine_")) {
      setCurrentView("entry");
    } else if (currentView.startsWith("dispense_")) {
      setCurrentView("dispense");
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
        <p className="text-muted-foreground">اختر نوع العملية المطلوبة</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500 flex items-center justify-center">
              <Package className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-farm-800 mb-2">
              تسجيل دخول
            </h3>
            <p className="text-muted-foreground mb-4">
              تسجيل دخول الأغنام، التغذية، والأدوية
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

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center">
              <Utensils className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-farm-800 mb-2">
              تسجيل صرف
            </h3>
            <p className="text-muted-foreground mb-4">
              تسجيل صرف التغذية والأدوية
            </p>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("dispense")}
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
        <h2 className="text-2xl font-bold text-farm-800">تسجيل دخول</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
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

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-400 flex items-center justify-center">
              <Wheat className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-farm-800 mb-2">
              تسجيل دخول تغذية
            </h3>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("feed_entry")}
            >
              فتح
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-400 flex items-center justify-center">
              <PillBottle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-farm-800 mb-2">
              تسجيل دخول أدوية
            </h3>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("medicine_entry")}
            >
              فتح
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDispenseView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">تسجيل صرف</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-400 flex items-center justify-center">
              <Utensils className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-farm-800 mb-2">
              صرف تغذية
            </h3>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("dispense_feed")}
            >
              فتح
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-400 flex items-center justify-center">
              <PillBottle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-farm-800 mb-2">
              صرف أدوية
            </h3>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("dispense_medicine")}
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

  const renderFeedEntryView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">تسجيل دخول تغذية</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500 flex items-center justify-center">
              <Wheat className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-farm-800 mb-2">
              علف مركز
            </h3>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("feed_concentrated")}
            >
              فتح
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-farm-800 mb-2">
              مادة مالئة
            </h3>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("feed_filler")}
            >
              فتح
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderFeedConcentratedForm = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">تسجيل علف مركز</h2>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="percentage">نسبة البروتين</Label>
            <Select value={formData.percentage || ""} onValueChange={(value) => setFormData({...formData, percentage: value})}>
              <SelectTrigger>
                <SelectValue placeholder="اختر النسبة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="14">14%</SelectItem>
                <SelectItem value="16">16%</SelectItem>
                <SelectItem value="21">21%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="quantity">الكمية (كيلو)</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="أدخل الكمية"
              value={formData.quantity || ""}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            />
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

  const renderFeedFillerForm = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">تسجيل مادة مالئة</h2>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="type">نوع المادة</Label>
            <Select value={formData.type || ""} onValueChange={(value) => setFormData({...formData, type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drisi">دريس</SelectItem>
                <SelectItem value="tabn">تبن</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="quantity">الكمية (كيلو)</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="أدخل الكمية"
              value={formData.quantity || ""}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            />
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

  const renderMedicineEntryView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">تسجيل دخول أدوية</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500 flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-farm-800 mb-2">
              تحصينات
            </h3>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("medicine_vaccines")}
            >
              فتح
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500 flex items-center justify-center">
              <Syringe className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-farm-800 mb-2">
              علاجات
            </h3>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("medicine_treatments")}
            >
              فتح
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderMedicineForm = (type: "vaccines" | "treatments") => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">
          تسجيل {type === "vaccines" ? "تحصينات" : "علاجات"}
        </h2>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="name">اسم الدواء</Label>
            <Input
              id="name"
              placeholder="أدخل اسم الدواء"
              value={formData.name || ""}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="quantity">الكمية (مليمتر)</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="أدخل الكمية"
              value={formData.quantity || ""}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            />
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

  const renderDispenseFeedView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">صرف تغذية</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500 flex items-center justify-center">
              <Wheat className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-farm-800 mb-2">
              علف مركز
            </h3>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("dispense_feed_concentrated")}
            >
              فتح
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-farm-800 mb-2">
              مادة مالئة
            </h3>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("dispense_feed_filler")}
            >
              فتح
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDispenseFeedConcentratedForm = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">صرف علف مركز</h2>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="percentage">نسبة البروتين</Label>
            <Select value={formData.percentage || ""} onValueChange={(value) => setFormData({...formData, percentage: value})}>
              <SelectTrigger>
                <SelectValue placeholder="اختر النسبة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="14">14%</SelectItem>
                <SelectItem value="16">16%</SelectItem>
                <SelectItem value="21">21%</SelectItem>
              </SelectContent>
            </Select>
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
          
          <div>
            <Label htmlFor="quantity">الكمية (كيلو)</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="أدخل الكمية"
              value={formData.quantity || ""}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            />
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

  const renderDispenseFeedFillerForm = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">صرف مادة مالئة</h2>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="type">نوع المادة</Label>
            <Select value={formData.type || ""} onValueChange={(value) => setFormData({...formData, type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drisi">دريس</SelectItem>
                <SelectItem value="tabn">تبن</SelectItem>
              </SelectContent>
            </Select>
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
          
          <div>
            <Label htmlFor="quantity">الكمية (كيلو)</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="أدخل الكمية"
              value={formData.quantity || ""}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            />
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

  const renderDispenseMedicineView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">صرف أدوية</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500 flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-farm-800 mb-2">
              تحصينات
            </h3>
            <p className="text-sm text-muted-foreground mb-4">الصرف بالعنبر</p>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("dispense_medicine_vaccines")}
            >
              فتح
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500 flex items-center justify-center">
              <Syringe className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-farm-800 mb-2">
              علاجات
            </h3>
            <p className="text-sm text-muted-foreground mb-4">الصرف برقم الغنم</p>
            <Button 
              className="w-full" 
              onClick={() => setCurrentView("dispense_medicine_treatments")}
            >
              فتح
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDispenseMedicineVaccinesForm = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">صرف تحصينات</h2>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="name">اسم الدواء</Label>
            <Input
              id="name"
              placeholder="أدخل اسم الدواء"
              value={formData.name || ""}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
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
          
          <div>
            <Label htmlFor="quantity">الكمية (مليمتر)</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="أدخل الكمية"
              value={formData.quantity || ""}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            />
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

  const renderDispenseMedicineTreatmentsForm = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <h2 className="text-2xl font-bold text-farm-800">صرف علاجات</h2>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="sheepNumber">رقم الغنم</Label>
            <Input
              id="sheepNumber"
              placeholder="أدخل رقم الغنم"
              value={formData.sheepNumber || ""}
              onChange={(e) => setFormData({...formData, sheepNumber: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="name">اسم الدواء</Label>
            <Input
              id="name"
              placeholder="أدخل اسم الدواء"
              value={formData.name || ""}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="quantity">الكمية (مليمتر)</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="أدخل الكمية"
              value={formData.quantity || ""}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            />
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
      case "dispense":
        return renderDispenseView();
      case "sheep_entry":
        return renderSheepEntryView();
      case "sheep_male":
        return renderSheepForm("male");
      case "sheep_female":
        return renderSheepForm("female");
      case "feed_entry":
        return renderFeedEntryView();
      case "feed_concentrated":
        return renderFeedConcentratedForm();
      case "feed_filler":
        return renderFeedFillerForm();
      case "medicine_entry":
        return renderMedicineEntryView();
      case "medicine_vaccines":
        return renderMedicineForm("vaccines");
      case "medicine_treatments":
        return renderMedicineForm("treatments");
      case "dispense_feed":
        return renderDispenseFeedView();
      case "dispense_feed_concentrated":
        return renderDispenseFeedConcentratedForm();
      case "dispense_feed_filler":
        return renderDispenseFeedFillerForm();
      case "dispense_medicine":
        return renderDispenseMedicineView();
      case "dispense_medicine_vaccines":
        return renderDispenseMedicineVaccinesForm();
      case "dispense_medicine_treatments":
        return renderDispenseMedicineTreatmentsForm();
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