# نظام البيانات الموحد - دليل المطور
## Unified Data System - Developer Guide

### 📋 نظرة عامة

تم إنشاء **نظام البيانات الموحد** لحل مشكلة تداخل البيانات بين الملفات المختلفة في المشروع. النظام يوفر واجهة موحدة للتعامل مع البيانات سواء كانت وهمية (للتطوير) أو حقيقية (للإنتاج).

### 🎯 الهدف

- **توحيد مصدر البيانات** في جميع صفحات التطبيق
- **القضاء على التداخل** بين البيانات المختلفة
- **تسهيل التطوير** باستخدام بيانات وهمية آمنة
- **تبسيط الانتقال** من التطوير إلى الإنتاج

### 🏗️ البنية المعمارية

```
client/lib/
├── data-service-unified.ts    # النظام الموحد الرئيسي
├── firebase-mock.ts          # البيانات الوهمية
├── firestore.ts             # خدمات Firebase الحقيقية
└── firebase.ts              # إعدادات Firebase
```

### 🔧 كيفية الاستخدام

#### 1. الاستيراد في المكونات

```typescript
// الطريقة الجديدة - موحدة
import dataService from "@/lib/data-service-unified";

// بدلاً من الطريقة القديمة المختلطة
// import { db } from "@/lib/firebase-mock";  ❌
// import { animalsService } from "@/lib/firestore";  ❌
```

#### 2. استخدام الخدمات

```typescript
const MyComponent = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);

  useEffect(() => {
    const loadAnimals = async () => {
      try {
        const animalsList = await dataService.getAnimals();
        setAnimals(animalsList);
      } catch (error) {
        console.error("Error loading animals:", error);
      }
    };
    
    loadAnimals();
  }, []);

  const handleAddAnimal = async (animalData: Omit<Animal, 'id'>) => {
    try {
      const newId = await dataService.createAnimal(animalData);
      console.log("Animal created:", newId);
      // إعادة تحميل البيانات
      const updatedAnimals = await dataService.getAnimals();
      setAnimals(updatedAnimals);
    } catch (error) {
      console.error("Error creating animal:", error);
    }
  };
};
```

### ⚙️ التحكم في البيانات

#### ملف `.env`

```properties
# للتطوير - بيانات وهمية
VITE_USE_MOCK_DATA=true

# للإنتاج - Firebase حقيقي
VITE_USE_MOCK_DATA=false
```

#### التحقق من البيئة الحالية

```typescript
const envInfo = dataService.getCurrentEnvironment();
console.log(envInfo);
// Output: { isDevelopment: true, dataSource: "Mock Data", environment: "Development" }
```

### 📚 API المتاحة

#### خدمات الحيوانات
- `getAnimals()`: جلب جميع الحيوانات
- `getAnimalById(id)`: جلب حيوان بالمعرف
- `createAnimal(data)`: إنشاء حيوان جديد
- `updateAnimal(id, updates)`: تحديث حيوان
- `deleteAnimal(id)`: حذف حيوان
- `getAnimalsByCategory(category)`: جلب حيوانات بالفئة
- `getAnimalsByBarn(barnId)`: جلب حيوانات بالحظيرة

#### خدمات الحظائر
- `getBarns()`: جلب جميع الحظائر
- `getBarnById(id)`: جلب حظيرة بالمعرف
- `createBarn(data)`: إنشاء حظيرة جديدة
- `updateBarn(id, updates)`: تحديث حظيرة

#### خدمات المخزن
- `getWarehouseItems()`: جلب عناصر المخزن
- `getWarehouseItemById(id)`: جلب عنصر بالمعرف
- `createWarehouseItem(data)`: إنشاء عنصر جديد
- `updateWarehouseItem(id, updates)`: تحديث عنصر
- `getLowStockItems()`: جلب العناصر منخفضة المخزون
- `getExpiredItems()`: جلب العناصر منتهية الصلاحية

#### خدمات الأوزان
- `getWeightRecords()`: جلب جميع سجلات الأوزان
- `getWeightRecordsByAnimal(animalId)`: جلب أوزان حيوان محدد
- `createWeightRecord(data)`: إضافة سجل وزن جديد

#### خدمات أخرى
- `getFeedingRecords()`: سجلات التغذية
- `getHealthRecords()`: السجلات الصحية
- `getBarnMovements()`: حركات الحظائر
- `getFeedingSchedules()`: جداول التغذية
- `syncAllData()`: مزامنة البيانات

### 🔄 المزامنة

```typescript
// مزامنة البيانات
await dataService.syncAllData();

// في الوضع الوهمي: إعادة تحميل البيانات
// في وضع Firebase: المزامنة تلقائية
```

### 🚀 مثال شامل

```typescript
import React, { useState, useEffect } from 'react';
import dataService, { Animal, Barn } from '@/lib/data-service-unified';

const FarmDashboard: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [barns, setBarns] = useState<Barn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFarmData();
  }, []);

  const loadFarmData = async () => {
    try {
      setLoading(true);
      
      // جلب البيانات بشكل متوازي
      const [animalsList, barnsList] = await Promise.all([
        dataService.getAnimals(),
        dataService.getBarns()
      ]);
      
      setAnimals(animalsList);
      setBarns(barnsList);
      
      // عرض معلومات البيئة
      const env = dataService.getCurrentEnvironment();
      console.log('📊 Farm data loaded from:', env.dataSource);
      
    } catch (error) {
      console.error('❌ Error loading farm data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnimal = async (animalData: Omit<Animal, 'id'>) => {
    try {
      const newId = await dataService.createAnimal(animalData);
      console.log('✅ New animal created:', newId);
      
      // إعادة تحميل البيانات
      await loadFarmData();
    } catch (error) {
      console.error('❌ Error creating animal:', error);
    }
  };

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div>
      <h1>لوحة تحكم المزرعة</h1>
      <div>
        <p>عدد الحيوانات: {animals.length}</p>
        <p>عدد الحظائر: {barns.length}</p>
      </div>
      
      {/* باقي المكونات */}
    </div>
  );
};

export default FarmDashboard;
```

### ⚠️ تحذيرات مهمة

1. **في الوضع الوهمي**: البيانات تختفي عند إعادة التحميل
2. **عند التبديل للإنتاج**: تأكد من إعداد Firebase بشكل صحيح
3. **استخدم خدمة واحدة فقط**: لا تخلط بين الخدمات القديمة والجديدة

### 🔧 استكشاف الأخطاء

#### مشكلة: البيانات لا تظهر
```typescript
// تحقق من البيئة
const env = dataService.getCurrentEnvironment();
console.log('Current environment:', env);

// تحقق من البيانات
const animals = await dataService.getAnimals();
console.log('Animals count:', animals.length);
```

#### مشكلة: البيانات غير متطابقة
```typescript
// مزامنة البيانات
await dataService.syncAllData();
```

### 📈 الفوائد

✅ **بيانات موحدة** في جميع الصفحات  
✅ **تطوير أسرع** مع البيانات الوهمية  
✅ **انتقال سهل** للإنتاج  
✅ **كود أنظف** وأكثر تنظيماً  
✅ **صيانة أسهل** للمشروع  

### 📞 الدعم

للمساعدة في التطبيق أو حل المشاكل، راجع:
1. هذا الدليل أولاً
2. التحقق من console.log للأخطاء
3. مراجعة إعدادات .env
4. استخدام مكون DataSourceControl للتحكم

---
*تم إنشاء هذا النظام لحل مشكلة تداخل البيانات وتوحيد مصدر المعلومات في المشروع* 🚀
