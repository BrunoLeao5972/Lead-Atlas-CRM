export type ViaCepAddress = {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  formattedAddress: string;
};

function normalizeCep(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8);
}

function formatCep(cep: string): string {
  return cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
}

export function extractCep(value: string): string | null {
  const cep = normalizeCep(value);
  return cep.length === 8 ? cep : null;
}

export async function lookupAddressByCep(input: string): Promise<ViaCepAddress | null> {
  const cep = extractCep(input);
  if (!cep) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) return null;

    const data = await response.json() as {
      erro?: boolean;
      cep?: string;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };

    if (data.erro || !data.localidade || !data.uf) return null;

    const street = data.logradouro?.trim();
    const district = data.bairro?.trim();
    const city = data.localidade.trim();
    const state = data.uf.trim();
    const formattedCep = formatCep(cep);

    const parts: string[] = [];
    if (street) parts.push(street);
    if (district) parts.push(district);

    const main = parts.length > 0 ? `${parts.join(', ')} - ${city}/${state}` : `${city}/${state}`;

    return {
      cep: formattedCep,
      logradouro: street ?? '',
      bairro: district ?? '',
      localidade: city,
      uf: state,
      formattedAddress: `${main}, Brasil`,
    };
  } catch {
    return null;
  }
}