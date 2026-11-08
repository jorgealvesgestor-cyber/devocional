import { Jornada } from '../../../types';
import { SEMANA_1 } from './semana1';
import { SEMANA_2 } from './semana2';
import { SEMANA_3 } from './semana3';
import { SEMANA_4 } from './semana4';

export const JORNADA: Jornada = {
  numero: 1,
  titulo: 'Primeiros Passos',
  liberadaEm: '2026-11-01',
  semanas: [
    { numero: 1, tema: 'Quem é Jesus?', emoji: '✝️' },
    { numero: 2, tema: 'Cheios do Espírito', emoji: '🔥' },
    { numero: 3, tema: 'Jovem e Corajoso', emoji: '🦁' },
    { numero: 4, tema: 'Fé na Prática', emoji: '⚡' },
  ],
  devocionais: [...SEMANA_1, ...SEMANA_2, ...SEMANA_3, ...SEMANA_4],
};
