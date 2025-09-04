import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { LinkIcon } from 'lucide-react';
import type { Animal } from '@shared/types';

interface OffspringTableProps {
  offspring: Animal[];
  className?: string;
}

export function OffspringTable({ offspring, className }: OffspringTableProps) {
  if (!offspring || offspring.length === 0) {
    return (
      <div className="text-center p-4 bg-muted/20 rounded" dir="rtl">
        <p className="text-muted-foreground">لا توجد مواليد مسجلة لهذه الأنثى</p>
      </div>
    );
  }

  return (
    <div className={className} dir="rtl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>رقم الأذن</TableHead>
            <TableHead>تاريخ الميلاد</TableHead>
            <TableHead>الوزن الحالي</TableHead>
            <TableHead>الجنس</TableHead>
            <TableHead className="text-left">روابط</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offspring.map((animal) => (
            <TableRow key={animal.id}>
              <TableCell className="font-medium">{animal.earTagId}</TableCell>
              <TableCell>
                {animal.birthDate ? animal.birthDate.toLocaleDateString('ar-EG') : '-'}
              </TableCell>
              <TableCell>{animal.weight} كجم</TableCell>
              <TableCell>
                {animal.sex === 'male' ? 'ذكر' : animal.sex === 'female' ? 'أنثى' : '-'}
              </TableCell>
              <TableCell>
                <Link 
                  to={`/animals/${animal.category === 'male' ? 'males' : animal.category === 'female' ? 'females' : ''}?id=${animal.id}`} 
                  className="text-primary flex items-center gap-1 text-sm"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  تفاصيل
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default OffspringTable;
