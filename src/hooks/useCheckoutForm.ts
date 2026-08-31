'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckoutFormData, CheckoutFormErrors, ToastHook } from '@/types/checkout';
import { getShippingZones } from '@/lib/api';
import { ShippingZone } from '@/lib/types';
import { BUSINESS_LOGIC } from '@/lib/constants';

const INITIAL_FORM_DATA: CheckoutFormData = {
    nombre: '',
    correo: '',
    telefono: '',
    direccion: '',
    departamento: '',
    municipio: '',
    description: '',
};

export function useCheckoutForm(toastMsg: ToastHook) {
    const [formData, setFormData] = useState<CheckoutFormData>(INITIAL_FORM_DATA);
    const [errores, setErrores] = useState<CheckoutFormErrors>({});
    const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);

    useEffect(() => {
        let isMounted = true;
        getShippingZones().then((zones) => {
            if (isMounted) setShippingZones(zones);
        });
        return () => {
            isMounted = false;
        };
    }, []);

    const uniqueDepartments = Array.from(new Set(shippingZones.map((z) => z.department))).sort();

    const municipalities = shippingZones
        .filter((z) => z.department === formData.departamento)
        .map((z) => z.municipality);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'telefono') {
            const digits = value.replace(/\D/g, '').slice(0, 8);
            const formatted = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
            setFormData((prev) => ({ ...prev, telefono: formatted }));
            if (/^[0-9]{4}-[0-9]{4}$/.test(formatted)) {
                setErrores((prev) => ({ ...prev, telefono: undefined }));
            }
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
        if (value.trim()) {
            setErrores((prev) => ({ ...prev, [name]: undefined }));
        }
    }, []);

    const handleDepartmentChange = useCallback((department: string) => {
        setFormData((prev) => ({ ...prev, departamento: department, municipio: '' }));
        if (department) {
            setErrores((prev) => ({ ...prev, departamento: undefined }));
        }
    }, []);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const telRegex = BUSINESS_LOGIC.CONTACT.PHONE_REGEX;
        let hasError = false;
        if (name === 'nombre') hasError = !value.trim();
        if (name === 'correo') hasError = !value.includes('@');
        if (name === 'telefono') hasError = !telRegex.test(value);
        if (name === 'direccion') hasError = !value.trim();
        if (name === 'departamento') hasError = !value;
        if (name === 'municipio') hasError = !value;
        setErrores((prev) => ({ ...prev, [name]: hasError || undefined }));
    }, []);

    const validateForm = useCallback((metodoPago: string, aceptoTerminos: boolean): boolean => {
        const newErrors: CheckoutFormErrors = {};
        const telRegex = BUSINESS_LOGIC.CONTACT.PHONE_REGEX;

        if (!formData.nombre.trim()) newErrors.nombre = true;
        if (!formData.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) newErrors.correo = true;
        if (!formData.telefono.trim() || !telRegex.test(formData.telefono)) newErrors.telefono = true;
        if (!formData.direccion.trim()) newErrors.direccion = true;
        if (!formData.departamento.trim()) newErrors.departamento = true;
        if (!formData.municipio.trim()) newErrors.municipio = true;
        if (!metodoPago.trim()) newErrors.metodoPago = true;

        if (Object.keys(newErrors).length > 0) {
            setErrores(newErrors);
            toastMsg.error('Por favor completa los campos requeridos correctamente');
            return false;
        }

        if (!aceptoTerminos) {
            toastMsg.warning('Debes aceptar los términos y condiciones');
            return false;
        }

        return true;
    }, [formData, toastMsg]);

    const detectLocation = useCallback(() => {
        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
            toastMsg.error('Tu navegador no soporta geolocalización.');
            return;
        }

        toastMsg.loading('Detectando ubicación...');

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                let masCercano: ShippingZone | null = null;
                let menorDist = Infinity;

                const zonasConCoords = shippingZones.filter((z) => z.latitude && z.longitude);

                for (const zona of zonasConCoords) {
                    const d = Math.sqrt(
                        Math.pow(latitude - (zona.latitude || 0), 2) +
                        Math.pow(longitude - (zona.longitude || 0), 2)
                    );

                    if (d < menorDist) {
                        menorDist = d;
                        masCercano = zona;
                    }
                }

                if (masCercano) {
                    toastMsg.success(`Ubicación: ${masCercano.municipality}, ${masCercano.department}`);
                    setFormData((prev) => ({
                        ...prev,
                        departamento: masCercano!.department,
                        municipio: masCercano!.municipality,
                    }));
                    setErrores((prev) => ({
                        ...prev,
                        departamento: undefined,
                        municipio: undefined,
                    }));
                } else {
                    toastMsg.info('No encontramos una zona cercana. Selecciona manualmente.');
                }
            },
            (err) => {
                console.warn('Geolocation error:', err);
                if (err.code === err.PERMISSION_DENIED) {
                    toastMsg.error('Permiso denegado. Actívalo en el navegador.');
                } else {
                    toastMsg.error('No se pudo detectar la ubicación.');
                }
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    }, [shippingZones, toastMsg]);

    return {
        formData,
        setFormData,
        errores,
        setErrores,
        shippingZones,
        uniqueDepartments,
        municipalities,
        handleChange,
        handleDepartmentChange,
        handleBlur,
        validateForm,
        detectLocation,
    };
}
