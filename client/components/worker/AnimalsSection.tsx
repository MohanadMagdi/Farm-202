import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Animal, Barn, WeightRecord } from '@shared/types';
import { 
  Search, 
  Plus, 
  Weight, 
  Beef, 
  Heart,
  Calendar,
  MapPin,
  TrendingUp
} from 'lucide-react';

interface AnimalsSectionProps {
  animals: Animal[];
  barns: Barn[];
  weightRecords: WeightRecord[];
  onAddAnimal: () => void;
  onAddWeight: () => void;
  refreshKey: number;
}

export const AnimalsSection: React.FC<AnimalsSectionProps> = ({
  animals,
  barns,
  weightRecords,
  onAddAnimal,
  onAddWeight,
  refreshKey
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBarn, setSelectedBarn] = useState<string>('all');

  // Filter animals
  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = animal.earTagId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || animal.category === selectedCategory;
    const matchesBarn = selectedBarn === 'all' || animal.barnId === selectedBarn;
    
    return matchesSearch && matchesCategory && matchesBarn && !animal.isIsolated;
  });

  const getBarnName = (barnId: string) => {
    const barn = barns.find(b => b.id === barnId);
    return barn ? barn.name : 'غير محدد';
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'male': return 'ذكر';
      case 'female': return 'أنثى';
      case 'newborn': return 'مولود';
      default: return category;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'male':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">ذكر</Badge>;
      case 'female':
        return <Badge variant="outline" className="border-pink-500 text-pink-700">أنثى</Badge>;
      case 'newborn':
        return <Badge variant="outline" className="border-green-500 text-green-700">مولود</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const getRecentWeight = (animalId: string) => {
    const animalWeights = weightRecords
      .filter(record => record.animalId === animalId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return animalWeights[0];
  };

  const AnimalCard = ({ animal }: { animal: Animal }) => {
    const recentWeight = getRecentWeight(animal.id);
    const weightTrend = recentWeight && recentWeight.weight > animal.weight ? 'up' : 
                       recentWeight && recentWeight.weight < animal.weight ? 'down' : 'stable';

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Beef className="h-5 w-5 text-gray-500" />
              <div>
                <h4 className="font-medium">#{animal.earTagId}</h4>
                <p className="text-sm text-gray-600">{getCategoryLabel(animal.category)}</p>
              </div>
            </div>
            {getCategoryBadge(animal.category)}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">الوزن الحالي:</span>
              <div className="flex items-center gap-1">
                <span className="font-medium">{animal.weight} كجم</span>
                {weightTrend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {weightTrend === 'down' && <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />}
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">العمر:</span>
              <span className="font-medium">{animal.ageMonths} شهر</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">الحظيرة:</span>
              <span className="font-medium text-xs">{getBarnName(animal.barnId)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">الحالة الصحية:</span>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-500" />
                <span className="font-medium text-xs">{animal.healthStatus}</span>
              </div>
            </div>

            {animal.category === 'female' && animal.isPregnant && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">حامل:</span>
                <Badge variant="outline" className="border-purple-500 text-purple-700">
                  نعم
                </Badge>
              </div>
            )}

            {recentWeight && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">آخر وزن:</span>
                <span className="text-xs text-gray-500">
                  {new Date(recentWeight.date).toLocaleDateString('ar-EG')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث برقم الأذن..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">جميع الفئات</option>
            <option value="male">ذكور</option>
            <option value="female">إناث</option>
            <option value="newborn">مواليد</option>
          </select>

          <select
            value={selectedBarn}
            onChange={(e) => setSelectedBarn(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">جميع الحظائر</option>
            {barns.filter(barn => barn.isActive).map(barn => (
              <option key={barn.id} value={barn.id}>{barn.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={onAddAnimal} variant="default">
          <Plus className="h-4 w-4 ml-2" />
          إضافة حيوان جديد
        </Button>
        <Button onClick={onAddWeight} variant="outline">
          <Weight className="h-4 w-4 ml-2" />
          تسجيل وزن
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الحيوانات</p>
                <p className="text-2xl font-bold text-gray-900">{animals.length}</p>
              </div>
              <Beef className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الذكور</p>
                <p className="text-2xl font-bold text-blue-600">
                  {animals.filter(a => a.category === 'male').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Beef className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الإناث</p>
                <p className="text-2xl font-bold text-pink-600">
                  {animals.filter(a => a.category === 'female').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center">
                <Heart className="h-4 w-4 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المواليد</p>
                <p className="text-2xl font-bold text-green-600">
                  {animals.filter(a => a.category === 'newborn').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Animals Grid */}
      {filteredAnimals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>الحيوانات ({filteredAnimals.length})</CardTitle>
            <CardDescription>
              {selectedCategory !== 'all' && `فئة: ${getCategoryLabel(selectedCategory)} • `}
              {selectedBarn !== 'all' && `حظيرة: ${getBarnName(selectedBarn)} • `}
              {searchTerm && `البحث: "${searchTerm}" • `}
              عرض {filteredAnimals.length} من {animals.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAnimals.map(animal => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Beef className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory !== 'all' || selectedBarn !== 'all'
                ? 'لا توجد حيوانات تطابق البحث'
                : 'لا توجد حيوانات'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' || selectedBarn !== 'all'
                ? 'جرب تغيير فلاتر البحث'
                : 'ابدأ بإضافة حيوانات جديدة'
              }
            </p>
            <Button onClick={onAddAnimal}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة حيوان جديد
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};