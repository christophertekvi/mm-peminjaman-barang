'use client'
import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createLoan } from '../actions'

const DEPTS = ['PAW', 'EagleKidz', 'AOG', 'MRI', 'Pastoral', 'TPG', 'Communication', 
  'HC', 'Asia', 'STT', 'Pendoa', 'Edukasi', 'FLC', 'ICT', 'Fas Service', 'Sound', 'MSP', 'Production', 'Secretary']
const field = 'w-full rounded-xl border border-slate-300 bg-white p-3.5 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-teal-700 transition'

const PRE_LOAN_CHECKLIST = [
  { id: 'fisik', label: 'Fisik & Casing: Bersih, utuh, tidak retak / pecah' },
  { id: 'tombol', label: 'Tombol & Kontrol: Semua switch, dial, tombol berfungsi normal' },
  { id: 'lensa', label: 'Lensa & Layar: Kaca optik / display jernih bebas goresan' },
  { id: 'kelengkapan', label: 'Kabel & Aksesori: Kabel data/power, adaptor, baterai lengkap' },
  { id: 'daya', label: 'Uji Fungsi: Daya hidup normal & perangkat berfungsi baik' },
]

export default function LoanForm({ items }: { items: { id: string; code: string; name: string }[] }) {
  const router = useRouter()
  const cv = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const drawing = useRef(false)
  const signed = useRef(false)

  const [picked, setPicked] = useState<string[]>([])
  const [checklist, setChecklist] = useState<string[]>(PRE_LOAN_CHECKLIST.map((c) => c.label))
  const [photoData, setPhotoData] = useState<string | null>(null)
  const [photoName, setPhotoName] = useState<string>('')
  const [notesOut, setNotesOut] = useState<string>('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const c = cv.current
    if (!c) return
    const r = c.getBoundingClientRect()
    const d = window.devicePixelRatio || 1
    c.width = r.width * d
    c.height = r.height * d
    const x = c.getContext('2d')
    if (x) {
      x.scale(d, d)
      x.lineWidth = 2.5
      x.lineCap = 'round'
      x.strokeStyle = '#0f172a'
    }
  }, [])

  const at = (e: React.PointerEvent) => {
    const r = cv.current!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  const down = (e: React.PointerEvent) => {
    drawing.current = true
    cv.current!.setPointerCapture(e.pointerId)
    const x = cv.current!.getContext('2d')!
    x.beginPath()
    x.moveTo(...(at(e) as [number, number]))
  }

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const x = cv.current!.getContext('2d')!
    x.lineTo(...(at(e) as [number, number]))
    x.stroke()
    signed.current = true
  }

  const clear = () => {
    const c = cv.current!
    const x = c.getContext('2d')!
    x.clearRect(0, 0, c.width, c.height)
    signed.current = false
  }

  const toggleChecklist = (label: string) => {
    setChecklist((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    )
  }

  const selectAllChecklist = () => {
    setChecklist(PRE_LOAN_CHECKLIST.map((c) => c.label))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Compress image using canvas before storing to keep payload lightweight
        const maxDim = 1280
        let w = img.width
        let h = img.height
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w)
            w = maxDim
          } else {
            w = Math.round((w * maxDim) / h)
            h = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, w, h)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82)
        setPhotoData(compressedBase64)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setPhotoData(null)
    setPhotoName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function submit(fd: FormData) {
    setErr('')
    if (!picked.length) return setErr('Pilih minimal satu barang yang akan dipinjam.')
    if (!signed.current) return setErr('Tanda tangan dulu di kotak yang tersedia.')

    setBusy(true)
    const res = await createLoan({
      name: String(fd.get('name')).trim(),
      dept: String(fd.get('dept')),
      phone: String(fd.get('phone')).trim(),
      due: String(fd.get('due')),
      itemIds: picked,
      signature: cv.current!.toDataURL('image/png'),
      checklistOut: checklist,
      photoOut: photoData || undefined,
      notesOut: notesOut.trim() || undefined,
    })
    setBusy(false)

    if (res.error) return setErr(`Gagal menyimpan: ${res.error}`)
    router.push('/')
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Beranda
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
          Form Peminjaman
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-bold text-slate-900">Buat Laporan Peminjaman Barang</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pastikan seluruh kelengkapan & kondisi alat diperiksa bersama peminjam sebelum diserahkan.
          </p>
        </div>

        <form action={submit} className="mt-6 space-y-6">
          {/* Section 1: Item Selection */}
          <fieldset>
            <legend className="mb-2.5 font-semibold text-slate-800 flex items-center justify-between w-full">
              <span>1. Pilih Barang yang Dipinjam</span>
              <span className="text-xs font-normal text-slate-500">
                {picked.length} dipilih
              </span>
            </legend>
            {!items.length ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Tidak ada barang berstatus tersedia saat ini.
              </div>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {items.map((i) => {
                  const on = picked.includes(i.id)
                  return (
                    <button
                      type="button"
                      key={i.id}
                      aria-pressed={on}
                      onClick={() =>
                        setPicked(on ? picked.filter((p) => p !== i.id) : [...picked, i.id])
                      }
                      className={`group relative flex items-center justify-between rounded-xl border p-3.5 text-left transition ${
                        on
                          ? 'border-teal-700 bg-teal-800 text-white shadow-sm'
                          : 'border-slate-300 bg-slate-50/60 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="pr-2">
                        <span className={`block font-mono text-xs font-bold uppercase tracking-wider ${on ? 'text-teal-200' : 'text-teal-800'}`}>
                          {i.code}
                        </span>
                        <span className="font-medium text-sm sm:text-base leading-snug">{i.name}</span>
                      </div>
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                          on ? 'border-teal-300 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {on && (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </fieldset>

          {/* Section 2: Borrower Information */}
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-800">2. Identitas Peminjam</h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nama Lengkap</label>
              <input name="name" required placeholder="Contoh: Budi Santoso" className={field} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Departemen / Bidang</label>
                <select name="dept" required defaultValue="" className={field}>
                  <option value="" disabled>
                    Pilih departemen
                  </option>
                  {DEPTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nomor WhatsApp</label>
                <input
                  name="phone"
                  required
                  type="tel"
                  inputMode="tel"
                  placeholder="08123456789"
                  className={field}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal Pengembalian (Jatuh Tempo)</label>
              <input
                name="due"
                required
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                className={field}
              />
            </div>
          </div>

          {/* Section 3: Checklist Kondisi Sebelum Dipinjam */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-slate-900">3. Cek Kondisi Sebelum Dipinjam</h2>
                <p className="text-xs text-slate-500">Periksa bersama peminjam saat barang diserahkan</p>
              </div>
              <button
                type="button"
                onClick={selectAllChecklist}
                className="text-xs font-semibold text-teal-800 hover:text-teal-900 hover:underline cursor-pointer"
              >
                Pilih Semua Baik ✓
              </button>
            </div>

            <div className="space-y-2.5">
              {PRE_LOAN_CHECKLIST.map((c) => {
                const checked = checklist.includes(c.label)
                return (
                  <label
                    key={c.id}
                    onClick={() => toggleChecklist(c.label)}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition select-none ${
                      checked
                        ? 'border-teal-300 bg-teal-50/60 text-slate-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}} // handled by parent label click
                      className="mt-0.5 h-4 w-4 rounded-sm border-slate-300 text-teal-800 focus:ring-teal-700"
                    />
                    <span className="text-sm font-medium leading-tight">{c.label}</span>
                  </label>
                )
              })}
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Catatan Tambahan Kondisi Sebelum Dipinjam (Opsional)
              </label>
              <input
                type="text"
                value={notesOut}
                onChange={(e) => setNotesOut(e.target.value)}
                placeholder="Misal: Termasuk 2 baterai original, strap terpasang, ada goresan kecil di tutup..."
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>
          </div>

          {/* Section 4: Foto Barang Sebelum Dipinjam */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="mb-3">
              <h2 className="font-semibold text-slate-900">4. Foto Barang Sebelum Dipinjam</h2>
              <p className="text-xs text-slate-500">Ambil foto kondisi fisik barang saat diserahkan sebagai bukti visual</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-before-upload"
            />

            {!photoData ? (
              <label
                htmlFor="photo-before-upload"
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-teal-700/30 bg-teal-50/40 p-6 text-center hover:bg-teal-50/70 transition"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-800">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="mt-3 text-sm font-semibold text-teal-900">
                  Ambil Foto Kamera / Unggah Foto
                </span>
                <span className="mt-1 text-xs text-slate-500">Format JPG, PNG atau WebP</span>
              </label>
            ) : (
              <div className="relative rounded-xl border border-slate-300 bg-white p-3">
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoData}
                    alt="Preview foto barang sebelum dipinjam"
                    className="h-28 w-28 rounded-lg object-cover border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{photoName || 'Foto kondisi awal'}</p>
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">✓ Foto siap disimpan</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Ganti Foto
                      </button>
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Tanda Tangan */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">5. Tanda Tangan Peminjam</span>
                <p className="text-xs text-slate-500">Tanda tangan langsung pada area kanvas di bawah</p>
              </div>
              <button
                type="button"
                onClick={clear}
                className="rounded-lg px-3 py-1 text-xs font-medium text-teal-900 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition cursor-pointer"
              >
                Hapus & Ulangi
              </button>
            </div>
            <canvas
              ref={cv}
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={() => (drawing.current = false)}
              className="h-44 w-full cursor-crosshair rounded-xl border border-slate-300 bg-slate-50/40 shadow-inner"
              style={{ touchAction: 'none' }}
            />
          </div>

          {err && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 flex items-center gap-2">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{err}</span>
            </div>
          )}

          <button
            disabled={busy}
            className="w-full rounded-xl bg-teal-800 p-4 text-lg font-semibold text-white shadow-md hover:bg-teal-900 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer"
          >
            {busy ? 'Menyimpan Data Peminjaman...' : 'Simpan Laporan Peminjaman'}
          </button>
        </form>
      </div>
    </main>
  )
}
