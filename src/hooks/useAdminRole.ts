'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAdminRole() {
    const [role, setRole] = useState<'admin' | 'super_admin' | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const supabase = createClient()
        supabase.rpc('get_my_admin_role').then(({ data }) => {
            if (!mounted) return
            setRole(data as 'admin' | 'super_admin')
            setLoading(false)
        })
        return () => {
            mounted = false
        }
    }, [])

    return { role, isSuperAdmin: role === 'super_admin', loading }
}
