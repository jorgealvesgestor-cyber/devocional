export interface Devocional {
  /** Dia dentro da jornada: 1 a 30 */
  dia: number;
  /** Semana dentro da jornada: 1 a 4 (a semana 4 vai do dia 22 ao 30) */
  semana: number;
  titulo: string;
  livro: string;
  capitulo: number;
  /** Markdown. Use {{nome}} onde o nome do jovem deve aparecer. */
  conteudo: string;
}

export interface Semana {
  numero: number;
  tema: string;
  emoji: string;
}

export interface Jornada {
  /** 1, 2, 3... (uma por mês) */
  numero: number;
  titulo: string;
  /** Data (AAAA-MM-DD) a partir da qual a jornada aparece no app */
  liberadaEm: string;
  semanas: Semana[];
  devocionais: Devocional[];
}
