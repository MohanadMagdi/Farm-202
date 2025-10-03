/**
 * Canvas Export Utilities
 * Provides functionality to export components and pages as images using html2canvas
 */

import html2canvas from 'html2canvas';

export interface CanvasExportOptions {
  filename?: string;
  quality?: number;
  backgroundColor?: string;
  scale?: number;
  width?: number;
  height?: number;
  useCORS?: boolean;
  allowTaint?: boolean;
  logging?: boolean;
}

export interface CanvasExportResult {
  success: boolean;
  dataUrl?: string;
  blob?: Blob;
  error?: string;
}

/**
 * Export an HTML element to canvas/image
 */
export async function exportElementToCanvas(
  element: HTMLElement,
  options: CanvasExportOptions = {}
): Promise<CanvasExportResult> {
  try {
    const {
      filename = 'export',
      quality = 0.92,
      backgroundColor = '#ffffff',
      scale = 2,
      width,
      height,
      useCORS = true,
      allowTaint = false,
      logging = false,
    } = options;

    // Configure html2canvas options
    const canvasOptions = {
      backgroundColor,
      scale,
      useCORS,
      allowTaint,
      logging,
      width,
      height,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    };

    // Generate canvas
    const canvas = await html2canvas(element, canvasOptions);
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', quality);
    });

    // Generate data URL
    const dataUrl = canvas.toDataURL('image/png', quality);

    // Download file
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      dataUrl,
      blob,
    };
  } catch (error) {
    console.error('Canvas export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Export current page/viewport to canvas
 */
export async function exportPageToCanvas(
  options: CanvasExportOptions = {}
): Promise<CanvasExportResult> {
  const body = document.body;
  return exportElementToCanvas(body, {
    filename: 'page-export',
    ...options,
  });
}

/**
 * Export a specific component by selector
 */
export async function exportComponentToCanvas(
  selector: string,
  options: CanvasExportOptions = {}
): Promise<CanvasExportResult> {
  const element = document.querySelector(selector) as HTMLElement;
  
  if (!element) {
    return {
      success: false,
      error: `Element with selector "${selector}" not found`,
    };
  }

  return exportElementToCanvas(element, {
    filename: 'component-export',
    ...options,
  });
}

/**
 * Export dashboard or report to canvas
 */
export async function exportDashboardToCanvas(
  dashboardElement: HTMLElement,
  title: string,
  options: CanvasExportOptions = {}
): Promise<CanvasExportResult> {
  return exportElementToCanvas(dashboardElement, {
    filename: `dashboard-${title.toLowerCase().replace(/\s+/g, '-')}`,
    backgroundColor: '#ffffff',
    scale: 2,
    ...options,
  });
}

/**
 * Export table to canvas
 */
export async function exportTableToCanvas(
  tableElement: HTMLElement,
  title: string,
  options: CanvasExportOptions = {}
): Promise<CanvasExportResult> {
  return exportElementToCanvas(tableElement, {
    filename: `table-${title.toLowerCase().replace(/\s+/g, '-')}`,
    backgroundColor: '#ffffff',
    scale: 1.5,
    ...options,
  });
}

/**
 * Export chart to canvas
 */
export async function exportChartToCanvas(
  chartElement: HTMLElement,
  title: string,
  options: CanvasExportOptions = {}
): Promise<CanvasExportResult> {
  return exportElementToCanvas(chartElement, {
    filename: `chart-${title.toLowerCase().replace(/\s+/g, '-')}`,
    backgroundColor: '#ffffff',
    scale: 2,
    ...options,
  });
}

/**
 * Batch export multiple elements
 */
export async function batchExportToCanvas(
  elements: Array<{
    element: HTMLElement;
    filename: string;
    options?: CanvasExportOptions;
  }>
): Promise<CanvasExportResult[]> {
  const results: CanvasExportResult[] = [];
  
  for (const { element, filename, options = {} } of elements) {
    const result = await exportElementToCanvas(element, {
      filename,
      ...options,
    });
    results.push(result);
  }
  
  return results;
}

/**
 * Create a canvas preview without downloading
 */
export async function createCanvasPreview(
  element: HTMLElement,
  options: CanvasExportOptions = {}
): Promise<string | null> {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: options.backgroundColor || '#ffffff',
      scale: options.scale || 1,
      useCORS: options.useCORS ?? true,
      allowTaint: options.allowTaint ?? false,
    });
    
    return canvas.toDataURL('image/png', options.quality || 0.8);
  } catch (error) {
    console.error('Canvas preview error:', error);
    return null;
  }
}

