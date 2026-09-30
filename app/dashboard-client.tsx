'use client'
import { useState } from 'react'
import Link from 'next/link'
import ReturnModal from './return-modal'
import AppNav from './nav'

export type LoanData = {
  id: string
  borrower_name: string
  borrower_department: string
  borrower_phone: string
  due_date: string
  signature_out_url?: string | null
  loan_items: {
    items: {
      code: string
      name: string
    }
  }[]
  notesData?: any
  photoOutSignedUrl?: string | null
}

export default function DashboardClient({
  initialLoans,
  today,
}: {
  initialLoans: LoanData[]
  today: string
}) {
  const [activeReturnLoan, setActiveReturnLoan] = useState<any | null>(null)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null)

  const hasLoans = initialLoans && initialLoans.length > 0

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <AppNav />

      {/* Top Header */}

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-800 text-white shadow-xs">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Peminjaman Multimedia
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Pencatatan & pemantauan alat multimedia gereja
              </p>
            </div>
          </div>
        </div>

        {/* BUTTON DI POJOK KANAN ATAS (Hanya tampil jika ada barang yang dipinjam) */}
        {hasLoans && (
          <Link
            href="/pinjam"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm sm:text-base font-semibold text-white shadow-md hover:bg-teal-900 active:scale-[0.98] transition cursor-pointer self-start sm:self-auto"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Pinjam Barang</span>
          </Link>
        )}
      </header>

      {/* JIKA TIDAK ADA BARANG YANG DIPINJAM: TAMPILKAN EMPTY STATE DENGAN BUTTON DI TENGAH */}
      {!hasLoans ? (
        <section className="mt-8 flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-xs">
          <div className="relative mb-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-teal-50 text-teal-800 shadow-inner border border-teal-100">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-4 ring-white text-xs font-bold">
              ✓
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            Tidak Ada Barang yang Sedang Dipinjam
          </h2>
          <p className="mt-2 max-w-md text-sm sm:text-base text-slate-500 leading-relaxed">
            Semua peralatan multimedia saat ini tersedia lengkap di tempat penyimpanan. Siap digunakan untuk ibadah & kegiatan mendatang.
          </p>

          {/* BUTTON DI TENGAH HALAMAN */}
          <div className="mt-8">
            <Link
              href="/pinjam"
              className="inline-flex items-center gap-3 rounded-2xl bg-teal-800 px-8 py-4 text-base sm:text-lg font-bold text-white shadow-lg shadow-teal-900/15 hover:bg-teal-900 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700/80">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span>Buat Laporan Peminjaman Baru</span>
            </Link>
          </div>
        </section>
      ) : (
        /* DAFTAR BARANG YANG SEDANG DIPINJAM */
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span>Daftar Peminjaman Aktif</span>
              <span className="rounded-full bg-teal-100 text-teal-900 px-2.5 py-0.5 text-xs font-bold">
                {initialLoans.length}
              </span>
            </h2>
            <span className="text-xs text-slate-500">
              Hari ini: {today}
            </span>
          </div>

          <ul className="space-y-4">
            {initialLoans.map((l) => {
              const late = l.due_date < today
              const itemsList = l.loan_items.map((li) => `${li.items.code} - ${li.items.name}`)
              const itemsText = itemsList.join(', ')

              // Format whatsapp link with polite reminder text
              const rawPhone = l.borrower_phone.replace(/\D/g, '').replace(/^0/, '62')
              const waText = encodeURIComponent(
                `Halo ${l.borrower_name}, salam dari Tim Multimedia. Mengingatkan mengenai peminjaman alat (${itemsText}) dengan batas waktu ${l.due_date}. Mohon konfirmasi saat hendak dikembalikan ya. Terima kasih!`
              )
              const waUrl = `https://wa.me/${rawPhone}?text=${waText}`

              return (
                <li
                  key={l.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Loan info */}
                    <div className="flex-1 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">{l.borrower_name}</span>
                        <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {l.borrower_department}
                        </span>
                        {late ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 animate-pulse">
                            ⚠️ Terlambat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                            Aktif
                          </span>
                        )}
                      </div>

                      {/* Items */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {l.loan_items.map((li, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-lg border border-teal-200 bg-teal-50/70 px-2.5 py-1 text-xs font-medium text-teal-900"
                          >
                            <span className="font-bold mr-1">{li.items.code}</span> {li.items.name}
                          </span>
                        ))}
                      </div>

                      {/* Due date info */}
                      <p className={`flex items-center gap-1.5 text-xs sm:text-sm ${late ? 'font-semibold text-red-700' : 'text-slate-600'}`}>
                        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {late ? 'Jatuh tempo terlewat pada: ' : 'Batas kembali: '}
                          <span className="font-medium underline decoration-dotted">{l.due_date}</span>
                        </span>
                      </p>

                      {/* Pre-loan inspection details & photo preview button */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {l.photoOutSignedUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoUrl(l.photoOutSignedUrl!)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 hover:bg-teal-100 transition cursor-pointer"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Lihat Foto Sebelum Dipinjam</span>
                          </button>
                        )}
                        {l.notesData?.checklist_out?.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            ✓ {l.notesData.checklist_out.length} poin kondisi awal diverifikasi
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons (WhatsApp Modern & Kembalikan Barang) */}
                    <div className="flex flex-col sm:flex-col gap-2.5 sm:items-end justify-center pt-2 sm:pt-0">
                      {/* BUTTON WHATSAPP MODERN DENGAN LOGO */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#20ba5a] hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                      >
                        <svg className="h-4 w-4 fill-white shrink-0" viewBox="0 0 24 24">
                          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.16 7.42C8.98 7.42 8.7 7.49 8.46 7.75C8.22 8.01 7.55 8.64 7.55 9.93C7.55 11.22 8.48 12.46 8.61 12.64C8.74 12.82 10.45 15.45 13.06 16.58C13.68 16.85 14.16 17.01 14.54 17.13C15.17 17.33 15.74 17.3 16.19 17.23C16.69 17.16 17.72 16.61 17.93 16.02C18.14 15.43 18.14 14.92 18.08 14.82C18.02 14.72 17.85 14.66 17.6 14.53C17.35 14.41 16.13 13.81 15.9 13.73C15.67 13.65 15.51 13.61 15.34 13.86C15.17 14.11 14.7 14.66 14.55 14.83C14.41 15.01 14.26 15.03 14.01 14.9C13.76 14.78 12.97 14.52 12.03 13.68C11.3 13.03 10.8 12.22 10.66 11.97C10.51 11.72 10.64 11.59 10.77 11.46C10.88 11.35 11.02 11.17 11.15 11.02C11.28 10.87 11.32 10.76 11.41 10.59C11.49 10.42 11.45 10.28 11.39 10.15C11.33 10.02 10.83 8.8 10.63 8.3C10.42 7.82 10.22 7.88 10.06 7.88C9.91 7.87 9.74 7.87 9.56 7.87C9.39 7.87 9.21 7.9 9.16 7.42Z" />
                        </svg>
                        <span>Hubungi via WhatsApp</span>
                      </a>

                      {/* Tombol Proses Pengembalian (Membuka Modal Ceklist & Foto) */}
                      <button
                        type="button"
                        onClick={() =>
                          setActiveReturnLoan({
                            id: l.id,
                            borrower_name: l.borrower_name,
                            borrower_department: l.borrower_department,
                            due_date: l.due_date,
                            itemsText,
                            photoOutSignedUrl: l.photoOutSignedUrl,
                            notesData: l.notesData,
                          })
                        }
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-teal-800 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-teal-900 hover:bg-teal-50 active:bg-teal-100 transition cursor-pointer"
                      >
                        <svg className="h-4 w-4 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Tandai Kembali</span>
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* MODAL RETURN WITH CHECKLIST & PHOTO */}
      {activeReturnLoan && (
        <ReturnModal
          loan={activeReturnLoan}
          onClose={() => setActiveReturnLoan(null)}
          onSuccess={() => {
            setActiveReturnLoan(null)
            window.location.reload()
          }}
        />
      )}

      {/* PREVIEW MODAL FOR PRE-LOAN PHOTO */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div
            className="relative max-w-lg rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Foto Kondisi Sebelum Dipinjam</h3>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhotoUrl}
              alt="Bukti foto kondisi barang"
              className="mt-3 max-h-[70vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </main>
  )
}
