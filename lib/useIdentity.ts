'use client'

import { useEffect, useState } from "react"
import { Identity } from "./types";


export function useIdentity(): {identity: Identity | null, checked: boolean} {
    const [identity, setIdentity] = useState<Identity | null>(null)
    const [checked, setChecked] = useState(false)
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem("identity");
            if (raw) setIdentity(JSON.parse(raw));
            setChecked(true)
        } catch {
            sessionStorage.removeItem("identity")
            setChecked(true)
        }
    }, []);
    return {identity, checked} 
}