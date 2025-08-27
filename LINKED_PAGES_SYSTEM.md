# نظام ربط صفحات إدارة الحيوانات المحدث

## نظرة عامة
تم تحديث نظام إدارة الحيوانات لربط جميع الصفحات (الذكور، الإناث، المواليد، الإنتاج الداخلي) بحيث تظهر جميع المواليد في الجداول المناسبة حسب الجنس.

## كيفية عمل النظام الجديد

### 1. صفحة الذكور (`/animals/males`)
- تعرض **جميع** الحيوانات الذكور:
  - الذكور المشتراة (`category: "male", sex: "male"`)
  - ذكور الإنتاج الداخلي (`internalProduction: true, sex: "male"`)
  - المواليد الذكور (`category: "newborn", sex: "male"`)

### 2. صفحة الإناث (`/animals/females`)
- تعرض **جميع** الحيوانات الإناث:
  - الإناث المشتراة (`category: "female", sex: "female"`)
  - إناث الإنتاج الداخلي (`internalProduction: true, sex: "female"`)
  - المواليد الإناث (`category: "newborn", sex: "female"`)

### 3. صفحة المواليد (`/animals/newborns`)
- تعرض **جميع** المواليد بغض النظر عن الجنس:
  - المواليد الذكور والإناث (`category: "newborn"`)

### 4. صفحة الإنتاج الداخلي (`/animals/internal-production`)
- تعرض:
  - جميع المواليد (`category: "newborn"`)
  - الحيوانات المعلمة كإنتاج داخلي (`internalProduction: true`)
  - الحيوانات المطلوب عرضها (`showInInternalProduction: true`)

## الفوائد المحققة

1. **عرض شامل**: المواليد تظهر الآن في:
   - صفحة المواليد (جميع المواليد)
   - صفحة الذكور (المواليد الذكور فقط)
   - صفحة الإناث (المواليد الإناث فقط)
   - صفحة الإنتاج الداخلي (جميع المواليد كونها إنتاج داخلي)

2. **سهولة الإدارة**: يمكن للمستخدم مشاهدة وإدارة الحيوانات من أي صفحة مناسبة

3. **التصدير المحسن**: عند تصدير التقارير، يتم تضمين جميع الحيوانات المناسبة

## التعديلات التقنية المطبقة

### في `AnimalsPage.tsx`:

```typescript
const filteredAnimals = animals
  .filter((animal) => {
    if (animalType === "male") {
      // Show all male animals: purchased, internal production, and newborns
      return animal.sex === "male";
    }
    if (animalType === "female") {
      // Show all female animals: purchased, internal production, and newborns
      return animal.sex === "female";
    }
    if (animalType === "newborn") {
      // Show all newborns regardless of gender
      return animal.category === "newborn";
    }
    return true;
  })
```

### في دالة التصدير:

```typescript
// For males page: include all male animals (purchased, internal production, and newborns)
if (animalType === "male") {
  return animal.sex === "male";
}
// For females page: include all female animals (purchased, internal production, and newborns)  
if (animalType === "female") {
  return animal.sex === "female";
}
```

## الاستخدام العملي

1. **لمشاهدة جميع الذكور**: اذهب إلى صفحة الذكور وستجد جميع الحيوانات الذكور بما في ذلك المواليد الذكور
2. **لمشاهدة جميع الإناث**: اذهب إلى صفحة الإناث وستجد جميع الحيوانات الإناث بما في ذلك المواليد الإناث  
3. **لمشاهدة المواليد فقط**: اذهب إلى صفحة المواليد
4. **لإدارة الإنتاج الداخلي**: اذهب إلى صفحة الإنتاج الداخلي لمشاهدة جميع المواليد والحيوانات من الإنتاج الداخلي

هذا النظام يضمن أن جميع الحيوانات تظهر في المكان المناسب دون تكرار أو فقدان للبيانات.
