'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import {
  Printer, Download, QrCode, Barcode,
  Palette, Copy, Check, Plus, Trash2, Package,
} from 'lucide-react';
import './barcode.css';

// ── Types ────────────────────────────────────────────────────
type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF14';
type OutputType = 'barcode' | 'qr';

interface BarcodeItem {
  id: string;
  text: string;
  label: string;
  format: BarcodeFormat;
  type: OutputType;
}

interface BarcodeConfig {
  format: BarcodeFormat;
  type: OutputType;
  width: number;
  height: number;
  fontSize: number;
  textMargin: number;
  margin: number;
  background: string;
  lineColor: string;
  showText: boolean;
  qrErrorLevel: 'L' | 'M' | 'Q' | 'H';
  qrSize: number;
}

const FORMAT_OPTIONS: { value: BarcodeFormat; label: string; example: string }[] = [
  { value: 'CODE128', label: 'Code 128', example: 'ABC-12345' },
  { value: 'CODE39',  label: 'Code 39',  example: 'ASSET-001' },
  { value: 'EAN13',   label: 'EAN-13',   example: '5901234123457' },
  { value: 'EAN8',    label: 'EAN-8',    example: '96385074' },
  { value: 'UPC',     label: 'UPC-A',    example: '012345678905' },
  { value: 'ITF14',   label: 'ITF-14',   example: '00012345678905' },
];

const PRESETS = [
  { bg: '#ffffff', line: '#000000', label: 'Hitam & Putih', id: 'bw' },
  { bg: '#0f172a', line: '#60a5fa', label: 'Dark Blue', id: 'dark-blue' },
  { bg: '#f0fdf4', line: '#15803d', label: 'Hijau', id: 'green' },
  { bg: '#fff7ed', line: '#c2410c', label: 'Oranye', id: 'orange' },
  { bg: '#fdf4ff', line: '#7e22ce', label: 'Ungu', id: 'purple' },
];

const defaultConfig: BarcodeConfig = {
  format: 'CODE128',
  type: 'barcode',
  width: 2,
  height: 80,
  fontSize: 14,
  textMargin: 4,
  margin: 12,
  background: '#ffffff',
  lineColor: '#000000',
  showText: true,
  qrErrorLevel: 'M',
  qrSize: 200,
};

function uid() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

// ── Single barcode preview component ─────────────────────────
function BarcodePreview({ item, config }: { item: BarcodeItem; config: BarcodeConfig }) {
  const svgRef  = useRef<SVGSVGElement>(null);
  const canvRef = useRef<HTMLCanvasElement>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setErr('');
    if (item.type === 'barcode') {
      if (!svgRef.current) return;
      try {
        JsBarcode(svgRef.current, item.text || ' ', {
          format:     item.format,
          width:      config.width,
          height:     config.height,
          fontSize:   config.fontSize,
          textMargin: config.textMargin,
          margin:     config.margin,
          background: config.background,
          lineColor:  config.lineColor,
          displayValue: config.showText,
          text:       config.showText ? (item.label || item.text) : undefined,
          valid: (v) => { if (!v) setErr('Teks tidak valid untuk format ini'); },
        });
      } catch (e: any) {
        setErr(e.message || 'Error');
      }
    } else {
      if (!canvRef.current) return;
      QRCode.toCanvas(canvRef.current, item.text || ' ', {
        width:          config.qrSize,
        margin:         2,
        errorCorrectionLevel: config.qrErrorLevel,
        color: { dark: config.lineColor, light: config.background },
      }).catch((e) => setErr(e.message));
    }
  }, [item, config]);

  return (
    <div className="barcode-preview-item">
      {item.type === 'barcode'
        ? <svg ref={svgRef} />
        : <canvas ref={canvRef} />}
      {err && <span className="barcode-error-text">{err}</span>}
    </div>
  );
}

// ── Print preview card ────────────────────────────────────────
function PrintCard({ item, config }: { item: BarcodeItem; config: BarcodeConfig }) {
  const svgRef  = useRef<SVGSVGElement>(null);
  const canvRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const lblRef  = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (cardRef.current) cardRef.current.style.background = config.background;
    if (lblRef.current)  lblRef.current.style.color = config.lineColor;

    if (item.type === 'barcode' && svgRef.current) {
      try {
        JsBarcode(svgRef.current, item.text || ' ', {
          format: item.format, width: config.width, height: config.height,
          fontSize: config.fontSize, textMargin: config.textMargin, margin: config.margin,
          background: config.background, lineColor: config.lineColor,
          displayValue: config.showText,
          text: config.showText ? (item.label || item.text) : undefined,
        });
      } catch {}
    } else if (item.type === 'qr' && canvRef.current) {
      QRCode.toCanvas(canvRef.current, item.text || ' ', {
        width: config.qrSize, margin: 2,
        errorCorrectionLevel: config.qrErrorLevel,
        color: { dark: config.lineColor, light: config.background },
      }).catch(() => {});
    }
  }, [item, config]);

  return (
    <div ref={cardRef} className="barcode-print-card">
      {item.type === 'barcode'
        ? <svg ref={svgRef} />
        : <canvas ref={canvRef} />}
      {item.label && (
        <span ref={lblRef} className="barcode-print-label">
          {item.label}
        </span>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function BarcodePage() {
  const [config, setConfig] = useState<BarcodeConfig>(defaultConfig);
  const [items,  setItems]  = useState<BarcodeItem[]>([
    { id: uid(), text: 'MRA-ASSET-001', label: 'MRA-ASSET-001', format: 'CODE128', type: 'barcode' },
  ]);
  const [activeId, setActiveId] = useState(items[0].id);
  const [tab, setTab]  = useState<'design' | 'bulk' | 'assets'>('design');
  const [bulkText, setBulkText] = useState('');
  const [copied, setCopied]     = useState('');
  const [assets, setAssets]     = useState<{ id: number; asset_code: string; asset_name: string; category: string; company: string; category_id: number; company_id: number }[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetCompany, setAssetCompany] = useState('');
  const [assetCategory, setAssetCategory] = useState('');
  const [meta, setMeta] = useState<{ companies: any[], categories: any[] }>({ companies: [], categories: [] });

  const cfg = (k: keyof BarcodeConfig, v: any) => setConfig(p => ({ ...p, [k]: v }));
  const activeItem = items.find(i => i.id === activeId) || items[0];

  // Load assets and meta
  useEffect(() => {
    fetch('/api/assets?limit=500').then(r => r.json()).then(d => {
      if (d.data) setAssets(d.data);
    }).catch(() => {});
    fetch('/api/assets/meta').then(r => r.json()).then(setMeta).catch(() => {});
  }, []);

  const addItem = () => {
    const id = uid();
    const ni: BarcodeItem = { id, text: `ITEM-${id}`, label: `ITEM-${id}`, format: config.format, type: config.type };
    setItems(p => [...p, ni]);
    setActiveId(id);
  };

  const removeItem = (id: string) => {
    const next = items.filter(i => i.id !== id);
    setItems(next);
    if (activeId === id) setActiveId(next[0]?.id || '');
  };

  const updateItem = (id: string, patch: Partial<BarcodeItem>) =>
    setItems(p => p.map(i => i.id === id ? { ...i, ...patch } : i));

  // Bulk import
  const importBulk = () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const newItems: BarcodeItem[] = lines.map(l => {
      const [text, label] = l.split('\t');
      const id = uid();
      return { id, text: text.trim(), label: (label || text).trim(), format: config.format, type: config.type };
    });
    setItems(p => [...p, ...newItems]);
    setActiveId(newItems[0].id);
    setBulkText('');
  };

  // Add from asset
  const addFromAsset = (a: typeof assets[0]) => {
    const id = uid();
    setItems(p => [...p, { id, text: a.asset_code, label: `${a.asset_code} – ${a.asset_name}`, format: 'CODE128', type: 'barcode' }]);
    setActiveId(id);
  };

  // Download single as PNG
  const downloadSingle = useCallback(() => {
    const svg = document.querySelector('.preview-area svg') as SVGSVGElement;
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${activeItem.text}.svg`; a.click();
    URL.revokeObjectURL(url);
  }, [activeItem]);

  // Print all
  const printAll = () => {
    const w = window.open('', '_blank', 'width=800,height=600');
    if (!w) return;
    const cards = document.querySelectorAll('.barcode-print-card');
    w.document.write(`
      <html><head><title>Barcode Print</title>
      <style>
        body { font-family: sans-serif; padding: 16px; }
        .wrap { display: flex; flex-wrap: wrap; gap: 16px; }
        .barcode-print-card { display: inline-flex; flex-direction: column; align-items: center; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; gap: 6px; page-break-inside: avoid; }
        .barcode-print-label { font-size: 10px; font-weight: 700; text-align: center; max-width: 180px; }
        @media print { @page { margin: 10mm; } }
      </style></head>
      <body><div class="wrap">
        ${Array.from(cards).map(c => c.outerHTML).join('')}
      </div></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  };

  // Copy text
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 1500);
  };

  const filteredAssets = assets.filter(a => {
    const matchSearch = !assetSearch || a.asset_code.toLowerCase().includes(assetSearch.toLowerCase()) || a.asset_name.toLowerCase().includes(assetSearch.toLowerCase());
    const matchCompany = !assetCompany || a.company === meta.companies.find(c => c.id == assetCompany)?.name;
    const matchCategory = !assetCategory || a.category === meta.categories.find(c => c.id == assetCategory)?.name;
    return matchSearch && matchCompany && matchCategory;
  });

  return (
    <div className="container pb-12">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="barcode-page-header">
          <div className="w-8 h-8 bg-blue rounded-lg flex-center">
            <Barcode size={16} color="#fff" />
          </div>
          <h1 className="barcode-page-title">
            Barcode Generator
          </h1>
        </div>
        <p className="barcode-page-subtitle">
          Generate & cetak barcode / QR Code untuk aset, dokumen, dan label kustom
        </p>
      </div>

      <div className="barcode-container">

        {/* ══ LEFT PANEL ═══════════════════════════════════════ */}
        <div className="barcode-left-panel">

          {/* Tab switcher */}
          <div className="barcode-tab-switcher">
            {(['design','bulk','assets'] as const).map(t => (
              <button 
                key={t} 
                type="button" 
                onClick={() => setTab(t)} 
                className={`barcode-tab-btn ${tab === t ? 'active' : ''}`}
              >
                {t === 'design' ? 'Desain' : t === 'bulk' ? 'Bulk' : 'Aset'}
              </button>
            ))}
          </div>

          {/* ── DESIGN TAB ── */}
          {tab === 'design' && (
            <div className="barcode-panel-card">

              {/* Output type */}
              <div>
                <p className="barcode-setting-label-text mb-2">Tipe Output</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['barcode','qr'] as const).map(t => (
                    <button 
                      key={t} 
                      type="button" 
                      onClick={() => { cfg('type', t); updateItem(activeId, { type: t }); }} 
                      className={`flex-center gap-2 py-2.5 rounded-xl border-2 transition-all font-700 text-sm ${
                        config.type === t ? 'bg-blue-light border-blue text-blue' : 'bg-surface-2 border-border text-text-2'
                      }`}
                    >
                      {t === 'barcode' ? <Barcode size={14}/> : <QrCode size={14}/>}
                      {t === 'barcode' ? 'Barcode' : 'QR Code'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="barcode-setting-group">
                <p className="barcode-setting-label-text">Konten</p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xxs-bold text-text-3 uppercase letter-wide">Teks / Kode</label>
                  <input className="input-premium" value={activeItem.text} title="Teks Barcode"
                    onChange={e => updateItem(activeId, { text: e.target.value })}
                    placeholder="Masukkan kode atau teks…" />
                </div>
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-xxs-bold text-text-3 uppercase letter-wide">Label (teks di bawah)</label>
                  <input className="input-premium" value={activeItem.label} title="Label Barcode"
                    onChange={e => updateItem(activeId, { label: e.target.value })}
                    placeholder="Label opsional…" />
                </div>
              </div>

              {/* Format (barcode only) */}
              {config.type === 'barcode' && (
                <div>
                  <p className="barcode-setting-label-text mb-2">Format Barcode</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FORMAT_OPTIONS.map(f => (
                      <button 
                        key={f.value} 
                        type="button" 
                        onClick={() => { cfg('format', f.value); updateItem(activeId, { format: f.value }); }} 
                        className={`p-2 rounded-lg border-1.5 text-left transition-all ${
                          activeItem.format === f.value ? 'bg-blue-light border-blue text-blue' : 'bg-surface-2 border-border text-text-2'
                        }`}
                      >
                        <span className="block text-xs-bold">{f.label}</span>
                        <span className="block text-xxxs opacity-60 font-500 mt-0.5">{f.example}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Barcode settings */}
              {config.type === 'barcode' && (
                <div className="barcode-setting-group">
                  <p className="barcode-setting-label-text">Ukuran</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    <div>
                      <div className="barcode-setting-label">
                        <span className="text-xxs-bold text-text-3">Lebar</span>
                        <span className="barcode-setting-value">{config.width}px</span>
                      </div>
                      <input type="range" min={1} max={5} step={0.5} value={config.width} title="Lebar Garis"
                        onChange={e => cfg('width', parseFloat(e.target.value))}
                        className="w-full accent-blue mt-1" />
                    </div>
                    <div>
                      <div className="barcode-setting-label">
                        <span className="text-xxs-bold text-text-3">Tinggi</span>
                        <span className="barcode-setting-value">{config.height}px</span>
                      </div>
                      <input type="range" min={40} max={160} step={5} value={config.height} title="Tinggi Barcode"
                        onChange={e => cfg('height', parseInt(e.target.value))}
                        className="w-full accent-blue mt-1" />
                    </div>
                    <div>
                      <div className="barcode-setting-label">
                        <span className="text-xxs-bold text-text-3">Font</span>
                        <span className="barcode-setting-value">{config.fontSize}px</span>
                      </div>
                      <input type="range" min={8} max={24} step={1} value={config.fontSize} title="Ukuran Font"
                        onChange={e => cfg('fontSize', parseInt(e.target.value))}
                        className="w-full accent-blue mt-1" />
                    </div>
                    <div>
                      <div className="barcode-setting-label">
                        <span className="text-xxs-bold text-text-3">Margin</span>
                        <span className="barcode-setting-value">{config.margin}px</span>
                      </div>
                      <input type="range" min={0} max={40} step={2} value={config.margin} title="Margin"
                        onChange={e => cfg('margin', parseInt(e.target.value))}
                        className="w-full accent-blue mt-1" />
                    </div>
                  </div>
                  <label className="flex-start gap-2 mt-2 cursor-pointer group">
                    <input type="checkbox" checked={config.showText} onChange={e => cfg('showText', e.target.checked)} className="w-4 h-4 accent-blue" />
                    <span className="text-xs font-600 text-text-2 group-hover:text-text transition-colors">Tampilkan teks label</span>
                  </label>
                </div>
              )}

              {/* QR settings */}
              {config.type === 'qr' && (
                <div className="barcode-setting-group">
                  <p className="barcode-setting-label-text">QR Settings</p>
                  <div>
                    <div className="barcode-setting-label">
                      <span className="text-xxs-bold text-text-3">Ukuran</span>
                      <span className="barcode-setting-value">{config.qrSize}px</span>
                    </div>
                    <input type="range" min={100} max={400} step={20} value={config.qrSize} title="Ukuran QR Code"
                      onChange={e => cfg('qrSize', parseInt(e.target.value))}
                      className="w-full accent-blue mt-1" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xxs-bold text-text-3 uppercase letter-wide">Error Correction</label>
                    <select className="input-premium" value={config.qrErrorLevel} onChange={e => cfg('qrErrorLevel', e.target.value as any)} title="QR Error Correction Level">
                      <option value="L">L — Low (7%)</option>
                      <option value="M">M — Medium (15%)</option>
                      <option value="Q">Q — Quartile (25%)</option>
                      <option value="H">H — High (30%)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Color presets */}
              <div className="barcode-setting-group">
                <p className="barcode-setting-label-text flex-start gap-1.5">
                  <Palette size={12}/> Warna
                </p>
                <div className="barcode-preset-grid">
                  {PRESETS.map(p => (
                    <button 
                      key={p.label} 
                      type="button" 
                      title={p.label}
                      onClick={() => { cfg('background', p.bg); cfg('lineColor', p.line); }}
                      className={`barcode-preset-btn barcode-preset-${p.id} flex-center ${config.background === p.bg && config.lineColor === p.line ? 'active' : ''}`}
                    >
                      <div className="w-2.5 h-2.5 rounded-sm" />
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-xxxs-bold text-text-3 uppercase">BG</label>
                    <div className="flex-start gap-1.5">
                      <input type="color" value={config.background} onChange={e => cfg('background', e.target.value)} title="BG Picker" className="w-8 h-8 rounded-lg border-none bg-none p-0 cursor-pointer overflow-hidden" />
                      <input className="input-premium font-mono !text-xxs !py-1 !px-2" value={config.background} onChange={e => cfg('background', e.target.value)} title="BG Hex" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xxxs-bold text-text-3 uppercase">Line</label>
                    <div className="flex-start gap-1.5">
                      <input type="color" value={config.lineColor} onChange={e => cfg('lineColor', e.target.value)} title="Line Picker" className="w-8 h-8 rounded-lg border-none bg-none p-0 cursor-pointer overflow-hidden" />
                      <input className="input-premium font-mono !text-xxs !py-1 !px-2" value={config.lineColor} onChange={e => cfg('lineColor', e.target.value)} title="Line Hex" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── BULK TAB ── */}
          {tab === 'bulk' && (
            <div className="barcode-panel-card">
              <p className="barcode-setting-label-text">Import Massal</p>
              <div className="info-card !p-3 !bg-blue-light !border-blue-border/30">
                <p className="text-xxs text-blue leading-relaxed font-600">
                  Satu baris = satu barcode.<br/>
                  Format: <code className="bg-white/40 px-1 rounded">KODE[Tab]LABEL</code>
                </p>
              </div>
              <textarea
                rows={8}
                className="input-premium font-mono text-xs resize-none"
                placeholder={'MRA-001\tAsset Laptop\nMRA-002\tAsset Monitor\nMRA-003'}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
              />
              <button type="button" className="btn btn-primary w-full justify-center" onClick={importBulk}>
                <Plus size={14} /> Import {bulkText.split('\n').filter(Boolean).length} Item
              </button>
            </div>
          )}

          {/* ── ASSETS TAB ── */}
          {tab === 'assets' && (
            <div className="barcode-panel-card">
              <p className="barcode-setting-label-text">Dari Data Aset</p>
              
              <div className="flex flex-col gap-2">
                <input className="input-premium" placeholder="Cari kode / nama aset…" title="Cari Aset"
                  value={assetSearch} onChange={e => setAssetSearch(e.target.value)} />
                  
                <div className="grid grid-cols-2 gap-2">
                  <select className="input-premium !py-1.5 !text-xxs" value={assetCompany} onChange={e => setAssetCompany(e.target.value)} title="Filter Co">
                    <option value="">-- Perusahaan --</option>
                    {meta.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select className="input-premium !py-1.5 !text-xxs" value={assetCategory} onChange={e => setAssetCategory(e.target.value)} title="Filter Cat">
                    <option value="">-- Kategori --</option>
                    {meta.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mt-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredAssets.slice(0, 50).map(a => (
                  <button 
                    key={a.id} 
                    type="button" 
                    onClick={() => addFromAsset(a)} 
                    className="flex-start gap-2.5 p-2 rounded-xl border border-border bg-surface-2 hover:border-blue transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-light text-blue flex-center shrink-0">
                      <Package size={14} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs-bold text-text truncate">{a.asset_code}</p>
                      <p className="text-xxxs text-text-3 truncate">{a.asset_name}</p>
                    </div>
                    <Plus size={14} className="text-text-3 group-hover:text-blue" />
                  </button>
                ))}
                {assets.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-xs text-text-3">Memuat data aset…</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT PANEL ══════════════════════════════════════ */}
        <div className="barcode-main-content">

          {/* Toolbar */}
          <div className="flex-between flex-wrap gap-2">
            <div className="flex gap-2">
              <button type="button" className="btn" onClick={addItem}><Plus size={14}/> Tambah Item</button>
              <button type="button" className="btn btn-primary" onClick={printAll}><Printer size={14}/> Print ({items.length})</button>
              <button type="button" className="btn" onClick={downloadSingle}><Download size={14}/> SVG</button>
            </div>
            <div className="px-3 py-1.5 bg-surface-2 border border-border rounded-xl text-xxs-bold text-text-3 uppercase letter-wide">
              {items.length} Item
            </div>
          </div>

          {/* Item list tabs */}
          {items.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              {items.map((item, i) => (
                <div key={item.id} className="flex-start gap-px group">
                  <button 
                    type="button" 
                    onClick={() => setActiveId(item.id)} 
                    className={`px-3 py-1.5 rounded-l-lg border font-700 text-xxs transition-all ${
                      activeId === item.id ? 'bg-blue border-blue text-white shadow-sm' : 'bg-surface-2 border-border text-text-3 hover:bg-surface'
                    }`}
                  >
                    {item.text.slice(0, 10)}{item.text.length > 10 ? '…' : ''} #{i + 1}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => removeItem(item.id)} 
                    title="Hapus"
                    className={`px-1.5 py-1.5 rounded-r-lg border border-l-0 transition-all ${
                      activeId === item.id ? 'bg-blue border-blue text-white/70 hover:text-white' : 'bg-surface-2 border-border text-text-3 hover:text-rose'
                    }`}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Preview area */}
          <div className="barcode-preview-card preview-area">
            <div className="barcode-preview-bg" />
            <div className="relative z-1">
              <BarcodePreview item={activeItem} config={config} />
              <div className="flex-center mt-6">
                <button type="button" className="btn bg-white/80 backdrop-blur-md shadow-sm !text-xxs !px-3 !py-1.5"
                  onClick={() => copyText(activeItem.text)}>
                  {copied === activeItem.text ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                  <span>{copied === activeItem.text ? 'Disalin!' : 'Salin Teks'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Print preview grid */}
          <div className="barcode-panel-card">
            <div className="flex-between mb-4">
              <p className="barcode-setting-label-text">
                Preview Print — {items.length} item
              </p>
              <button type="button" className="btn btn-primary !text-xxs !py-1 !px-3" onClick={printAll}>
                <Printer size={13} /> Print
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {items.map(item => (
                <PrintCard key={item.id} item={item} config={config} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
