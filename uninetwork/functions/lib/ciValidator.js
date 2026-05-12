/**
 * lib/ciValidator.js — Validación de Cédula de Identidad
 * Pure JS, no Node dependencies — identical logic to original.
 */

const CI_PATTERNS = {
  Bolivia: /^\d{5,9}(-[A-Z0-9]{1,2})?$/i,
  Peru: /^\d{8}$/,
  Colombia: /^\d{6,10}$/,
  Argentina: /^\d{7,8}$/,
  Chile: /^\d{7,8}-[\dkK]$/,
  Brasil: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
  Mexico: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i,
  Generic: /^[A-Za-z0-9\-\.]{5,20}$/
};

const BOLIVIAN_DEPARTMENTS = ['LP', 'CB', 'SC', 'OR', 'PT', 'TJ', 'CH', 'BE', 'PA'];

export function validateCI(ci, country = 'Bolivia') {
  if (!ci || typeof ci !== 'string') {
    return { valid: false, error: 'La Cédula de Identidad es obligatoria.' };
  }
  const trimmed = ci.trim().toUpperCase();
  if (trimmed.length < 5) {
    return { valid: false, error: 'La C.I. es demasiado corta.' };
  }
  const pattern = CI_PATTERNS[country] || CI_PATTERNS.Generic;
  if (!pattern.test(trimmed)) {
    return { valid: false, error: `Formato de C.I. inválido para ${country}. Verifica el número ingresado.` };
  }
  if (country === 'Bolivia') {
    const parts = trimmed.split('-');
    if (parts.length === 2) {
      const ext = parts[1];
      if (ext.length === 2 && !BOLIVIAN_DEPARTMENTS.includes(ext)) {
        return { valid: false, error: `Extensión departamental "${ext}" no reconocida para Bolivia.` };
      }
    }
  }
  return { valid: true };
}

export function normalizeCI(ci) {
  return ci.trim().toUpperCase().replace(/\s+/g, '');
}
