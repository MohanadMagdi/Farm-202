import React, { useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ArrowRight, 
  AlertTriangle, 
  Users, 
  Clock,
  CheckCircle,
  Factory
} from 'lucide-react';
import { automaticWeaningTransferService } from '../lib/automatic-weaning-transfer-service';
import { newbornManagementService } from '../lib/newborn-management-service';
import type { Animal } from '@shared/types';
import { toast } from '../hooks/use-toast';

interface AutoTransferAlertProps {
  animals: Animal[];
  onTransferComplete: () => void;
}

export function AutoTransferAlert({ animals, onTransferComplete }: AutoTransferAlertProps) {
  const [transferInProgress, setTransferInProgress] = useState(false);

  // فحص المواليد التي تحتاج نقل
  const transferCheck = newbornManagementService.checkForAutomaticTransfer(animals);
  
  if (!transferCheck.shouldRunAutoTransfer) {
    return null; // لا يعرض شيء إذا لم تكن هناك حاجة للنقل
  }

  const handleAutoTransfer = async () => {
    setTransferInProgress(true);
    try {
      const result = await automaticWeaningTransferService.runAutomaticTransfer();
      
      if (result.totalTransferred > 0) {
        const malesTransferred = result.transferResults.filter(r => r.success && r.newCategory === 'male').length;
        const femalesTransferred = result.transferResults.filter(r => r.success && r.newCategory === 'female').length;
        
        toast({
          title: "نقل تلقائي ناجح! 🎉",
          description: `تم نقل ${malesTransferred} ذكور إلى صفحة الذكور و ${femalesTransferred} إناث إلى صفحة الإناث كإنتاج داخلي`,
        });
        
        onTransferComplete();
      } else if (result.errors.length > 0) {
        toast({
          title: "خطأ في النقل التلقائي",
          description: result.errors.join(', '),
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في النقل",
        description: "حدث خطأ أثناء النقل التلقائي",
        variant: "destructive"
      });
    } finally {
      setTransferInProgress(false);
    }
  };

  const alertType = transferCheck.overdueTransfer.length > 0 ? 'urgent' : 'info';
  const alertClass = alertType === 'urgent' 
    ? "border-red-200 bg-red-50" 
    : "border-blue-200 bg-blue-50";
  
  const iconClass = alertType === 'urgent' ? 'text-red-600' : 'text-blue-600';
  const textClass = alertType === 'urgent' ? 'text-red-800' : 'text-blue-800';

  return (
    <Alert className={alertClass}>
      <div className="flex items-start justify-between w-full">
        <div className="flex items-start">
          {alertType === 'urgent' ? (
            <AlertTriangle className={`h-4 w-4 ${iconClass} mt-0.5`} />
          ) : (
            <Clock className={`h-4 w-4 ${iconClass} mt-0.5`} />
          )}
          
          <div className="mr-3">
            <AlertDescription className={textClass}>
              <div className="space-y-2">
                <p className="font-medium">
                  {alertType === 'urgent' 
                    ? `🚨 يوجد ${transferCheck.overdueTransfer.length} مولود متأخر عن الفطام!`
                    : `⏰ يوجد ${transferCheck.needsTransfer.length} مولود جاهز للنقل التلقائي`
                  }
                </p>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>
                      {transferCheck.needsTransfer.filter(a => a.sex === 'male').length} ذكور
                    </span>
                    <ArrowRight className="h-3 w-3 mx-1" />
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      <Factory className="h-2 w-2 ml-1" />
                      صفحة الذكور
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>
                      {transferCheck.needsTransfer.filter(a => a.sex === 'female').length} إناث
                    </span>
                    <ArrowRight className="h-3 w-3 mx-1" />
                    <Badge className="bg-pink-100 text-pink-800 text-xs">
                      <Factory className="h-2 w-2 ml-1" />
                      صفحة الإناث
                    </Badge>
                  </div>
                </div>

                <p className="text-xs">
                  سيتم تصنيفهم كـ "إنتاج داخلي" ونقلهم للحظائر المناسبة تلقائياً
                </p>
              </div>
            </AlertDescription>
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          <Button 
            size="sm" 
            onClick={handleAutoTransfer}
            disabled={transferInProgress}
            className={alertType === 'urgent' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {transferInProgress ? (
              <>
                <Clock className="h-3 w-3 ml-1 animate-spin" />
                جاري النقل...
              </>
            ) : (
              <>
                <ArrowRight className="h-3 w-3 ml-1" />
                {alertType === 'urgent' ? 'نقل فوري' : 'نقل تلقائي'}
              </>
            )}
          </Button>
        </div>
      </div>
    </Alert>
  );
}
