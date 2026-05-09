'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import {
  Printer, Download, RefreshCw, QrCode, Barcode,
  Palette, Settings2, Copy, Check, Plus, Trash2, Package,
} from 'lucide-react';

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
  { bg: '#ffffff', line: '#000000', label: 'Hitam & Putih' },
  { bg: '#0f172a', line: '#60a5fa', label: 'Dark Blue' },
  { bg: '#f0fdf4', line: '#15803d', label: 'Hijau' },
  { bg: '#fff7ed', line: '#c2410c', label: 'Oranye' },
  { bg: '#fdf4ff', line: '#7e22ce', label: 'Ungu' },
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      {item.type === 'barcode'
        ? <svg ref={svgRef} style={{ maxWidth: '100%' }} />
        : <canvas ref={canvRef} style={{ borderRadius: 8 }} />}
      {err && <span style={{ fontSize: '0.7rem', color: 'var(--rose)' }}>{err}</span>}
    </div>
  );
}

// ── Print preview card ────────────────────────────────────────
function PrintCard({ item, config }: { item: BarcodeItem; config: BarcodeConfig }) {
  const svgRef  = useRef<SVGSVGElement>(null);
  const canvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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
    <div className="print-card" style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      padding: '12px', border: '1px solid #e2e8f0', borderRadius: 8,
      background: config.background, gap: 6, pageBreakInside: 'avoid',
    }}>
      {item.type === 'barcode'
        ? <svg ref={svgRef} />
        : <canvas ref={canvRef} />}
      {item.label && (
        <span style={{ fontSize: 10, fontWeight: 700, color: config.lineColor, textAlign: 'center', maxWidth: 180 }}>
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
    const cards = document.querySelectorAll('.print-card');
    w.document.write(`
      <html><head><title>Barcode Print</title>
      <style>
        body { font-family: sans-serif; padding: 16px; }
        .wrap { display: flex; flex-wrap: wrap; gap: 16px; }
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

  // ─────────────────────────────────────────────────────────────
  const iStyle2: React.CSSProperties = {
    width: '100%', padding: '0.45rem 0.75rem',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--text)', fontSize: '0.8rem', outline: 'none',
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem', maxWidth: 1400 }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <div style={{ width: 32, height: 32, background: 'var(--blue)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Barcode size={16} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Barcode Generator
          </h1>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginLeft: 44 }}>
          Generate & cetak barcode / QR Code untuk aset, dokumen, dan label kustom
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* ══ LEFT PANEL ═══════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Tab switcher */}
          <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, gap: 2 }}>
            {(['design','bulk','assets'] as const).map(t => (
              <button key={t} type="button" onClick={() => setTab(t)} style={{
                flex: 1, padding: '0.42rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                background: tab === t ? 'var(--surface)' : 'transparent',
                color: tab === t ? 'var(--text)' : 'var(--text-3)',
                boxShadow: tab === t ? '0 1px 4px rgba(15,23,42,0.08)' : 'none',
                transition: 'all 0.18s',
              }}>
                {t === 'design' ? 'Desain' : t === 'bulk' ? 'Bulk' : 'Aset'}
              </button>
            ))}
          </div>

          {/* ── DESIGN TAB ── */}
          {tab === 'design' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Output type */}
              <div>
                <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Tipe Output</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {(['barcode','qr'] as const).map(t => (
                    <button key={t} type="button" onClick={() => { cfg('type', t); updateItem(activeId, { type: t }); }} style={{
                      padding: '0.55rem', borderRadius: 10, border: `2px solid ${config.type === t ? 'var(--blue)' : 'var(--border)'}`,
                      background: config.type === t ? 'var(--blue-light)' : 'var(--surface-2)',
                      color: config.type === t ? 'var(--blue)' : 'var(--text-2)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontWeight: 700, fontSize: '0.78rem', transition: 'all 0.18s',
                    }}>
                      {t === 'barcode' ? <Barcode size={14}/> : <QrCode size={14}/>}
                      {t === 'barcode' ? 'Barcode' : 'QR Code'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Konten</p>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Teks / Kode</label>
                <input style={iStyle2} value={activeItem.text} title="Teks Barcode"
                  onChange={e => updateItem(activeId, { text: e.target.value })}
                  placeholder="Masukkan kode atau teks…" />
                <label style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Label (teks di bawah)</label>
                <input style={iStyle2} value={activeItem.label} title="Label Barcode"
                  onChange={e => updateItem(activeId, { label: e.target.value })}
                  placeholder="Label opsional…" />
              </div>

              {/* Format (barcode only) */}
              {config.type === 'barcode' && (
                <div>
                  <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Format Barcode</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                    {FORMAT_OPTIONS.map(f => (
                      <button key={f.value} type="button" onClick={() => { cfg('format', f.value); updateItem(activeId, { format: f.value }); }} style={{
                        padding: '0.42rem 0.6rem', borderRadius: 8, border: `1.5px solid ${activeItem.format === f.value ? 'var(--blue)' : 'var(--border)'}`,
                        background: activeItem.format === f.value ? 'var(--blue-light)' : 'var(--surface-2)',
                        color: activeItem.format === f.value ? 'var(--blue)' : 'var(--text-2)',
                        fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s', textAlign: 'left',
                      }}>
                        {f.label}
                        <span style={{ display: 'block', fontSize: '0.58rem', opacity: 0.6, fontWeight: 400, marginTop: 1 }}>{f.example}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Barcode settings */}
              {config.type === 'barcode' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ukuran</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Lebar garis: {config.width}px</label>
                      <input type="range" min={1} max={5} step={0.5} value={config.width} title="Lebar Garis"
                        onChange={e => cfg('width', parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--blue)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Tinggi: {config.height}px</label>
                      <input type="range" min={40} max={160} step={5} value={config.height} title="Tinggi Barcode"
                        onChange={e => cfg('height', parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--blue)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Font: {config.fontSize}px</label>
                      <input type="range" min={8} max={24} step={1} value={config.fontSize} title="Ukuran Font"
                        onChange={e => cfg('fontSize', parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--blue)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Margin: {config.margin}px</label>
                      <input type="range" min={0} max={30} step={2} value={config.margin} title="Margin"
                        onChange={e => cfg('margin', parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--blue)' }} />
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer', color: 'var(--text-2)' }}>
                    <input type="checkbox" checked={config.showText} onChange={e => cfg('showText', e.target.checked)} style={{ accentColor: 'var(--blue)', width: 'auto' }} />
                    Tampilkan teks di bawah barcode
                  </label>
                </div>
              )}

              {/* QR settings */}
              {config.type === 'qr' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>QR Settings</p>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Ukuran: {config.qrSize}px</label>
                  <input type="range" min={100} max={400} step={20} value={config.qrSize} title="Ukuran QR Code"
                    onChange={e => cfg('qrSize', parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--blue)' }} />
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Error correction</label>
                  <select style={iStyle2} value={config.qrErrorLevel} onChange={e => cfg('qrErrorLevel', e.target.value as any)} title="QR Error Correction Level">
                    <option value="L">L — Low (7%)</option>
                    <option value="M">M — Medium (15%)</option>
                    <option value="Q">Q — Quartile (25%)</option>
                    <option value="H">H — High (30%)</option>
                  </select>
                </div>
              )}

              {/* Color presets */}
              <div>
                <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                  <Palette size={11} style={{ display: 'inline', marginRight: 4 }} />Warna
                </p>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {PRESETS.map(p => (
                    <button key={p.label} type="button" title={p.label}
                      onClick={() => { cfg('background', p.bg); cfg('lineColor', p.line); }}
                      style={{ width: 28, height: 28, borderRadius: 8, border: '2px solid var(--border)', cursor: 'pointer', background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 12, height: 12, background: p.line, borderRadius: 3 }} />
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Background</label>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                      <input type="color" value={config.background} onChange={e => cfg('background', e.target.value)} title="Warna Background (Picker)"
                        style={{ width: 36, height: 32, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', padding: 2, background: 'none' }} />
                      <input style={{ ...iStyle2, fontFamily: 'monospace', fontSize: '0.72rem' }} title="Warna Background (Hex)"
                        value={config.background} onChange={e => cfg('background', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Warna Garis</label>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                      <input type="color" value={config.lineColor} onChange={e => cfg('lineColor', e.target.value)} title="Warna Garis (Picker)"
                        style={{ width: 36, height: 32, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', padding: 2, background: 'none' }} />
                      <input style={{ ...iStyle2, fontFamily: 'monospace', fontSize: '0.72rem' }} title="Warna Garis (Hex)"
                        value={config.lineColor} onChange={e => cfg('lineColor', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── BULK TAB ── */}
          {tab === 'bulk' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Import Massal</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                Satu baris = satu barcode.<br/>
                Format: <code style={{ background: 'var(--surface-2)', padding: '0 4px', borderRadius: 4 }}>KODE[Tab]LABEL</code>
              </p>
              <textarea
                rows={8}
                style={{ ...iStyle2, fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }}
                placeholder={'MRA-001\tAsset Laptop\nMRA-002\tAsset Monitor\nMRA-003'}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
              />
              <button type="button" className="btn btn-primary" onClick={importBulk} style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={14} /> Import {bulkText.split('\n').filter(Boolean).length} Item
              </button>
            </div>
          )}

          {/* ── ASSETS TAB ── */}
          {tab === 'assets' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dari Data Aset</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input style={iStyle2} placeholder="Cari kode / nama aset…" title="Cari Aset"
                  value={assetSearch} onChange={e => setAssetSearch(e.target.value)} />
                  
                <select style={iStyle2} value={assetCompany} onChange={e => setAssetCompany(e.target.value)} title="Filter Perusahaan">
                  <option value="">-- Semua Perusahaan --</option>
                  {meta.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <select style={iStyle2} value={assetCategory} onChange={e => setAssetCategory(e.target.value)} title="Filter Kategori">
                  <option value="">-- Semua Kategori --</option>
                  {meta.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filteredAssets.slice(0, 50).map(a => (
                  <button key={a.id} type="button" onClick={() => addFromAsset(a)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.6rem',
                    borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                    <Package size={13} color="var(--blue)" style={{ flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>{a.asset_code}</p>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{a.asset_name}</p>
                    </div>
                    <Plus size={13} color="var(--text-3)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  </button>
                ))}
                {assets.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', textAlign: 'center', padding: '1rem' }}>
                    Memuat data aset…
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT PANEL ══════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn" onClick={addItem}><Plus size={14}/> Tambah Item</button>
            <button type="button" className="btn btn-primary" onClick={printAll}><Printer size={14}/> Print Semua ({items.length})</button>
            <button type="button" className="btn" onClick={downloadSingle}><Download size={14}/> Download SVG</button>
            <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.35rem 0.75rem' }}>
              {items.length} item
            </div>
          </div>

          {/* Item list tabs */}
          {items.length > 1 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {items.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <button type="button" onClick={() => setActiveId(item.id)} style={{
                    padding: '0.3rem 0.7rem', borderRadius: '6px 6px 0 0',
                    border: `1px solid ${activeId === item.id ? 'var(--blue)' : 'var(--border)'}`,
                    borderBottom: activeId === item.id ? '1px solid var(--surface)' : '1px solid var(--border)',
                    background: activeId === item.id ? 'var(--blue-light)' : 'var(--surface-2)',
                    color: activeId === item.id ? 'var(--blue)' : 'var(--text-2)',
                    fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  }}>
                    {item.text.slice(0, 12)}{item.text.length > 12 ? '…' : ''} #{i + 1}
                  </button>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(item.id)} title="Hapus Item" aria-label="Hapus Item" style={{
                      padding: '0.3rem 0.35rem', borderRadius: '0 6px 0 0',
                      border: '1px solid var(--border)', borderLeft: 'none',
                      background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-3)',
                      display: 'flex', alignItems: 'center',
                    }}>
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Preview area */}
          <div className="preview-area" style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
            padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '1rem', minHeight: 220,
            backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}>
            <BarcodePreview item={activeItem} config={config} />
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button type="button" className="btn" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }} title="Salin Teks Barcode"
                onClick={() => copyText(activeItem.text)}>
                {copied === activeItem.text ? <Check size={13} color="var(--emerald)" /> : <Copy size={13} />}
                {copied === activeItem.text ? 'Disalin!' : 'Salin Teks'}
              </button>
            </div>
          </div>

          {/* Print preview grid */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Preview Print — {items.length} item
              </p>
              <button type="button" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }} onClick={printAll}>
                <Printer size={13} /> Print
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
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
