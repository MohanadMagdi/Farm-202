import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Baby, 
  Heart,
  Eye,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { getOffspringForMother, getMotherForChild } from "@/lib/animal-relationships";
import { autoRepairRelationships, performDataHealthCheck } from "@/lib/data-sync";
import { formatArabicDate } from "@/lib/arabic-utils";
import type { Animal } from "@shared/types";
import { toast } from "@/hooks/use-toast";

interface AnimalRelationshipCardProps {
  animal: Animal;
  onViewAnimal?: (animalId: string) => void;
}

export default function AnimalRelationshipCard({ animal, onViewAnimal }: AnimalRelationshipCardProps) {
  const [offspring, setOffspring] = useState<Animal[]>([]);
  const [mother, setMother] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(false);
  const [healthCheck, setHealthCheck] = useState({
    isHealthy: true,
    issues: 0,
    lastCheck: new Date()
  });

  useEffect(() => {
    loadRelationshipData();
  }, [animal.id]);

  const loadRelationshipData = async () => {
    try {
      setLoading(true);
      
      // Load offspring if this is a female
      if (animal.sex === 'female') {
        const offspringData = await getOffspringForMother(animal.id);
        setOffspring(offspringData);
      }
      
      // Load mother if this animal has one
      if (animal.motherId) {
        const motherData = await getMotherForChild(animal.id);
        setMother(motherData);
      }
      
      // Perform health check
      const health = await performDataHealthCheck();
      setHealthCheck(health);
      
    } catch (error) {
      console.error('Error loading relationship data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepairRelationships = async () => {
    try {
      setLoading(true);
      const result = await autoRepairRelationships();
      
      if (result.repaired > 0) {
        toast({
          title: "تم إصلاح العلاقات",
          description: `تم إصلاح ${result.repaired} علاقة بنجاح`,
        });
        loadRelationshipData(); // Reload data
      } else {
        toast({
          title: "لا يوجد مشاكل",
          description: "جميع العلاقات صحيحة",
        });
      }
      
      if (result.errors.length > 0) {
        toast({
          title: "أخطاء في الإصلاح",
          description: result.errors.join(', '),
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Error repairing relationships:', error);
      toast({
        title: "خطأ في الإصلاح",
        description: "حدث خطأ أثناء إصلاح العلاقات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't show the card if there are no relationships
  if (!animal.motherId && animal.sex !== 'female') {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 ml-2" />
            العلاقات العائلية
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Badge variant={healthCheck.isHealthy ? "default" : "destructive"}>
              {healthCheck.isHealthy ? (
                <CheckCircle className="h-3 w-3 ml-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 ml-1" />
              )}
              {healthCheck.isHealthy ? "صحيحة" : `${healthCheck.issues} مشكلة`}
            </Badge>
            {!healthCheck.isHealthy && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRepairRelationships}
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 ml-1 ${loading ? 'animate-spin' : ''}`} />
                إصلاح
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          معلومات الأمومة والنسل للحيوان {animal.earTagId}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mother Information */}
        {animal.motherId && (
          <div className="bg-pink-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center">
                <Heart className="h-4 w-4 ml-2 text-pink-600" />
                معلومات الأم
              </h4>
              {mother && onViewAnimal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewAnimal(mother.id)}
                >
                  <Eye className="h-3 w-3 ml-1" />
                  عرض
                </Button>
              )}
            </div>
            
            {mother ? (
              <div className="space-y-1">
                <p><strong>رقم الأذن:</strong> {mother.earTagId}</p>
                <p><strong>الوزن:</strong> {mother.weight.toFixed(1)} كيلو</p>
                <p><strong>الحالة الصحية:</strong> {mother.healthStatus}</p>
                {animal.birthDate && (
                  <p><strong>تاريخ الميلاد:</strong> {formatArabicDate(animal.birthDate)}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center text-yellow-600">
                <AlertTriangle className="h-4 w-4 ml-2" />
                <span>الأم غير موجودة في النظام (ID: {animal.motherId})</span>
              </div>
            )}
          </div>
        )}

        {/* Offspring Information */}
        {animal.sex === 'female' && (
          <div className="bg-blue-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center">
                <Baby className="h-4 w-4 ml-2 text-blue-600" />
                النسل ({offspring.length})
              </h4>
              <Badge variant="outline">
                المسجل: {animal.offspringCount || 0}
              </Badge>
            </div>
            
            {offspring.length > 0 ? (
              <div className="space-y-2">
                {offspring.map((child) => (
                  <div 
                    key={child.id} 
                    className="flex items-center justify-between bg-white p-2 rounded border"
                  >
                    <div>
                      <span className="font-medium">{child.earTagId}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({child.sex === 'male' ? 'ذكر' : 'أنثى'}, {child.weight.toFixed(1)} كيلو)
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Badge variant={child.sex === 'male' ? 'default' : 'secondary'}>
                        {child.category}
                      </Badge>
                      {onViewAnimal && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewAnimal(child.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">لا يوجد نسل مسجل</p>
            )}
            
            {/* Data consistency check */}
            {animal.offspringCount !== offspring.length && (
              <div className="mt-2 flex items-center text-yellow-600">
                <AlertTriangle className="h-4 w-4 ml-2" />
                <span className="text-sm">
                  عدم تطابق في العدد: مسجل {animal.offspringCount} ولكن موجود {offspring.length}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Breeding Status for Females */}
        {animal.sex === 'female' && animal.isPregnant && (
          <div className="bg-green-50 p-4 rounded-lg border">
            <h4 className="font-medium flex items-center mb-2">
              <Heart className="h-4 w-4 ml-2 text-green-600" />
              حالة الحمل
            </h4>
            <div className="space-y-1">
              {animal.aiDate && (
                <p><strong>تاريخ التلقيح:</strong> {formatArabicDate(animal.aiDate)}</p>
              )}
              {animal.expectedBirthDate && (
                <p><strong>تاريخ الولادة المتوقع:</strong> {formatArabicDate(animal.expectedBirthDate)}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
