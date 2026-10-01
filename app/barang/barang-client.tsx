'use client'
import { useState, useMemo } from 'react'
import AppNav from '../nav'
import { createItem, updateItem, deleteItem, updateItemStatus } from '../actions'

export type ItemData = {
  id: string
  code: string
  name: string
  category?: string | null
  brand?: string | null
  serial_number?: string | null
  condition: string
  status: 'tersedia' | 'dipinjam' | 'perawatan' | 'hilang'
  notes?: string | null
}

const CATEGORIES = [
  'Kamera',
  'Lensa',
  'Audio',
  'Tripod',
  'Lighting',
  'Kabel & Adaptor',
  'Aksesori',
  'Komputer / ICT',
  'Lainnya',
]

const CONDITIONS = [
  { value: 'baik', label: 'Baik (Normal)' },
  { value: 'sangat baik', label: 'Sangat Baik (Like New)' },
  { value: 'baru', label: 'Baru' },
  { value: 'perlu perhatian', label: 'Perlu Perhatian / Ada Minus' },
]

export default function BarangClient({ initialItems }: { initialItems: ItemData[] }) {
  const [items, setItems] = useState<ItemData[]>(initialItems)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [successMsg, setSuccessMsg] = useState('')

  // Form states for new item
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState(CATEGORIES[0])
  const [formBrand, setFormBrand] = useState('')
  const [formSerial, setFormSerial] = useState('')
  const [formCondition, setFormCondition] = useState('baik')
  const [formNotes, setFormNotes] = useState('')

  // Form states for edit item
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemData | null>(null)
  const [editBusy, setEditBusy] = useState(false)
  const [editErr, setEditErr] = useState('')
  const [editCode, setEditCode] = useState('')
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState(CATEGORIES[0])
  const [editBrand, setEditBrand] = useState('')
  const [editSerial, setEditSerial] = useState('')
  const [editCondition, setEditCondition] = useState('baik')
  const [editStatus, setEditStatus] = useState<'tersedia' | 'dipinjam' | 'perawatan' | 'hilang'>('tersedia')
  const [editNotes, setEditNotes] = useState('')

  // State for delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<ItemData | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteErr, setDeleteErr] = useState('')

  // Counters
  const counts = useMemo(() => {
    return {
      total: items.length,
      tersedia: items.filter((i) => i.status === 'tersedia').length,
      dipinjam: items.filter((i) => i.status === 'dipinjam').length,
      perawatan: items.filter((i) => i.status === 'perawatan').length,
    }
  }, [items])

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const matchCategory = selectedCategory === 'ALL' || i.category === selectedCategory
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        i.code.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        (i.brand && i.brand.toLowerCase().includes(q)) ||
        (i.category && i.category.toLowerCase().includes(q))
      return matchCategory && matchSearch
    })
  }, [items, search, selectedCategory])

  // Handlers for Add Item
  const handleOpenModal = () => {
    setErr('')
    setSuccessMsg('')
    setFormCode('')
    setFormName('')
    setFormCategory(CATEGORIES[0])
    setFormBrand('')
    setFormSerial('')
    setFormCondition('baik')
    setFormNotes('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    if (!busy) setIsModalOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    if (!formCode.trim()) return setErr('Kode barang wajib diisi.')
    if (!formName.trim()) return setErr('Nama barang wajib diisi.')

    setBusy(true)
    const res = await createItem({
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      category: formCategory,
      brand: formBrand.trim() || undefined,
      serialNumber: formSerial.trim() || undefined,
      condition: formCondition,
      notes: formNotes.trim() || undefined,
    })
    setBusy(false)

    if (res.error) {
      setErr(res.error)
      return
    }

    // Append to local state
    const newItem: ItemData = {
      id: crypto.randomUUID(),
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      category: formCategory,
      brand: formBrand.trim() || null,
      serial_number: formSerial.trim() || null,
      condition: formCondition,
      status: 'tersedia',
      notes: formNotes.trim() || null,
    }
    setItems((prev) => [...prev, newItem].sort((a, b) => a.code.localeCompare(b.code)))
    setIsModalOpen(false)
    setSuccessMsg(`Barang "${newItem.code} - ${newItem.name}" berhasil ditambahkan!`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  // Handlers for Edit Item
  const handleOpenEditModal = (item: ItemData) => {
    setEditingItem(item)
    setEditCode(item.code)
    setEditName(item.name)
    setEditCategory(item.category || CATEGORIES[0])
    setEditBrand(item.brand || '')
    setEditSerial(item.serial_number || '')
    setEditCondition(item.condition || 'baik')
    setEditStatus(item.status)
    setEditNotes(item.notes || '')
    setEditErr('')
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    if (!editBusy) {
      setIsEditModalOpen(false)
      setEditingItem(null)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    setEditErr('')
    if (!editCode.trim()) return setEditErr('Kode barang wajib diisi.')
    if (!editName.trim()) return setEditErr('Nama barang wajib diisi.')

    setEditBusy(true)
    const res = await updateItem({
      id: editingItem.id,
      code: editCode.trim().toUpperCase(),
      name: editName.trim(),
      category: editCategory,
      brand: editBrand.trim() || undefined,
      serialNumber: editSerial.trim() || undefined,
      condition: editCondition,
      status: editingItem.status === 'dipinjam' ? 'dipinjam' : editStatus,
      notes: editNotes.trim() || undefined,
    })
    setEditBusy(false)

    if (res.error) {
      setEditErr(res.error)
      return
    }

    const updatedItem: ItemData = {
      ...editingItem,
      code: editCode.trim().toUpperCase(),
      name: editName.trim(),
      category: editCategory,
      brand: editBrand.trim() || null,
      serial_number: editSerial.trim() || null,
      condition: editCondition,
      status: editingItem.status === 'dipinjam' ? 'dipinjam' : editStatus,
      notes: editNotes.trim() || null,
    }

    setItems((prev) =>
      prev
        .map((i) => (i.id === editingItem.id ? updatedItem : i))
        .sort((a, b) => a.code.localeCompare(b.code))
    )
    setIsEditModalOpen(false)
    setEditingItem(null)
    setSuccessMsg(`Barang "${updatedItem.code} - ${updatedItem.name}" berhasil diperbarui!`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  // Handlers for Delete Item
  const handleOpenDeleteModal = (item: ItemData) => {
    setDeletingItem(item)
    setDeleteErr('')
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    if (!deleteBusy) {
      setIsDeleteModalOpen(false)
      setDeletingItem(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return
    setDeleteErr('')
    setDeleteBusy(true)
    const res = await deleteItem(deletingItem.id)
    setDeleteBusy(false)

    if (res.error) {
      setDeleteErr(res.error)
      return
    }

    setItems((prev) => prev.filter((i) => i.id !== deletingItem.id))
    setIsDeleteModalOpen(false)
    setSuccessMsg(`Barang "${deletingItem.code} - ${deletingItem.name}" berhasil dihapus.`)
    setDeletingItem(null)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const handleStatusChange = async (id: string, newStatus: 'tersedia' | 'perawatan') => {
    const res = await updateItemStatus(id, newStatus)
    if (res.error) {
      alert(`Gagal mengubah status: ${res.error}`)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <AppNav />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Inventaris Barang Multimedia
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola, edit, dan tambahkan daftar alat yang siap dipinjamkan
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-900 active:scale-[0.98] transition cursor-pointer self-start sm:self-auto"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Tambah Barang Baru</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Stats Counter Bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Alat</span>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{counts.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3.5 shadow-2xs">
          <span className="text-xs font-semibold text-emerald-700">Tersedia</span>
          <p className="mt-1 text-2xl font-extrabold text-emerald-800">{counts.tersedia}</p>
        </div>
        <div className="rounded-xl border border-teal-200/80 bg-teal-50/60 p-3.5 shadow-2xs">
          <span className="text-xs font-semibold text-teal-800">Sedang Dipinjam</span>
          <p className="mt-1 text-2xl font-extrabold text-teal-900">{counts.dipinjam}</p>
        </div>
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 shadow-2xs">
          <span className="text-xs font-semibold text-amber-800">Perawatan / Rusak</span>
          <p className="mt-1 text-2xl font-extrabold text-amber-900">{counts.perawatan}</p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode barang, nama alat, merk..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-teal-800 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semua
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-800 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      {!filteredItems.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">Tidak ada barang yang cocok</h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Silakan ubah filter kategori atau tambahkan barang baru.
          </p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-900 cursor-pointer"
          >
            + Tambah Barang Baru
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredItems.map((item) => {
            const isAvailable = item.status === 'tersedia'
            const isBorrowed = item.status === 'dipinjam'
            const isMaintenance = item.status === 'perawatan'

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-sm transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      {item.code}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        isAvailable
                          ? 'bg-emerald-100 text-emerald-800'
                          : isBorrowed
                          ? 'bg-teal-100 text-teal-900'
                          : isMaintenance
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isAvailable && '● Tersedia'}
                      {isBorrowed && '● Sedang Dipinjam'}
                      {isMaintenance && '● Perawatan'}
                      {item.status === 'hilang' && '● Hilang'}
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-slate-900 leading-snug">{item.name}</h3>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    {item.category && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                        {item.category}
                      </span>
                    )}
                    {item.brand && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                        {item.brand}
                      </span>
                    )}
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600 capitalize">
                      Kondisi: {item.condition}
                    </span>
                  </div>

                  {item.notes && (
                    <p className="mt-2 text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Card Footer: Serial, Status toggle & Edit/Delete actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">
                      {item.serial_number ? `SN: ${item.serial_number}` : 'Tanpa SN'}
                    </span>

                    {!isBorrowed && (
                      <div>
                        {isAvailable ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.id, 'perawatan')}
                            className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 text-[11px] font-semibold shadow-xs transition active:scale-[0.98] cursor-pointer"
                          >
                            Set Perawatan
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.id, 'tersedia')}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-semibold shadow-xs transition active:scale-[0.98] cursor-pointer"
                          >
                            Set Tersedia
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition active:scale-[0.98] cursor-pointer"
                      title="Edit barang ini"
                    >
                      <svg className="h-3.5 w-3.5 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(item)}
                      disabled={isBorrowed}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs transition active:scale-[0.98] ${
                        isBorrowed
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                      }`}
                      title={isBorrowed ? 'Tidak dapat dihapus saat sedang dipinjam' : 'Hapus barang'}
                    >
                      <svg className={`h-3.5 w-3.5 ${isBorrowed ? 'text-slate-400' : 'text-rose-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL TAMBAH BARANG BARU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Tambah Barang Baru</h2>
                <p className="text-xs text-slate-500">Daftarkan inventaris multimedia ke sistem</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={busy}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Kode Barang <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: CAM-002"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-sm uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                  <span className="text-[10px] text-slate-400">Harus unik (misal: CAM-002, MIC-002)</span>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Nama Barang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Sony Alpha A7 IV Body Only"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Merk / Brand (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="Contoh: Sony, Rode, Benro"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Nomor Seri (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                    placeholder="Contoh: SN98421049"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Kondisi Awal</label>
                <select
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Catatan / Kelengkapan Bawaan (Opsional)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Misal: Termasuk 2 baterai original, strap, dan tas"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              {err && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  {err}
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={busy}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-teal-800 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-900 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
                >
                  {busy ? 'Menyimpan...' : 'Simpan Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT BARANG */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Edit Data Barang</h2>
                <p className="text-xs text-slate-500">Perbarui informasi barang inventaris</p>
              </div>
              <button
                type="button"
                onClick={handleCloseEditModal}
                disabled={editBusy}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Kode Barang <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-sm uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                  <span className="text-[10px] text-slate-400">Harus unik</span>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Nama Barang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Merk / Brand (Opsional)
                  </label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    placeholder="Contoh: Sony, Rode, Benro"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Nomor Seri (Opsional)
                  </label>
                  <input
                    type="text"
                    value={editSerial}
                    onChange={(e) => setEditSerial(e.target.value)}
                    placeholder="Contoh: SN98421049"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Kondisi</label>
                  <select
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Status</label>
                  {editingItem.status === 'dipinjam' ? (
                    <div className="rounded-xl border border-teal-200 bg-teal-50 p-2.5 text-xs font-medium text-teal-800">
                      Sedang Dipinjam (status otomatis kembali via pengembalian)
                    </div>
                  ) : (
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      <option value="tersedia">Tersedia</option>
                      <option value="perawatan">Perawatan / Rusak</option>
                      <option value="hilang">Hilang</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Catatan / Kelengkapan (Opsional)
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Misal: Termasuk 2 baterai original, strap, dan tas"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              {editErr && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  {editErr}
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={editBusy}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editBusy}
                  className="rounded-xl bg-teal-800 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-900 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
                >
                  {editBusy ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {isDeleteModalOpen && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative my-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">Hapus Barang?</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Barang berikut akan dihapus secara permanen dari daftar inventaris:
                </p>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                  <p className="font-mono font-bold text-teal-800">{deletingItem.code}</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{deletingItem.name}</p>
                  {deletingItem.category && (
                    <p className="mt-1 text-slate-500">Kategori: {deletingItem.category}</p>
                  )}
                </div>

                <p className="mt-3 text-[11px] text-red-600 font-medium">
                  Perhatian: Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            {deleteErr && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {deleteErr}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleteBusy}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteBusy}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
              >
                {deleteBusy ? 'Menghapus...' : 'Ya, Hapus Barang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

