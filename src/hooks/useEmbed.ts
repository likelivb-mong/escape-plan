import { useSearchParams } from 'react-router-dom';

/** Returns true when the app is loaded inside an iframe with ?embed=true */
export function useEmbed(): boolean {
  const [searchParams] = useSearchParams();
  return searchParams.get('embed') === 'true';
}
