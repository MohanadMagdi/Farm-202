  const exportToPDF = () => {
    const data = filteredAnimals.map(convertToEnhancedSpreadsheetFormat);
    const maxWeights = getMaxWeights(filteredAnimals);
    const headers = generateExportHeaders(maxWeights);
    
    const currentDate = new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    }).format(new Date());
    
    // Generate summary statistics
    const validData = data.filter(row => row.cumulative_adg !== undefined && row.cumulative_weight_diff !== undefined);
    const totalAnimals = data.length;
    const averageADG = validData.length > 0 ? 
      validData.reduce((sum, row) => sum + (row.cumulative_adg || 0), 0) / validData.length : 0;
    const totalWeightGain = validData.reduce((sum, row) => sum + (row.cumulative_weight_diff || 0), 0);
    const positiveGrowthAnimals = validData.filter(row => (row.cumulative_adg || 0) > 0).length;
    
    const categoryName = selectedCategory === "all" ? "جميع الأنواع" : 
                       selectedCategory === "male" ? "ذكور" :
                       selectedCategory === "female" ? "إناث" : "صغار";

    // Create a simple printable version
    const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير أوزان الحيوانات</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', 'Segoe UI', 'Tahoma', sans-serif;
      direction: rtl;
      padding: 15px;
      background: white;
      color: #333;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #4CAF50;
      padding-bottom: 15px;
    }
    .header h1 {
      color: #2E7D32;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header .info {
      color: #666;
      font-size: 14px;
    }
    .summary {
      background: #f8f9fa;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 8px;
      border: 1px solid #ddd;
    }
    .summary h3 {
      color: #2E7D32;
      text-align: center;
      margin-bottom: 15px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      text-align: center;
    }
    .summary-item .value {
      font-size: 20px;
      font-weight: bold;
      color: #4CAF50;
    }
    .summary-item .label {
      color: #666;
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 6px 4px;
      text-align: center;
    }
    th {
      background: #4CAF50;
      color: white;
      font-weight: bold;
    }
    tbody tr:nth-child(even) { background: #f8f9fa; }
    .positive { color: #4CAF50; font-weight: bold; }
    .negative { color: #f44336; font-weight: bold; }
    .footer {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    @media print {
      body { padding: 10px; }
      table { font-size: 9px; }
      th, td { padding: 3px 2px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>تقرير أوزان الحيوانات</h1>
    <div class="info">
      التاريخ: ${currentDate} | عدد الحيوانات: ${formatArabicNumber(totalAnimals)} | نظام إدارة المزرعة
    </div>
  </div>
  
  <div class="summary">
    <h3>ملخص الإحصائيات</h3>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="value">${formatArabicNumber(totalAnimals)}</div>
        <div class="label">إجمالي الحيوانات</div>
      </div>
      <div class="summary-item">
        <div class="value">${formatArabicNumber(Number(averageADG.toFixed(1)))}</div>
        <div class="label">متوسط الزيادة اليومية (جم/يوم)</div>
      </div>
      <div class="summary-item">
        <div class="value">${formatArabicNumber(Number(totalWeightGain.toFixed(1)))}</div>
        <div class="label">إجمالي الزيادة (كجم)</div>
      </div>
      <div class="summary-item">
        <div class="value">${formatArabicNumber(positiveGrowthAnimals)}</div>
        <div class="label">حيوانات نمو إيجابي</div>
      </div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${data.map(row => {
        const cells = [`<td><strong>${row.earTagId}</strong></td>`];
        const maxWeightCount = Math.max(...data.map(r => r.total_weights || 0), 2);
        
        for (let i = 1; i <= maxWeightCount; i++) {
          const dateKey = `weight_${i}_date`;
          const weightKey = `weight_${i}_kg`;
          
          const dateValue = row[dateKey];
          if (dateValue) {
            const formattedDate = new Intl.DateTimeFormat('ar-EG', {
              year: 'numeric',
              month: '2-digit', 
              day: '2-digit',
            }).format(new Date(dateValue));
            cells.push(`<td>${formattedDate}</td>`);
          } else {
            cells.push(`<td>-</td>`);
          }
          
          const weightValue = row[weightKey];
          cells.push(`<td><strong>${weightValue ? formatArabicNumber(weightValue) + ' كجم' : '-'}</strong></td>`);
          
          if (i > 1) {
            const diffKey = `weight_${i-1}_to_${i}_diff`;
            const daysKey = `weight_${i-1}_to_${i}_days`;
            const adgKey = `weight_${i-1}_to_${i}_adg`;
            
            const diffValue = row[diffKey];
            const daysValue = row[daysKey];
            const adgValue = row[adgKey];
            
            cells.push(`<td class="${(diffValue || 0) >= 0 ? 'positive' : 'negative'}">${diffValue !== undefined ? formatArabicNumber(Number(diffValue.toFixed(2))) + ' كجم' : '-'}</td>`);
            cells.push(`<td>${daysValue ? formatArabicNumber(daysValue) + ' يوم' : '-'}</td>`);
            cells.push(`<td class="${(adgValue || 0) >= 0 ? 'positive' : 'negative'}">${adgValue !== undefined ? formatArabicNumber(Number(adgValue.toFixed(1))) + ' جم/يوم' : '-'}</td>`);
          }
        }
        
        cells.push(`<td><strong>${formatArabicNumber(row.total_weights || 0)}</strong></td>`);
        cells.push(`<td class="${(row.cumulative_weight_diff || 0) >= 0 ? 'positive' : 'negative'}"><strong>${row.cumulative_weight_diff ? formatArabicNumber(Number(row.cumulative_weight_diff.toFixed(2))) + ' كجم' : '-'}</strong></td>`);
        cells.push(`<td><strong>${row.cumulative_days ? formatArabicNumber(row.cumulative_days) + ' يوم' : '-'}</strong></td>`);
        cells.push(`<td class="${(row.cumulative_adg || 0) >= 0 ? 'positive' : 'negative'}"><strong>${row.cumulative_adg ? formatArabicNumber(Number(row.cumulative_adg.toFixed(1))) + ' جم/يوم' : '-'}</strong></td>`);
        
        return `<tr>${cells.join('')}</tr>`;
      }).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p><strong>نظام إدارة المزرعة - تقارير الأوزان</strong></p>
    <p>تم إنتاج هذا التقرير في: ${currentDate}</p>
    <p>جميع الأوزان بالكيلوجرام • جميع قيم ADG بالجرام/يوم</p>
  </div>
</body>
</html>`;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }

    toast({
      title: "تم فتح التقرير للطباعة",
      description: "يمكنك طباعة التقرير أو حفظه كـ PDF من متصفحك",
    });
  };
