export type GeocodedAddress = {
  lat: number;
  lng: number;
  formattedAddress: string;
};

export type StructuredBrazilAddress = {
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

/**
 * Map of Portuguese number words ↔ digits.
 * Used to detect when Nominatim silently normalises one form into the other.
 */
const NUMERAL_WORDS: Record<string, string> = {
  um: '1', dois: '2', três: '3', tres: '3', quatro: '4', cinco: '5',
  seis: '6', sete: '7', oito: '8', nove: '9', dez: '10',
  onze: '11', doze: '12', treze: '13', quatorze: '14', catorze: '14',
  quinze: '15', dezesseis: '16', dezessete: '17', dezoito: '18', dezenove: '19',
  vinte: '20', trinta: '30',
};

const DIGIT_TO_WORD: Record<string, string[]> = {};
for (const [word, digit] of Object.entries(NUMERAL_WORDS)) {
  (DIGIT_TO_WORD[digit] ??= []).push(word);
}

/**
 * Returns true when the returned display_name swapped a number word for its
 * digit equivalent (or vice-versa) relative to the street we searched for.
 *
 * Example: searched "Rua Sete de Setembro" but Nominatim returned
 * "Rua 7 de Setembro" → mismatch → true.
 */
function hasNumeralMismatch(queriedStreet: string, displayName: string): boolean {
  const qLow = queriedStreet.toLowerCase();
  const dLow = displayName.toLowerCase();

  // Check if queried street contains a number word that was replaced by its digit
  for (const [word, digit] of Object.entries(NUMERAL_WORDS)) {
    const wordRe = new RegExp(`\\b${word}\\b`);
    const digitRe = new RegExp(`\\b${digit}\\b`);

    // Queried with the word form but result has the digit form (and NOT the word)
    if (wordRe.test(qLow) && digitRe.test(dLow) && !wordRe.test(dLow)) return true;
    // Queried with the digit form but result has the word form (and NOT the digit)
    if (digitRe.test(qLow) && wordRe.test(dLow) && !digitRe.test(dLow)) return true;
  }

  return false;
}

async function requestNominatim(
  params: URLSearchParams,
  expectedStreet?: string,
): Promise<GeocodedAddress | null> {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
  if (!response.ok) return null;

  const data = await response.json() as NominatimResult[];
  if (!Array.isArray(data) || data.length === 0) return null;

  for (const result of data) {
    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    // Reject results where Nominatim swapped "Sete" ↔ "7" (or similar)
    if (expectedStreet && hasNumeralMismatch(expectedStreet, result.display_name)) {
      continue;
    }

    return { lat, lng, formattedAddress: result.display_name };
  }

  return null;
}

export async function geocodeStructuredAddress(address: StructuredBrazilAddress): Promise<GeocodedAddress | null> {
  const cep = (address.cep ?? '').trim();
  const logradouro = (address.logradouro ?? '').trim();
  const numero = (address.numero ?? '').trim();
  const bairro = (address.bairro ?? '').trim();
  const cidade = (address.cidade ?? '').trim();
  const uf = (address.uf ?? '').trim();

  const street = [logradouro, numero].filter(Boolean).join(' ').trim();

  type Strategy = { params: URLSearchParams; expectedStreet?: string };
  const candidates: Strategy[] = [];

  // 1. CEP first — most precise for Brazil (unique per street segment)
  if (cep) {
    candidates.push({
      params: new URLSearchParams({
        postalcode: cep,
        country: 'Brasil',
        countrycodes: 'br',
        format: 'jsonv2',
        limit: '3',
        addressdetails: '0',
        'accept-language': 'pt-BR',
      }),
      expectedStreet: logradouro,
    });
  }

  // 2. Free-text with exact logradouro (quoted) + bairro + city + CEP
  //    Quoting the street name tells Nominatim to match the exact phrase,
  //    preventing it from normalising "Sete" ↔ "7".
  if (logradouro && bairro && cidade && uf) {
    const parts = [`"${logradouro}"`, bairro, `${cidade} - ${uf}`, cep].filter(Boolean);
    candidates.push({
      params: new URLSearchParams({
        q: parts.join(', ') + ', Brasil',
        countrycodes: 'br',
        format: 'jsonv2',
        limit: '3',
        addressdetails: '0',
        'accept-language': 'pt-BR',
      }),
      expectedStreet: logradouro,
    });
  }

  // 3. CEP + street + city (structured)
  if (cep && street && cidade) {
    candidates.push({
      params: new URLSearchParams({
        street,
        city: cidade,
        country: 'Brasil',
        countrycodes: 'br',
        postalcode: cep,
        format: 'jsonv2',
        limit: '3',
        addressdetails: '0',
        'accept-language': 'pt-BR',
      }),
      expectedStreet: logradouro,
    });
  }

  // 4. Free-text with street + bairro + city (no CEP)
  if (logradouro && bairro && cidade && uf) {
    const parts = [`"${logradouro}"`, bairro, `${cidade} - ${uf}`];
    candidates.push({
      params: new URLSearchParams({
        q: parts.join(', ') + ', Brasil',
        countrycodes: 'br',
        format: 'jsonv2',
        limit: '3',
        addressdetails: '0',
        'accept-language': 'pt-BR',
      }),
      expectedStreet: logradouro,
    });
  }

  // 5. Bairro + cidade (neighbourhood-level fallback)
  if (bairro && cidade && uf) {
    candidates.push({
      params: new URLSearchParams({
        q: `${bairro}, ${cidade} - ${uf}, Brasil`,
        countrycodes: 'br',
        format: 'jsonv2',
        limit: '1',
        addressdetails: '0',
        'accept-language': 'pt-BR',
      }),
    });
  }

  // 6. Street + city + state (no bairro, last street-level resort)
  if (street && cidade && uf) {
    candidates.push({
      params: new URLSearchParams({
        street,
        city: cidade,
        state: uf,
        country: 'Brasil',
        countrycodes: 'br',
        format: 'jsonv2',
        limit: '3',
        addressdetails: '0',
        'accept-language': 'pt-BR',
      }),
      expectedStreet: logradouro,
    });
  }

  // 7. City + state fallback
  if (cidade && uf) {
    candidates.push({
      params: new URLSearchParams({
        city: cidade,
        state: uf,
        country: 'Brasil',
        countrycodes: 'br',
        format: 'jsonv2',
        limit: '1',
        addressdetails: '0',
        'accept-language': 'pt-BR',
      }),
    });
  }

  for (const { params, expectedStreet } of candidates) {
    try {
      const result = await requestNominatim(params, expectedStreet);
      if (result) return result;
    } catch {
      // Try next strategy.
    }
  }

  return null;
}

// ─── Public API ──────────────────────────────────────────

export async function geocodeAddress(address: string): Promise<GeocodedAddress | null> {
  const query = address.trim();
  if (!query) return null;

  try {
    const params = new URLSearchParams({
      q: query.includes('Brasil') ? query : `${query}, Brasil`,
      format: 'jsonv2',
      limit: '1',
      addressdetails: '0',
      countrycodes: 'br',
      'accept-language': 'pt-BR',
    });
    const result = await requestNominatim(params);
    if (!result) return null;
    return { ...result, formattedAddress: result.formattedAddress || query };
  } catch {
    return null;
  }
}
