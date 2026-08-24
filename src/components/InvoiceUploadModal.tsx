import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  RefreshCw,
  CheckCircle2,
  Cloud,
  ExternalLink
} from 'lucide-react';
import { StockItem, ParsedInvoiceResult, SampleInvoicePreset } from '../types';
import { SAMPLE_INVOICE_PRESETS, normalizeCategory } from '../data/defaultStock';
import { generateInvoiceMockupImage } from '../utils/sampleInvoiceCanvas';
import { playInvoiceAppliedSound } from '../utils/audioFeedback';
import { uploadToSupabaseBucket } from '../utils/supabaseStorage';

interface InvoiceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockCatalog: StockItem[];
  onApplyInvoiceItems: (invoiceData: ParsedInvoiceResult) => void;
}

export const InvoiceUploadModal: React.FC<InvoiceUploadModalProps> = ({
  isOpen,
  onClose,
  stockCatalog,
  onApplyInvoiceItems,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'sample'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<ParsedInvoiceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [uploadedStorageUrl, setUploadedStorageUrl] = useState<string | null>(null);
  const [storageStatus, setStorageStatus] = useState<string | null>(null);

  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!isOpen) return null;

  // Handle Drag and Drop / File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      setParsedResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Camera Management
  const startCamera = async () => {
    try {
      setErrorMsg(null);
      if (!navigator?.mediaDevices?.getUserMedia) {
        setErrorMsg('الكاميرا غير مدعومة في هذا المتصفح أو بيئة العرض. يرجى رفع صورة الفاتورة أو استخدام النماذج الجاهزة.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {
          // Play was interrupted or auto-play blocked
        });
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setErrorMsg('تعذر الوصول للكاميرا. يرجى التأكد من إذن الكاميرا أو رفع صورة الفاتورة مباشرة.');
    }
  };

  const stopCamera = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {
            // Ignore track stop error
          }
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch {
      // Ignore cleanup error
    }
    setIsCameraActive(false);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUrl);
      stopCamera();
      setActiveTab('upload');
      setParsedResult(null);
    }
  };

  // Preset Sample Selection
  const handleSelectPreset = (preset: SampleInvoicePreset) => {
    setErrorMsg(null);
    const generatedImage = generateInvoiceMockupImage(preset);
    setSelectedImage(generatedImage);
    setActiveTab('upload');
    setParsedResult(null);
  };

  // AI Invoice Scanner API Call with Supabase bucket archiving
  const handleScanInvoiceWithAI = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setUploadedStorageUrl(null);
    setStorageStatus('جاري الاتصال بمحرك الذكاء الاصطناعي Gemini...');
    setProcessingStep('جاري تحليل الفاتورة بواسطة Gemini AI...');

    try {
      // Step 1: Attempt to archive the invoice image to Supabase Bucket in parallel
      uploadToSupabaseBucket(selectedImage)
        .then((res) => {
          setUploadedStorageUrl(res.publicUrl);
          setStorageStatus(`تم حفظ نسخة الفاتورة في سحابة Supabase (${res.path})`);
        })
        .catch((storageErr) => {
          console.warn('Supabase storage upload info:', storageErr?.message || storageErr);
          setStorageStatus('تمت المعالجة محلياً');
        });

      setTimeout(() => setProcessingStep('قراءة بنود الفاتورة وأرقام القطع والأسعار...'), 700);
      setTimeout(() => setProcessingStep('مطابقة القطع مع مخزون الورشة الحالي...'), 1400);

      const response = await fetch('/api/parse-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: 'image/jpeg',
          existingCatalog: stockCatalog,
        }),
      });

      if (!response.ok) {
        throw new Error(`استجاب الخادم بخطأ ${response.status}: تعذر استخراج بيانات الفاتورة`);
      }

      const data: ParsedInvoiceResult = await response.json();

      // Correlate extracted items with existing stock catalog
      const itemsWithMatch = data.items.map((item) => {
        const cleanSku = (item.partNumber || '').toUpperCase().trim();
        const cleanName = (item.name || '').toLowerCase().trim();

        const match = stockCatalog.find(
          (c) =>
            (c.partNumber && c.partNumber.toUpperCase().trim() === cleanSku) ||
            (cleanSku && c.partNumber && c.partNumber.toUpperCase().includes(cleanSku)) ||
            cleanName.includes(c.name.toLowerCase().trim().slice(0, 15))
        );

        return {
          ...item,
          category: normalizeCategory(item.category),
          matchedItemId: match ? match.id : undefined,
          isNewItem: !match,
          locationSuggestion: match ? match.location : item.locationSuggestion || 'المستودع الرئيسي',
        };
      });

      setParsedResult({
        ...data,
        items: itemsWithMatch,
      });
    } catch (err: any) {
      console.error('Invoice scanning error:', err);
      setErrorMsg(err.message || 'تعذر قراءة صورة الفاتورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Edit item inside preview
  const handleUpdateParsedItemQty = (index: number, newQty: number) => {
    if (!parsedResult) return;
    const updated = [...parsedResult.items];
    updated[index] = { ...updated[index], quantity: Math.max(1, newQty) };
    setParsedResult({ ...parsedResult, items: updated });
  };

  const handleUpdateParsedItemCost = (index: number, newCost: number) => {
    if (!parsedResult) return;
    const updated = [...parsedResult.items];
    updated[index] = { 
      ...updated[index], 
      unitCost: newCost,
      suggestedSellingPrice: Number((newCost * 1.5).toFixed(2)) 
    };
    setParsedResult({ ...parsedResult, items: updated });
  };

  const handleRemoveParsedItem = (index: number) => {
    if (!parsedResult) return;
    const updated = parsedResult.items.filter((_, i) => i !== index);
    setParsedResult({ ...parsedResult, items: updated });
  };

  // Confirm and Apply to Inventory
  const handleConfirmAndApply = () => {
    if (!parsedResult || parsedResult.items.length === 0) return;
    playInvoiceAppliedSound();
    onApplyInvoiceItems(parsedResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-[calc(100vw-1rem)] sm:max-w-4xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 text-right">
              <h2 className="text-sm sm:text-lg font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
                قارئ الفواتير الذكي وتحديث المخزون
                <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                  بالذكاء الاصطناعي
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                التقط أو ارفع صورة فاتورة الشراء وسيقوم النظام بقراءة البنود وتوريدها تلقائياً
              </p>
            </div>
          </div>

          <button
            id="close-invoice-modal-btn"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6 text-right">
          
          {/* Navigation Tabs */}
          {!parsedResult && (
            <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto w-full">
              <button
                id="tab-upload-photo-btn"
                onClick={() => {
                  stopCamera();
                  setActiveTab('upload');
                }}
                className={`flex-1 min-w-[90px] py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline">رفع صورة الفاتورة</span>
                <span className="sm:hidden">رفع ملف</span>
              </button>

              <button
                id="tab-camera-btn"
                onClick={() => {
                  setActiveTab('camera');
                  startCamera();
                }}
                className={`flex-1 min-w-[90px] py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline">تصوير فوري بالكاميرا</span>
                <span className="sm:hidden">الكاميرا</span>
              </button>

              <button
                id="tab-sample-invoices-btn"
                onClick={() => {
                  stopCamera();
                  setActiveTab('sample');
                }}
                className={`flex-1 min-w-[90px] py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'sample'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline">نماذج فواتير جاهزة للتجربة</span>
                <span className="sm:hidden">نماذج</span>
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: File Upload / Drag & Drop */}
          {activeTab === 'upload' && !parsedResult && (
            <div>
              {selectedImage ? (
                <div className="space-y-4">
                  <div className="relative rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden max-h-72 flex items-center justify-center p-2">
                    <img
                      src={selectedImage}
                      alt="معاينة الفاتورة"
                      className="max-h-68 rounded-xl object-contain shadow-sm"
                    />
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-4 left-4 bg-white/90 hover:bg-white text-slate-900 p-2 rounded-xl border border-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>تغيير الصورة</span>
                    </button>
                  </div>

                  {/* Trigger Scan Button */}
                  <button
                    id="trigger-ai-scan-btn"
                    onClick={handleScanInvoiceWithAI}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{processingStep || 'جاري المسح بالذكاء الاصطناعي...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>مسح الفاتورة واستخراج القطع والكميات تلقائياً</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-slate-100/60 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      اسحب وأفلت صورة الفاتورة أو إيصال التوريد هنا
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      يدعم صور JPG أو PNG أو WEBP أو لقطات كاميرا الهاتف
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-amber-800 font-semibold text-xs border border-slate-300 cursor-pointer shadow-sm"
                  >
                    استعراض الملفات من الجهاز
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Live Camera */}
          {activeTab === 'camera' && !parsedResult && (
            <div className="space-y-4">
              <div className="relative rounded-2xl bg-black border border-slate-200 overflow-hidden aspect-video max-h-80 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Guide overlay box */}
                <div className="absolute inset-8 border-2 border-dashed border-amber-400/70 rounded-xl pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-amber-200 bg-slate-950/80 px-3 py-1 rounded-full">
                    ضع الفاتورة داخل هذا الإطار بوضوح
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  id="snap-camera-photo-btn"
                  onClick={captureCameraPhoto}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>التقاط الصورة ومعاينتها</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Test Sample Invoices */}
          {activeTab === 'sample' && !parsedResult && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                ليس لديك فاتورة ورقية حالياً؟ جرب مسح إحدى هذه الفواتير الواقعية لشركات قطع الغيار:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAMPLE_INVOICE_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-500 hover:bg-white transition-all cursor-pointer flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300" dir="ltr">
                          {preset.invoiceNumber}
                        </span>
                        <span className="text-[11px] font-mono text-slate-600" dir="ltr">
                          ${preset.total.toFixed(2)}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-2">
                        {preset.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {preset.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-amber-700 font-semibold">
                      <span>{preset.itemCount} بنود في الفاتورة</span>
                      <span className="flex items-center gap-1">
                        استخدم هذه <ArrowLeft className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: PARSED RESULTS REVIEW TABLE */}
          {parsedResult && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300">
              
              {/* Invoice Summary Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full min-w-0 shadow-sm">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      اسم المورد / الشركة
                    </span>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {parsedResult.supplierName}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-4 text-xs font-mono pt-2 sm:pt-0 border-t border-slate-200 sm:border-0">
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 block">رقم الفاتورة</span>
                    <span className="text-amber-800 font-bold text-[11px] sm:text-xs" dir="ltr">{parsedResult.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 block">التاريخ</span>
                    <span className="text-slate-700 text-[11px] sm:text-xs" dir="ltr">{parsedResult.invoiceDate}</span>
                  </div>
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 block">الإجمالي</span>
                    <span className="text-emerald-700 font-bold text-xs sm:text-sm" dir="ltr">
                      ${parsedResult.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  {uploadedStorageUrl && (
                    <div className="hidden lg:block">
                      <span className="text-[9px] text-emerald-700 block font-sans">سحابة التخزين</span>
                      <a
                        href={uploadedStorageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-600 hover:underline flex items-center gap-1 text-[11px] font-sans"
                        title="عرض الملف الأصلي في Supabase Bucket"
                      >
                        <Cloud className="w-3 h-3" />
                        <span>Supabase</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Extracted List */}
              <div className="min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    القطع المستخرجة من الفاتورة ({parsedResult.items.length} صنف)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    راجع الكميات والأسعار قبل اعتماد إضافة المخزون
                  </span>
                </div>

                <div className="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto pl-0.5">
                  {parsedResult.items.map((item, index) => {
                    const matchedStock = stockCatalog.find(s => s.id === item.matchedItemId);
                    const newTotalQty = matchedStock ? matchedStock.quantity + item.quantity : item.quantity;

                    return (
                      <div
                        key={index}
                        className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-xs w-full min-w-0 shadow-sm"
                      >
                        {/* Part Info */}
                        <div className="flex-1 min-w-0 w-full sm:w-auto text-right">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded bg-white text-amber-800 border border-slate-300" dir="ltr">
                              {item.partNumber}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              {normalizeCategory(item.category)}
                            </span>
                          </div>

                          <div className="font-bold text-slate-900 text-xs sm:text-sm mt-1 truncate">
                            {item.name}
                          </div>

                          {/* Match status */}
                          <div className="mt-1 text-[10px] sm:text-[11px]">
                            {matchedStock ? (
                              <span className="text-emerald-700 font-medium flex items-center gap-1">
                                <Check className="w-3 h-3 shrink-0" />
                                <span>مطابق في الورشة: المتوفر {matchedStock.quantity} ➔ <strong className="text-emerald-800 font-mono">{newTotalQty} بعد التوريد</strong></span>
                              </span>
                            ) : (
                              <span className="text-amber-700 font-medium flex items-center gap-1">
                                <Sparkles className="w-3 h-3 shrink-0" />
                                <span>صنف جديد يُضاف لأول مرة للكتالوج</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Editable Quantity & Unit Cost */}
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-200 sm:border-0 shrink-0">
                          <div>
                            <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase block font-semibold text-center">الكمية المضافة</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateParsedItemQty(index, parseInt(e.target.value, 10) || 1)}
                                className="w-14 sm:w-16 font-mono font-extrabold text-xs sm:text-sm text-center bg-white text-emerald-700 border border-slate-300 rounded-lg py-1 focus:outline-none focus:border-emerald-500 shadow-sm"
                              />
                              <span className="text-slate-600 text-[11px]">{item.unit}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase block font-semibold text-center">سعر الوحدة</span>
                            <div className="flex items-center gap-0.5 mt-0.5 font-mono" dir="ltr">
                              <span className="text-slate-500 text-xs">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitCost}
                                onChange={(e) => handleUpdateParsedItemCost(index, parseFloat(e.target.value) || 0)}
                                className="w-16 sm:w-20 font-mono font-semibold text-xs sm:text-sm text-center bg-white text-slate-900 border border-slate-300 rounded-lg py-1 focus:outline-none shadow-sm"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveParsedItem(index)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-slate-100 transition-colors mt-3 sm:mt-0 shrink-0 cursor-pointer"
                            title="حذف هذا البند"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {parsedResult ? (
            <>
              <button
                onClick={() => {
                  setParsedResult(null);
                  setSelectedImage(null);
                }}
                className="order-2 sm:order-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-center cursor-pointer"
              >
                مسح فاتورة أخرى
              </button>

              <button
                id="confirm-apply-inventory-btn"
                onClick={handleConfirmAndApply}
                className="order-1 sm:order-2 px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3] shrink-0" />
                <span>تأكيد وتوريد المخزون (+{parsedResult.items.reduce((a, b) => a + b.quantity, 0)} قطعة)</span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs text-slate-500 truncate">
                الذكاء الاصطناعي يقرأ الأصناف والكميات وأسعار المورد تلقائياً
              </span>
              <button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

