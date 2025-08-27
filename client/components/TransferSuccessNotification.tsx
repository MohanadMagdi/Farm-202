import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, ArrowRight, Factory } from 'lucide-react';
import type { Animal } from '@shared/types';

interface TransferSuccessNotificationProps {
  transferredAnimals: Array<{
    animal: Animal;
    newCategory: 'male' | 'female';
    newBarn: string;
  }>;
  onDismiss: () => void;
}

export function TransferSuccessNotification({ 
  transferredAnimals, 
  onDismiss 
}: TransferSuccessNotificationProps) {
  
  const malesCount = transferredAnimals.filter(t => t.newCategory === 'male').length;
  const femalesCount = transferredAnimals.filter(t => t.newCategory === 'female').length;

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-medium text-green-800">
                🎉 تم النقل التلقائي بنجاح!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                تم نقل {transferredAnimals.length} مولود إلى فئاتهم الجديدة كإنتاج داخلي
              </p>
            </div>
          </div>

          <button 
            onClick={onDismiss}
            className="text-green-600 hover:text-green-800"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-4 mt-3">
          {malesCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                {malesCount} ذكور
              </Badge>
              <ArrowRight className="h-3 w-3 text-gray-500" />
              <Badge className="bg-green-100 text-green-800">
                <Factory className="h-3 w-3 ml-1" />
                صفحة الذكور
              </Badge>
            </div>
          )}

          {femalesCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge className="bg-pink-100 text-pink-800">
                {femalesCount} إناث
              </Badge>
              <ArrowRight className="h-3 w-3 text-gray-500" />
              <Badge className="bg-green-100 text-green-800">
                <Factory className="h-3 w-3 ml-1" />
                صفحة الإناث
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
