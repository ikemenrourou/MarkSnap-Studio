import React from 'react';
import {
  Check,
  Copy,
  Download,
  FileArchive,
  Smartphone,
  X,
} from 'lucide-react';
import { CanvasExportMetrics } from '../utils/markdownProcessor';
import { I18N, Locale } from '../utils/i18n';

export interface GeneratedCardImage {
  pageIndex: number;
  dataUrl: string;
  sizeKB: number;
}

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: GeneratedCardImage[];
  exportFormat: 'png' | 'jpeg';
  metrics: CanvasExportMetrics;
  onCopySingle: (dataUrl: string, pageIndex: number) => Promise<void>;
  onDownloadSingle: (dataUrl: string, pageIndex: number) => void;
  onDownloadZip: () => Promise<void>;
  copiedPageIndex: number | null;
  locale?: Locale;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  images,
  exportFormat,
  metrics,
  onCopySingle,
  onDownloadSingle,
  onDownloadZip,
  copiedPageIndex,
  locale = 'zh',
}) => {
  if (!isOpen) return null;

  const t = I18N[locale];
  const totalSizeKB = images.reduce((acc, item) => acc + item.sizeKB, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.modalTitle}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.modalTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {t.modalSummary(
                images.length,
                metrics.physicalWidth,
                metrics.physicalHeight,
                metrics.effectiveScale,
                totalSizeKB,
                exportFormat.toUpperCase()
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WeChat & Mobile Tip Banner */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>{t.modalTipMobileTitle}</strong>
              {t.modalTipMobileBody}
              <strong>{t.modalTipDesktopTitle}</strong>
              {t.modalTipDesktopBody}
            </span>
          </div>
          {images.length > 1 && (
            <button
              type="button"
              onClick={onDownloadZip}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-emerald-600 text-white font-medium hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileArchive className="w-3.5 h-3.5" />
              {t.downloadAllZip(images.length)}
            </button>
          )}
        </div>

        {/* Image List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-100/70 dark:bg-slate-950/60">
          {images.map((img) => (
            <div
              key={img.pageIndex}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col items-center gap-4"
            >
              <div className="w-full flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                  {images.length > 1
                    ? t.singlePageItemLabel(
                        img.pageIndex + 1,
                        images.length,
                        img.sizeKB
                      )
                    : t.fullLongImageLabel(img.sizeKB)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCopySingle(img.dataUrl, img.pageIndex)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedPageIndex === img.pageIndex ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        {t.copiedLabel}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        {t.copyImage}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownloadSingle(img.dataUrl, img.pageIndex)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t.downloadFormat(exportFormat.toUpperCase())}
                  </button>
                </div>
              </div>

              <div className="max-w-full overflow-x-auto flex justify-center">
                <img
                  src={img.dataUrl}
                  alt={`Exported page ${img.pageIndex + 1}`}
                  referrerPolicy="no-referrer"
                  className="max-w-full h-auto rounded border border-slate-200 dark:border-slate-800"
                  style={{ maxWidth: '480px' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
