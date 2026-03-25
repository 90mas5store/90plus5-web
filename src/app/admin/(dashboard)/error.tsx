'use client'

import { useEffect } from 'react'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
    useEffect(() => { console.error(error) }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-white">
            <h2 className="text-xl font-bold">Algo salió mal</h2>
            <p className="text-gray-400 text-sm">{error.message}</p>
            <button
                onClick={reset}
                className="px-4 py-2 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
                Reintentar
            </button>
        </div>
    )
}
