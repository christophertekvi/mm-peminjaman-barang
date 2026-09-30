'use client'
import { useState, useRef } from 'react'
import { completeReturnLoan } from './actions'

const POST_LOAN_CHECKLIST = [
  { id: 'fisik', label: 'Fisik & Casing: Utuh, bersih, tidak ada retak / lecet baru' },
  { id: 'tombol', label: 'Tombol & Kontrol: Semua tombol, switch & port normal' },
  { id: 'lensa', label: 'Lensa & Layar: Bersih dari kotoran & tanpa goresan baru' },
  { id: 'kelengkapan', label: 'Kelengkapan: Kabel, adaptor, baterai & wadah lengkap' },
  { id: 'daya', label: 'Uji Fungsi: Alat berfungsi normal & dimatikan dengan aman' },
]

type ReturnModalProps = {
  loan: {
    id: string
    borrower_name: string
    borrower_department: string
    due_date: string
    itemsText: string
    photoOutSignedUrl?: string | null
    notesData?: any
  }
  onClose: () => void
  onSuccess: () => void
}

export default function ReturnModal({ loan, onClose, onSuccess }: ReturnModalProps) {
  const [checklist, setChecklist] = useState<string[]>(POST_LOAN_CHECKLIST.map((c) => c.label))
  const [photoData, setPhotoData] = useState<string | null>(null)
  const [photoName, setPhotoName] = useState<string>('')
  const [notesIn, setNotesIn] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleChecklist = (label: string) => {
    setChecklist((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    )
  }

  const selectAll = () => {
    setChecklist(POST_LOAN_CHECKLIST.map((c) => c.label))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
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

  const handleConfirm = async () => {
    setErr('')
    setBusy(true)
    const res = await completeReturnLoan({
      id: loan.id,
      checklistIn: checklist,
      photoIn: photoData || undefined,
      notesIn: notesIn.trim() || undefined,
    })
    setBusy(false)

    if (res.error) {
      setErr(res.error)
      return
    }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-8 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Pemeriksaan Pengembalian
            </span>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Konfirmasi Pengembalian Barang</h2>
            <p className="text-sm text-slate-600">
              Peminjam: <span className="font-semibold text-slate-800">{loan.borrower_name}</span> ({loan.borrower_department})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-4 max-h-[72vh] overflow-y-auto pr-1">
          {/* Item details */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Daftar Barang Dikembalikan</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{loan.itemsText}</p>
          </div>

          {/* Reference: Pre-loan photo if available */}
          {loan.photoOutSignedUrl && (
            <div className="rounded-xl border border-teal-200/80 bg-teal-50/50 p-3.5">
              <p className="text-xs font-semibold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Foto Referensi Saat Sebelum Dipinjam
              </p>
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={loan.photoOutSignedUrl}
                  alt="Kondisi sebelum dipinjam"
                  className="h-20 w-20 rounded-lg object-cover border border-teal-200 shadow-xs"
                />
                <div className="text-xs text-slate-600">
                  <p className="font-medium text-slate-800">Foto bukti awal saat barang diambil</p>
                  <p className="text-slate-500 mt-0.5">Bandingkan kondisi barang sekarang dengan foto awal ini.</p>
                </div>
              </div>
            </div>
          )}

          {/* Checklist Setelah Dipinjam */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-900">Cek List Kondisi Setelah Dipinjam</h3>
                <p className="text-xs text-slate-500">Periksa kondisi barang yang baru dikembalikan</p>
              </div>
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-semibold text-teal-800 hover:text-teal-900 hover:underline cursor-pointer"
              >
                Pilih Semua Baik ✓
              </button>
            </div>

            <div className="space-y-2">
              {POST_LOAN_CHECKLIST.map((c) => {
                const checked = checklist.includes(c.label)
                return (
                  <label
                    key={c.id}
                    onClick={() => toggleChecklist(c.label)}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition select-none ${
                      checked
                        ? 'border-teal-300 bg-teal-50/70 text-slate-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="mt-0.5 h-4 w-4 rounded-sm border-slate-300 text-teal-800 focus:ring-teal-700"
                    />
                    <span className="text-xs sm:text-sm font-medium leading-tight">{c.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Foto Barang Setelah Dipinjam */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-2.5">
              <h3 className="font-semibold text-sm text-slate-900">Foto Barang Setelah Dipinjam</h3>
              <p className="text-xs text-slate-500">Ambil atau unggah foto kondisi barang saat ini sebagai bukti pengembalian</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-return-upload"
            />

            {!photoData ? (
              <label
                htmlFor="photo-return-upload"
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-teal-700/30 bg-teal-50/40 p-4 text-center hover:bg-teal-50/80 transition"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-800">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="mt-2 text-xs font-semibold text-teal-900">
                  Ambil Foto Kamera / Unggah Foto Bukti Kembali
                </span>
                <span className="mt-0.5 text-[11px] text-slate-500">Opsional namun sangat disarankan</span>
              </label>
            ) : (
              <div className="relative rounded-xl border border-slate-300 bg-white p-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoData}
                    alt="Preview foto setelah dipinjam"
                    className="h-20 w-20 rounded-lg object-cover border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium text-slate-800">{photoName || 'Foto kondisi kembali'}</p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">✓ Foto siap dilampirkan</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Ganti
                      </button>
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Catatan Pengembalian */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Catatan Pengembalian (Opsional)
            </label>
            <input
              type="text"
              value={notesIn}
              onChange={(e) => setNotesIn(e.target.value)}
              placeholder="Contoh: Baterai sisa 40%, ada sedikit debu di tas..."
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              {err}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-900 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
          >
            {busy ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Selesaikan Pengembalian</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
