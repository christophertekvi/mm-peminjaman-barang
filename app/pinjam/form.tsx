'use client'
import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLoan } from '../actions'

const DEPTS = ['Worship', 'Kids', 'Youth', 'Media', 'Umum', 'Lainnya']
const field = 'w-full rounded-xl border border-slate-300 bg-white p-4 text-lg'

export default function LoanForm({ items }: { items: { id: string; code: string; name: string }[] }) {
  const router = useRouter()
  const cv = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const signed = useRef(false)
  const [picked, setPicked] = useState<string[]>([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const c = cv.current!, r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1
    c.width = r.width * d
    c.height = r.height * d
    const x = c.getContext('2d')!
    x.scale(d, d)
    x.lineWidth = 2.5
    x.lineCap = 'round'
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
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    signed.current = false
  }

  async function submit(fd: FormData) {
    setErr('')
    if (!picked.length) return setErr('Pilih minimal satu barang.')
    if (!signed.current) return setErr('Tanda tangan dulu di kotak yang tersedia.')
    setBusy(true)
    const res = await createLoan({
      name: String(fd.get('name')).trim(),
      dept: String(fd.get('dept')),
      phone: String(fd.get('phone')).trim(),
      due: String(fd.get('due')),
      itemIds: picked,
      signature: cv.current!.toDataURL('image/png'),
    })
    setBusy(false)
    if (res.error) return setErr(`Gagal menyimpan: ${res.error}`)
    router.push('/')
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Pinjam barang</h1>
      <form action={submit} className="mt-6 space-y-6">
        <fieldset>
          <legend className="mb-2 font-medium">Barang yang dipinjam</legend>
          {!items.length && <p className="text-slate-600">Tidak ada barang tersedia.</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((i) => {
              const on = picked.includes(i.id)
              return (
                <button type="button" key={i.id} aria-pressed={on}
                  onClick={() => setPicked(on ? picked.filter((p) => p !== i.id) : [...picked, i.id])}
                  className={`rounded-xl border p-4 text-left text-lg ${on ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-300 bg-white'}`}>
                  <span className="font-medium">{i.code}</span> {i.name}
                </button>
              )
            })}
          </div>
        </fieldset>

        <input name="name" required placeholder="Nama peminjam" className={field} />
        <select name="dept" required defaultValue="" className={field}>
          <option value="" disabled>Pilih departemen</option>
          {DEPTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <input name="phone" required type="tel" inputMode="tel" placeholder="Nomor WhatsApp" className={field} />
        <label className="block">
          <span className="mb-2 block font-medium">Tanggal kembali</span>
          <input name="due" required type="date" min={new Date().toISOString().slice(0, 10)} className={field} />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium">Tanda tangan peminjam</span>
            <button type="button" onClick={clear} className="rounded-lg px-3 py-2 text-teal-900 underline">Hapus</button>
          </div>
          <canvas ref={cv} onPointerDown={down} onPointerMove={move} onPointerUp={() => (drawing.current = false)}
            className="h-52 w-full rounded-xl border border-slate-400 bg-white" style={{ touchAction: 'none' }} />
        </div>

        {err && <p role="alert" className="text-red-700">{err}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-teal-800 p-5 text-xl font-medium text-white active:bg-teal-900 disabled:opacity-50">
          {busy ? 'Menyimpan...' : 'Simpan peminjaman'}
        </button>
      </form>
    </main>
  )
}
