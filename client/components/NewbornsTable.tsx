import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Search, ChevronDownIcon, Calendar, ArrowLeftRight } from 'lucide-react';
import type { Animal } from '@shared/types';
import { newbornManagementService } from '../lib/newborn-management-service';

interface NewbornsTableProps {
  newborns: Animal[];
  mothers: Animal[];
  onSelectNewborn: (newborn: Animal) => void;
  onWeaningRequest: (newborn: Animal) => void;
  onTransferRequest?: (newborn: Animal) => void; // إضافة معالج لطلب النقل
}

type FilterType = 'all' | 'unweaned' | 'ready-weaning' | 'weaned' | 'needs-attention';
type SortField = 'age' | 'weight' | 'value';

export function NewbornsTable({ 
  newborns, 
  mothers, 
  onSelectNewborn, 
  onWeaningRequest,
  onTransferRequest
}: NewbornsTableProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('age');
  const [sortAsc, setSortAsc] = useState(true);

  // Filter newborns
  const filteredNewborns = newborns.filter(newborn => {
    // Text search
    const matchesSearch = newborn.earTagId.toLowerCase().includes(search.toLowerCase()) ||
      (newborn.motherEarTagId && newborn.motherEarTagId.toLowerCase().includes(search.toLowerCase()));
    
    if (!matchesSearch) return false;

    // Status filter
    const status = newbornManagementService.getNewbornStatus(newborn);
    
    switch (filter) {
      case 'unweaned':
        return !status.isWeaned;
      case 'ready-weaning':
        return status.readyForWeaning && !status.isWeaned;
      case 'weaned':
        return status.isWeaned;
      case 'needs-attention':
        return status.healthStatus === 'needs_attention' ||
               status.healthStatus === 'underweight' ||
               status.healthStatus === 'overweight';
      default:
        return true;
    }
  });

  // Sort newborns
  const sortedNewborns = [...filteredNewborns].sort((a, b) => {
    const modifier = sortAsc ? 1 : -1;
    
    switch (sortField) {
      case 'age':
        const ageA = newbornManagementService.calculateAgeDays(a);
        const ageB = newbornManagementService.calculateAgeDays(b);
        return (ageA - ageB) * modifier;
      case 'weight':
        return (a.weight - b.weight) * modifier;
      case 'value':
        const valueA = newbornManagementService.calculateNewbornFinancials(a).currentValue;
        const valueB = newbornManagementService.calculateNewbornFinancials(b).currentValue;
        return (valueA - valueB) * modifier;
      default:
        return 0;
    }
  });

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const findMother = (newborn: Animal) => mothers.find(mother => mother.id === newborn.motherId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>جدول المواليد</CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن مولود..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
          
          <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="تصفية حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المواليد</SelectItem>
              <SelectItem value="unweaned">مع الأم</SelectItem>
              <SelectItem value="ready-weaning">جاهز للفطام</SelectItem>
              <SelectItem value="weaned">تم الفطام</SelectItem>
              <SelectItem value="needs-attention">يحتاج انتباه</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الأذن</TableHead>
                <TableHead className="text-right">
                  <button
                    className="flex items-center"
                    onClick={() => handleSort('age')}
                  >
                    العمر
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${
                      sortField === 'age' && !sortAsc ? 'rotate-180' : ''
                    }`} />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    className="flex items-center"
                    onClick={() => handleSort('weight')}
                  >
                    الوزن
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${
                      sortField === 'weight' && !sortAsc ? 'rotate-180' : ''
                    }`} />
                  </button>
                </TableHead>
                <TableHead className="text-right">الأم</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">فئة الفطام</TableHead>
                <TableHead className="text-right">
                  <button
                    className="flex items-center"
                    onClick={() => handleSort('value')}
                  >
                    القيمة
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${
                      sortField === 'value' && !sortAsc ? 'rotate-180' : ''
                    }`} />
                  </button>
                </TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedNewborns.map(newborn => {
                const mother = findMother(newborn);
                const status = newbornManagementService.getNewbornStatus(newborn, mother);
                const info = newbornManagementService.formatNewbornInfo(status);
                const financials = newbornManagementService.calculateNewbornFinancials(newborn, mother);

                return (
                  <TableRow
                    key={newborn.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectNewborn(newborn)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {newborn.earTagId}
                        {newborn.sex === 'male' ? '♂️' : '♀️'}
                      </div>
                    </TableCell>
                    <TableCell>{info.ageLabel}</TableCell>
                    <TableCell>{newborn.weight} كجم</TableCell>
                    <TableCell>{mother?.earTagId || newborn.motherEarTagId || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={info.statusColor}>
                          {info.statusLabel}
                        </Badge>
                        {info.transferStatus && (
                          <Badge 
                            className={info.transferStatus === "تم النقل" 
                              ? "bg-emerald-100 text-emerald-800" 
                              : "bg-orange-100 text-orange-800"
                            }
                          >
                            {info.transferStatus}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={info.weaningCategoryColor}>
                        {info.weaningCategoryLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>{financials.currentValue.toFixed(2)} جنيه</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {status.readyForWeaning && !status.isWeaned && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onWeaningRequest(newborn);
                            }}
                          >
                            <Calendar className="h-3 w-3 ml-1" />
                            فطام
                          </Button>
                        )}
                        {/* زر النقل - يظهر فقط للمواليد المفطومة التي لم يتم نقلها بعد */}
                        {status.isWeaned && !status.barnAssignment.hasBeenTransferred && onTransferRequest && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTransferRequest(newborn);
                            }}
                          >
                            <ArrowLeftRight className="h-3 w-3 ml-1" />
                            نقل
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {sortedNewborns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    لا توجد نتائج مطابقة للبحث
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Summary */}
        <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
          <span>إجمالي النتائج: {sortedNewborns.length}</span>
          <span>من أصل {newborns.length} مولود</span>
        </div>
      </CardContent>
    </Card>
  );
}
