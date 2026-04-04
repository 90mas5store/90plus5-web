'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Plus, Loader2, Trash2 } from 'lucide-react'
import useToastMessage from '@/hooks/useToastMessage'

interface Note {
    id: string
    note: string
    admin_email: string | null
    created_at: string
}

interface Props {
    orderId: string
    initialNotes: Note[]
    adminEmail: string
}

export default function OrderNotes({ orderId, initialNotes, adminEmail }: Props) {
    const supabaseRef = useRef(createClient())
    const supabase = supabaseRef.current
    const toast = useToastMessage()
    const [notes, setNotes] = useState<Note[]>(initialNotes)
    const [newNote, setNewNote] = useState('')
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleAdd = async () => {
        if (!newNote.trim()) return
        setSaving(true)
        try {
            const { data, error } = await supabase
                .from('order_notes')
                .insert({ order_id: orderId, note: newNote.trim(), admin_email: adminEmail })
                .select()
                .single()
            if (error) throw error
            setNotes(prev => [data, ...prev])
            setNewNote('')
            toast.success('Nota agregada')
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            const { error } = await supabase.from('order_notes').delete().eq('id', id)
            if (error) throw error
            setNotes(prev => prev.filter(n => n.id !== id))
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`)
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-4">
            <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-gray-400">
                <MessageSquare className="w-4 h-4" />
                Notas Internas
            </h2>

            {/* Formulario nueva nota */}
            <div className="flex gap-2">
                <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAdd() }}
                    placeholder="Agregar nota interna... (Ctrl+Enter para guardar)"
                    rows={2}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-white/20 resize-none"
                />
                <button
                    onClick={handleAdd}
                    disabled={saving || !newNote.trim()}
                    className="px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white transition-all disabled:opacity-40 self-end py-3"
                    title="Agregar (Ctrl+Enter)"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
            </div>

            {/* Lista de notas */}
            {notes.length === 0 ? (
                <p className="text-xs text-gray-600 italic text-center py-4">Sin notas internas</p>
            ) : (
                <div className="space-y-2">
                    {notes.map(note => (
                        <div key={note.id} className="group flex gap-3 p-3 rounded-xl bg-black/30 border border-white/5">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white whitespace-pre-wrap break-words">{note.note}</p>
                                <p className="text-[10px] text-gray-600 mt-1.5">
                                    {note.admin_email} · {new Date(note.created_at).toLocaleString('es-HN', { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(note.id)}
                                disabled={deletingId === note.id}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all self-start"
                            >
                                {deletingId === note.id
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Trash2 className="w-3.5 h-3.5" />
                                }
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
