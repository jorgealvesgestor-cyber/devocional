import { Jornada } from '../../types';

// Carrega automaticamente toda pasta data/jornadas/NN/index.ts.
// Pra adicionar uma jornada nova, basta criar a pasta — não precisa mexer aqui.
const modulos = import.meta.glob<{ JORNADA: Jornada }>('./*/index.ts', { eager: true });

export const TODAS_JORNADAS: Jornada[] = Object.values(modulos)
  .map(m => m.JORNADA)
  .sort((a, b) => a.numero - b.numero);

const hoje = () => {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

/** Só as jornadas cuja data de liberação já chegou */
export const jornadasLiberadas = (): Jornada[] => {
  const h = hoje();
  return TODAS_JORNADAS.filter(j => j.liberadaEm <= h);
};
