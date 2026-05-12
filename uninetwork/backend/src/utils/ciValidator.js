/**
 * Validación de Cédula de Identidad (C.I.)
 * Soporta formatos de Bolivia y genérico internacional.
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

/**
 * Validates a C.I. number based on country
 * @param {string} ci - The C.I. string to validate
 * @param {string} country - The country code
 * @returns {{ valid: boolean, error?: string }}
 */
function validateCI(ci, country = 'Bolivia') {
  if (!ci || typeof ci !== 'string') {
    return { valid: false, error: 'La Cédula de Identidad es obligatoria.' };
  }

  const trimmed = ci.trim().toUpperCase();

  if (trimmed.length < 5) {
    return { valid: false, error: 'La C.I. es demasiado corta.' };
  }

  const pattern = CI_PATTERNS[country] || CI_PATTERNS.Generic;

  if (!pattern.test(trimmed)) {
    return {
      valid: false,
      error: `Formato de C.I. inválido para ${country}. Verifica el número ingresado.`
    };
  }

  // Validación adicional para Bolivia: extensión departamental
  if (country === 'Bolivia') {
    const parts = trimmed.split('-');
    if (parts.length === 2) {
      const ext = parts[1];
      if (ext.length === 2 && !BOLIVIAN_DEPARTMENTS.includes(ext)) {
        return {
          valid: false,
          error: `Extensión departamental "${ext}" no reconocida para Bolivia.`
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Normalizes a CI string for consistent hashing
 */
function normalizeCI(ci) {
  return ci.trim().toUpperCase().replace(/\s+/g, '');
}

module.exports = { validateCI, normalizeCI, CI_PATTERNS, BOLIVIAN_DEPARTMENTS };
