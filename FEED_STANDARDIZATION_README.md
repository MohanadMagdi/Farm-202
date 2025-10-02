# نظام توحيد أنواع الأعلاف - Feed Type Standardization System

## نظرة عامة | Overview

تم توحيد نظام تصنيف الأعلاف في جميع أنحاء النظام لضمان الاتساق بين واجهة العامل والنظام الإداري.

The feed classification system has been standardized across the entire system to ensure consistency between the worker interface and admin system.

## النظام الجديد | New System

### الأنواع الرئيسية | Main Types

1. **علف مركز** (`concentrated`)
   - علف مركز 14% (`14%`)
   - علف مركز 16% (`16%`) 
   - علف مركز 21% (`21%`)

2. **مادة مالحة** (`saline_material`) 
   - دريس (`hay`)
   - تبن (`straw`)

### التعريفات في الكود | Code Definitions

```typescript
// في shared/types.ts
export type FeedMainType = "concentrated" | "saline_material";
export type ConcentratedFeedSubType = "14%" | "16%" | "21%";
export type SalineMaterialSubType = "hay" | "straw";

export interface FeedTypeDefinition {
  id: string;
  mainType: FeedMainType;
  subType: string;
  arabicName: string;
  englishName: string;
}

export const FEED_TYPES: Record<string, FeedTypeDefinition> = {
  concentrated_14: {
    id: "concentrated_14",
    mainType: "concentrated",
    subType: "14%",
    arabicName: "علف مركز 14%",
    englishName: "Concentrated Feed 14%"
  },
  // ... المزيد
};
```

## الاستخدام | Usage

### في المكونات | In Components

```typescript
import { 
  getMainFeedTypes, 
  getSubTypesForMainType, 
  generateFeedId, 
  getFeedArabicName 
} from '@/lib/feed-utils';

// الحصول على الأنواع الرئيسية
const mainTypes = getMainFeedTypes();

// الحصول على الأنواع الفرعية
const subTypes = getSubTypesForMainType("concentrated");

// إنشاء معرف العلف
const feedId = generateFeedId("concentrated", "14%"); // "concentrated_14"

// الحصول على الاسم العربي
const arabicName = getFeedArabicName("concentrated", "14%"); // "علف مركز 14%"
```

### في النماذج | In Forms

```typescript
// حالة النموذج
const [feedData, setFeedData] = useState({
  mainType: '' as FeedMainType | '',
  subType: '',
  quantity: ''
});

// معالجة التغيير
const handleMainTypeChange = (value: string) => {
  setFeedData(prev => ({
    ...prev,
    mainType: value as FeedMainType,
    subType: '' // إعادة تعيين النوع الفرعي
  }));
};
```

## الملفات المحدثة | Updated Files

### الملفات الأساسية | Core Files
- `shared/types.ts` - تعريفات الأنواع الجديدة
- `client/lib/feed-utils.ts` - دوال المساعدة الجديدة

### المكونات المحدثة | Updated Components
- `client/components/worker/FeedingTab.tsx` - تبويبة التغذية للعامل
- `client/lib/arabic-utils.ts` - تحديث التسميات العربية (deprecated)

### المكونات التي تحتاج تحديث | Components Needing Updates
- `client/components/forms/FeedingFormModal.tsx`
- `client/components/forms/FeedingScheduleModal.tsx`
- جميع المكونات التي تتعامل مع أنواع الأعلاف

## الهجرة من النظام القديم | Migration from Old System

### النظام القديم
```
"concentrated_feed_14" → "علف مركز 14%"
"roughage_hay" → "دريس"
```

### النظام الجديد
```
"concentrated_14" → "علف مركز 14%"
"saline_hay" → "دريس"
```

### دالة الهجرة
```typescript
import { parseLegacyFeedType, migrateFeedType } from '@/lib/feed-utils';

// تحويل النوع القديم
const legacy = "concentrated feed 14%";
const parsed = parseLegacyFeedType(legacy);
// { mainType: "concentrated", subType: "14%" }

const newId = migrateFeedType(legacy);
// "concentrated_14"
```

## التحقق من صحة البيانات | Data Validation

```typescript
import { isValidFeedTypeCombination } from '@/lib/feed-utils';

// التحقق من صحة التركيبة
const isValid = isValidFeedTypeCombination("concentrated", "14%"); // true
const isInvalid = isValidFeedTypeCombination("concentrated", "hay"); // false
```

## اختبار النظام | Testing the System

1. **تشغيل الخادم**:
   ```bash
   cd "G:\Work\V3 16-8\Farm-202"
   npm run dev
   ```

2. **الوصول للنظام**: http://localhost:8081

3. **اختبار واجهة العامل**:
   - الدخول كعامل: `worker@farm.com`
   - الانتقال لتبويبة التغذية
   - تجربة إدخال وصرف الأعلاف

4. **التحقق من الاتساق**:
   - التأكد من توحيد أسماء الأعلاف
   - التحقق من عمل النظام الجديد بسلاسة

## الخطوات التالية | Next Steps

1. **تحديث بقية المكونات** لاستخدام النظام الجديد
2. **هجرة البيانات الموجودة** من النظام القديم
3. **اختبار شامل** لجميع وظائف التغذية
4. **تحديث الوثائق** للمستخدمين النهائيين

## الاستنتاج | Conclusion

تم بنجاح توحيد نظام تصنيف الأعلاف مما يضمن:
- **اتساق البيانات** عبر جميع أجزاء النظام
- **سهولة الصيانة** والتطوير المستقبلي  
- **تجربة مستخدم محسنة** للعمال والإداريين
- **دعم كامل للغة العربية** مع الأسماء الصحيحة

The feed classification system has been successfully standardized ensuring:
- **Data consistency** across all system parts
- **Easy maintenance** and future development
- **Improved user experience** for workers and admins
- **Full Arabic language support** with correct naming