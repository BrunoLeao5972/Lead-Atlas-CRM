import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin } from 'lucide-react';
import { lookupAddressByCep } from '@/lib/viaCep';

interface AddressAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function AddressAutocomplete({
  id,
  value,
  onChange,
  required,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Buscar sugestoes com debounce
  useEffect(() => {
    const query = value.trim();
    if (query.length < 3 && query.replace(/\D/g, '').length < 8) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);

      const viaCepAddress = await lookupAddressByCep(query);
      const results = viaCepAddress ? [viaCepAddress.formattedAddress] : [];

      if (!cancelled) {
        setSuggestions(results);
        setOpen(results.length > 0);
      }
      setLoading(false);
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          required={required}
          value={value}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Digite o endereço..."
          className="pr-8"
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-[9999] mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // evita blur antes do click
                  handleSelect(suggestion);
                }}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <MapPin size={13} className="mt-0.5 shrink-0 text-muted-foreground" />
                <span>{suggestion}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-1 text-xs text-muted-foreground">
        {loading
          ? 'Buscando sugestões...'
          : 'Digite um CEP para preencher automaticamente e localizar no mapa.'}
      </p>
    </div>
  );
}
