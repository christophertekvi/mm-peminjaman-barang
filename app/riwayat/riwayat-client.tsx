'use client'
import { useState, useMemo } from 'react'
import AppNav from '../nav'

export type CompletedLoanData = {
  id: string
  borrower_name: string
  borrower_department: string
  borrower_phone: string
  loan_date: string
  due_date: string
  return_date: string | null
  signatureSignedUrl?: string | null
  photoOutSignedUrl?: string | null
  photoInSignedUrl?: string | null
  notesData?: any
  loan_items: {
    condition_out?: string | null
    condition_in?: string | null
    items: {
      code: string
      name: string
      category?: string | null
    }
  }[]
}

export default function RiwayatClient({ loans }: { loans: CompletedLoanData[] }) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<CompletedLoanData | null>(null)

  // Get unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>()
    loans.forEach((l) => {
      if (l.borrower_department) set.add(l.borrower_department)
    })
    return Array.from(set).sort()
  }, [loans])

  // Filtered loans
  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      const matchDept = deptFilter === 'ALL' || l.borrower_department === deptFilter
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        l.borrower_name.toLowerCase().includes(q) ||
        l.borrower_phone.includes(q) ||
        l.borrower_department.toLowerCase().includes(q) ||
        l.loan_items.some(
          (li) =>
            li.items?.code.toLowerCase().includes(q) ||
            li.items?.name.toLowerCase().includes(q)
        )
      return matchDept && matchSearch
    })
  }, [loans, search, deptFilter])

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <AppNav />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Riwayat Peminjaman Selesai
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Arsip seluruh peralatan multimedia yang telah dikembalikan & diperiksa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs">
            Total Selesai: <span className="text-teal-800 font-extrabold">{loans.length}</span>
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari peminjam, barang, nomor telepon..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700 transition"
        >
          <option value="ALL">Semua Departemen</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* History List */}
      {!filteredLoans.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">
            {loans.length === 0 ? 'Belum Ada Riwayat Peminjaman' : 'Tidak Ditemukan Riwayat yang Cocok'}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {loans.length === 0
              ? 'Barang yang telah dikembalikan akan tersimpan otomatis di halaman riwayat ini.'
              : 'Coba ubah kata kunci pencarian atau filter departemen.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredLoans.map((l) => {
            const itemsList = l.loan_items.map((li) => `${li.items?.code} ${li.items?.name}`)
            const itemsText = itemsList.join(', ')

            // WhatsApp link
            const rawPhone = l.borrower_phone.replace(/\D/g, '').replace(/^0/, '62')
            const waText = encodeURIComponent(
              `Halo ${l.borrower_name}, terima kasih telah mengembalikan peralatan multimedia (${itemsText}) dengan baik. Sukses untuk pelayanannya!`
            )
            const waUrl = `https://wa.me/${rawPhone}?text=${waText}`

            return (
              <li
                key={l.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Info details */}
                  <div className="flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold text-slate-900">{l.borrower_name}</span>
                      <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {l.borrower_department}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        ✓ Selesai
                      </span>
                    </div>

                    {/* Items chips */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {l.loan_items.map((li, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800"
                        >
                          <span className="font-bold text-teal-800 mr-1">{li.items?.code}</span>
                          <span>{li.items?.name}</span>
                        </span>
                      ))}
                    </div>

                    {/* Timeline dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/70">
                      <div>
                        <span className="text-slate-400 block">Tanggal Pinjam:</span>
                        <span className="font-semibold text-slate-700">{l.loan_date || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Dikembalikan Pada:</span>
                        <span className="font-semibold text-emerald-700">{l.return_date || '-'}</span>
                      </div>
                    </div>

                    {/* Photos Preview Section (Before & After) */}
                    {(l.photoOutSignedUrl || l.photoInSignedUrl) && (
                      <div className="pt-1 flex flex-wrap items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Foto Bukti:
                        </span>
                        {l.photoOutSignedUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewPhoto({
                                url: l.photoOutSignedUrl!,
                                title: `Foto Sebelum Dipinjam - ${l.borrower_name}`,
                              })
                            }
                            className="group flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1 pr-2 text-xs font-medium text-slate-700 hover:border-teal-700 transition cursor-pointer"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={l.photoOutSignedUrl}
                              alt="Sebelum"
                              className="h-7 w-7 rounded-sm object-cover border border-slate-200"
                            />
                            <span>Sebelum Dipinjam 🔍</span>
                          </button>
                        )}
                        {l.photoInSignedUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewPhoto({
                                url: l.photoInSignedUrl!,
                                title: `Foto Setelah Dikembalikan - ${l.borrower_name}`,
                              })
                            }
                            className="group flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 p-1 pr-2 text-xs font-medium text-emerald-800 hover:border-emerald-600 transition cursor-pointer"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={l.photoInSignedUrl}
                              alt="Setelah"
                              className="h-7 w-7 rounded-sm object-cover border border-emerald-200"
                            />
                            <span>Setelah Kembali 🔍</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions & WhatsApp button */}
                  <div className="flex flex-col sm:flex-col gap-2 sm:items-end justify-center pt-2 sm:pt-0">
                    {/* Modern WhatsApp Button with Logo */}
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#20ba5a] hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                    >
                      <svg className="h-4 w-4 fill-white shrink-0" viewBox="0 0 24 24">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.16 7.42C8.98 7.42 8.7 7.49 8.46 7.75C8.22 8.01 7.55 8.64 7.55 9.93C7.55 11.22 8.48 12.46 8.61 12.64C8.74 12.82 10.45 15.45 13.06 16.58C13.68 16.85 14.16 17.01 14.54 17.13C15.17 17.33 15.74 17.3 16.19 17.23C16.69 17.16 17.72 16.61 17.93 16.02C18.14 15.43 18.14 14.92 18.08 14.82C18.02 14.72 17.85 14.66 17.6 14.53C17.35 14.41 16.13 13.81 15.9 13.73C15.67 13.65 15.51 13.61 15.34 13.86C15.17 14.11 14.7 14.66 14.55 14.83C14.41 15.01 14.26 15.03 14.01 14.9C13.76 14.78 12.97 14.52 12.03 13.68C11.3 13.03 10.8 12.22 10.66 11.97C10.51 11.72 10.64 11.59 10.77 11.46C10.88 11.35 11.02 11.17 11.15 11.02C11.28 10.87 11.32 10.76 11.41 10.59C11.49 10.42 11.45 10.28 11.39 10.15C11.33 10.02 10.83 8.8 10.63 8.3C10.42 7.82 10.22 7.88 10.06 7.88C9.91 7.87 9.74 7.87 9.56 7.87C9.39 7.87 9.21 7.9 9.16 7.42Z" />
                      </svg>
                      <span>Hubungi WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedDetail(l)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Lihat Detail Laporan</span>
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* MODAL DETAIL PEMERIKSAAN LENGKAP */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Laporan Lengkap
                </span>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Detail Pengembalian: {selectedDetail.borrower_name}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedDetail.borrower_department} • No: {selectedDetail.borrower_phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-sm">
              {/* Items */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Barang yang Dipinjam</p>
                <div className="mt-1.5 space-y-1.5">
                  {selectedDetail.loan_items.map((li, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
                      <span className="font-bold text-teal-800">{li.items?.code}</span> - {li.items?.name}
                      {li.condition_in && (
                        <p className="mt-0.5 text-slate-600 text-[11px]">Kondisi saat kembali: {li.condition_in}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Photos Comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Foto Sebelum Dipinjam</p>
                  {selectedDetail.photoOutSignedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedDetail.photoOutSignedUrl}
                      alt="Sebelum dipinjam"
                      onClick={() =>
                        setPreviewPhoto({
                          url: selectedDetail.photoOutSignedUrl!,
                          title: 'Foto Sebelum Dipinjam',
                        })
                      }
                      className="h-32 w-full rounded-lg object-cover cursor-pointer hover:opacity-90"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                      Tidak ada foto awal
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Foto Setelah Dikembalikan</p>
                  {selectedDetail.photoInSignedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedDetail.photoInSignedUrl}
                      alt="Setelah dikembalikan"
                      onClick={() =>
                        setPreviewPhoto({
                          url: selectedDetail.photoInSignedUrl!,
                          title: 'Foto Setelah Dikembalikan',
                        })
                      }
                      className="h-32 w-full rounded-lg object-cover cursor-pointer hover:opacity-90"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                      Tidak ada foto kembali
                    </div>
                  )}
                </div>
              </div>

              {/* Checklist Detail */}
              {selectedDetail.notesData?.checklist_out?.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    ✓ Pemeriksaan Awal Sebelum Dipinjam
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {selectedDetail.notesData.checklist_out.map((c: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-teal-700 font-bold">✓</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                  {selectedDetail.notesData?.notes_out && (
                    <p className="mt-2 text-xs italic text-slate-500 border-t border-slate-200 pt-1.5">
                      Catatan awal: "{selectedDetail.notesData.notes_out}"
                    </p>
                  )}
                </div>
              )}

              {selectedDetail.notesData?.checklist_in?.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                    ✓ Pemeriksaan Akhir Saat Dikembalikan
                  </p>
                  <ul className="space-y-1 text-xs text-emerald-900">
                    {selectedDetail.notesData.checklist_in.map((c: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                  {selectedDetail.notesData?.notes_in && (
                    <p className="mt-2 text-xs italic text-slate-600 border-t border-emerald-200/80 pt-1.5">
                      Catatan kembali: "{selectedDetail.notesData.notes_in}"
                    </p>
                  )}
                </div>
              )}

              {/* Tanda tangan peminjam */}
              {selectedDetail.signatureSignedUrl && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Tanda Tangan Peminjam (Saat Serah Terima)
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedDetail.signatureSignedUrl}
                    alt="Tanda tangan peminjam"
                    className="h-24 w-full rounded-lg object-contain bg-slate-50 border border-slate-200"
                  />
                </div>
              )}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-3 text-right">
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-900 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW MODAL */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-xl w-full rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">{previewPhoto.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhoto.url}
              alt="Bukti foto"
              className="mt-3 max-h-[75vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </main>
  )
}
