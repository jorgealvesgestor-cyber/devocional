import React, { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import { Devocional, Semana } from '../types';

// =============== Utilidades ===============

const REF_REGEX = /([1-4]?\s?[A-ZÁÉÍÓÚÂÊÔ][a-zà-ÿ]+)\s(\d+):(\d+)(-\d+)?/g;
const marcarRefs = (html: string) => html.replace(REF_REGEX, m => `<span class="ref-biblica">${m}</span>`);
const md = (texto: string) => marcarRefs(marked.parse(texto, { async: false }) as string);

interface Secao { numero: number; titulo: string; emoji: string; corpo: string; }

function quebrarDevocional(conteudo: string) {
  const partes = conteudo.split(/\n---\n/).map(p => p.trim());
  const intro = partes[0];
  const secoes: Secao[] = partes.slice(1).map(parte => {
    const [cab, ...resto] = parte.split('\n');
    const m = cab.match(/^##\s*(\d+)\.\s*(.+)$/);
    const tituloCompleto = (m?.[2] ?? cab.replace(/^##\s*/, '')).trim();
    const emojiMatch = tituloCompleto.match(/(\p{Extended_Pictographic}️?)\s*$/u);
    return {
      numero: m ? Number(m[1]) : 0,
      titulo: emojiMatch ? tituloCompleto.slice(0, emojiMatch.index).trim() : tituloCompleto,
      emoji: emojiMatch?.[1] ?? '',
      corpo: resto.join('\n').trim(),
    };
  });
  return { intro, secoes };
}

// Faz o card aparecer quando entra na tela
function useRevelar<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { el.classList.add('visivel'); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('visivel'); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

// =============== Voz (grátis, do próprio aparelho) ===============

function textoParaFala(markdown: string): string[] {
  const limpo = markdown
    .replace(/^---$/gm, ' ')
    .replace(/^##\s*\d+\.\s*/gm, '')
    .replace(/#[\p{L}\p{N}_]+/gu, ' ')
    .replace(/[*_>#`~]/g, '')
    .replace(/\p{Extended_Pictographic}|️|‍/gu, '')
    .replace(/(\d+):(\d+)-(\d+)/g, '$1, versículos $2 a $3')
    .replace(/(\d+):(\d+)/g, '$1, versículo $2')
    .replace(/\((a|o|s)\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return limpo.match(/[^.!?]+[.!?]*/g)?.map(s => s.trim()).filter(Boolean) ?? [];
}

function melhorVozPtBr(): SpeechSynthesisVoice | undefined {
  const vozes = window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('pt'));
  const br = vozes.filter(v => v.lang.toLowerCase().includes('br'));
  const lista = br.length ? br : vozes;
  return lista.find(v => /natural|online|google/i.test(v.name)) ?? lista[0];
}

function useLeitura(texto: string) {
  const [falando, setFalando] = useState(false);
  const suportado = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const cancelado = useRef(false);

  useEffect(() => {
    if (!suportado) return;
    window.speechSynthesis.getVoices();
    return () => { cancelado.current = true; window.speechSynthesis.cancel(); };
  }, [suportado]);

  useEffect(() => {
    if (!suportado) return;
    cancelado.current = true;
    window.speechSynthesis.cancel();
    setFalando(false);
  }, [texto, suportado]);

  const alternar = () => {
    if (!suportado) return;
    const synth = window.speechSynthesis;
    if (falando) { cancelado.current = true; synth.cancel(); setFalando(false); return; }
    cancelado.current = false;
    const frases = textoParaFala(texto);
    const voz = melhorVozPtBr();
    synth.cancel();
    frases.forEach((frase, i) => {
      const u = new SpeechSynthesisUtterance(frase);
      u.lang = 'pt-BR';
      if (voz) u.voice = voz;
      u.rate = 1.05;
      if (i === frases.length - 1) u.onend = () => { if (!cancelado.current) setFalando(false); };
      synth.speak(u);
    });
    setFalando(true);
  };

  return { falando, alternar, suportado };
}

// =============== Peças da Home ===============

export const AnelProgresso: React.FC<{ feitos: number; total: number }> = ({ feitos, total }) => {
  const r = 36, c = 2 * Math.PI * r;
  const pct = total ? feitos / total : 0;
  return (
    <div className="anel">
      <svg width="86" height="86" viewBox="0 0 86 86">
        <defs>
          <linearGradient id="gFogo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFC23D" /><stop offset="50%" stopColor="#FF6B2C" /><stop offset="100%" stopColor="#FF2D78" />
          </linearGradient>
        </defs>
        <circle cx="43" cy="43" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="9" />
        <circle cx="43" cy="43" r={r} fill="none" stroke="url(#gFogo)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="num">{Math.round(pct * 100)}%</div>
    </div>
  );
};

const DESLOCAMENTOS = [0, 70, 100, 70, 0, -70, -100, -70];

export const Trilha: React.FC<{
  semanas: Semana[];
  devocionais: Devocional[];
  concluidos: Record<number, string>;
  diaAtual: number;
  onAbrir: (dia: number) => void;
}> = ({ semanas, devocionais, concluidos, diaAtual, onAbrir }) => {
  let i = 0;
  return (
    <div className="trilha">
      {semanas.map(s => (
        <div key={s.numero}>
          <div className="semana-banner">
            <div className="emoji">{s.emoji}</div>
            <div>
              <div className="rotulo">Semana {s.numero}</div>
              <div className="titulo">{s.tema}</div>
            </div>
          </div>
          {devocionais.filter(d => d.semana === s.numero).map(d => {
            const off = DESLOCAMENTOS[i++ % DESLOCAMENTOS.length];
            const feito = !!concluidos[d.dia];
            const atual = d.dia === diaAtual && !feito;
            const rotuloADireita = off <= 0;
            return (
              <div className="no-linha" key={d.dia}>
                <button
                  className={`no ${feito ? 'feito' : ''} ${atual ? 'atual' : ''}`}
                  style={{ left: `calc(50% + ${off}px)` }}
                  onClick={() => onAbrir(d.dia)}
                  aria-label={`Dia ${d.dia}: ${d.titulo}`}
                >
                  {feito ? <i className="fa-solid fa-check"></i> : d.dia}
                </button>
                <div
                  className="no-rotulo"
                  style={rotuloADireita
                    ? { left: `calc(50% + ${off + 50}px)` }
                    : { right: `calc(50% - ${off - 50}px)`, textAlign: 'right' }}
                >
                  <b>{atual ? '👉 ' : ''}{d.titulo}</b>
                  <span>{d.livro} {d.capitulo}</span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// =============== Leitura ===============

const SecaoCard: React.FC<{ secao: Secao; delay: number }> = ({ secao, delay }) => {
  const ref = useRevelar<HTMLElement>();
  const html = useMemo(() => md(secao.corpo), [secao.corpo]);
  const ehMissao = secao.numero === 4;

  const tocarItem = (e: React.MouseEvent) => {
    if (!ehMissao) return;
    const li = (e.target as HTMLElement).closest('ol li');
    if (li) li.classList.toggle('feito');
  };

  return (
    <section ref={ref} className="secao" data-tipo={secao.numero} style={{ transitionDelay: `${delay}ms` }}>
      <div className="secao-cab">
        <div className="secao-num">{String(secao.numero).padStart(2, '0')}</div>
        <h2 className="secao-titulo">{secao.titulo} {secao.emoji}</h2>
      </div>
      {ehMissao && <p className="dica-toque so-tela">Toca em cada passo quando fizer ✓</p>}
      <div className="conteudo" onClick={tocarItem} dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
};

const StoryCard: React.FC<{ secao: Secao; onCopiar: (t: string) => void }> = ({ secao, onCopiar }) => {
  const ref = useRevelar<HTMLElement>();
  const linhas = secao.corpo.split('\n').map(l => l.trim()).filter(Boolean);
  const instrucao = (linhas.find(l => /^\*.+\*$/.test(l)) ?? '').replace(/^\*|\*$/g, '');
  const legenda = (linhas.find(l => l.startsWith('"')) ?? '').replace(/^"|"$/g, '');

  // separa citação, referência e hashtags pra montar o card
  const tags = legenda.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  const semTags = legenda.replace(/#[\p{L}\p{N}_]+/gu, '').trim();
  const refs = semTags.match(REF_REGEX) ?? [];
  const ref_ = refs[refs.length - 1] ?? '';
  const citacao = (ref_ ? semTags.slice(0, semTags.lastIndexOf(ref_)) : semTags)
    .replace(/[\p{Extended_Pictographic}️‍\s]+$/u, '').trim();

  return (
    <section ref={ref} className="story">
      <div className="rotulo">05 · {secao.titulo} {secao.emoji}</div>
      <p className="instrucao">{instrucao}</p>
      <blockquote>“{citacao}”</blockquote>
      {ref_ && <div className="ref-story">{ref_}</div>}
      <div className="tags">{tags.join(' ')}</div>
      <button className="btn so-tela" onClick={() => onCopiar(legenda)}>
        <i className="fa-regular fa-copy"></i> COPIAR LEGENDA
      </button>
    </section>
  );
};

export const Leitura: React.FC<{
  jornada: number;
  total: number;
  devocional: Devocional;
  conteudo: string;
  concluido: boolean;
  temProximo: boolean;
  onVoltar: () => void;
  onConcluir: () => void;
  onProximo: () => void;
  onToast: (msg: string) => void;
}> = ({ jornada, total, devocional, conteudo, concluido, temProximo, onVoltar, onConcluir, onProximo, onToast }) => {
  const { intro, secoes } = useMemo(() => quebrarDevocional(conteudo), [conteudo]);
  const { falando, alternar, suportado } = useLeitura(conteudo);
  const [progresso, setProgresso] = useState(0);
  const [gerandoPDF, setGerandoPDF] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgresso(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [conteudo]);

  const copiar = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      onToast('Legenda copiada! Agora é só postar 📲');
    } catch {
      onToast('Não deu pra copiar 😕 Segura o dedo no texto pra copiar.');
    }
  };

  const salvarPDF = () => {
    const el = document.getElementById('devocional-estudo');
    if (!el) return;
    setGerandoPDF(true);
    el.classList.add('modo-pdf');
    const fim = () => { el.classList.remove('modo-pdf'); setGerandoPDF(false); };
    const opt = {
      margin: [0.8, 0.8, 0.8, 0.8],
      filename: `Devocional_J${jornada}_Dia${devocional.dia}_${devocional.livro}_${devocional.capitulo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['.secao', '.story'] },
    };
    // @ts-ignore html2pdf vem do CDN
    window.html2pdf().set(opt).from(el).save().then(fim).catch(fim);
  };

  const secoesNormais = secoes.filter(s => s.numero !== 5);
  const story = secoes.find(s => s.numero === 5);
  const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`BibleProject Português ${devocional.livro}`)}`;

  return (
    <>
      <div className="barra-leitura" style={{ width: `${progresso}%` }} />

      <div className="leitura-topo entrar">
        <button className="btn-voltar" onClick={onVoltar}><i className="fa-solid fa-arrow-left"></i> Trilha</button>
        <span className="rotulo">J{jornada} · Dia {devocional.dia} / {total}</span>
      </div>

      <div id="devocional-estudo">
        <header className="hero-dia">
          <div className="ref-chip entrar d1"><i className="fa-solid fa-book-bible"></i> {devocional.livro} {devocional.capitulo}</div>
          <h1 className="display entrar d2">{devocional.titulo}</h1>
          <div className="intro entrar d3" dangerouslySetInnerHTML={{ __html: md(intro) }} />
        </header>

        {secoesNormais.map((s, i) => <SecaoCard key={s.numero} secao={s} delay={i * 40} />)}
        {story && <StoryCard secao={story} onCopiar={copiar} />}
      </div>

      <a className="card-video" href={videoUrl} target="_blank" rel="noreferrer">
        <div className="ic"><i className="fa-brands fa-youtube"></i></div>
        <div>
          <b>Vídeo do livro de {devocional.livro}</b>
          <span>Assista o resumo animado do BibleProject</span>
        </div>
      </a>

      <nav className="dock">
        {suportado && (
          <button className={`btn btn-vidro btn-icone ${falando ? 'ouvindo' : ''}`} onClick={alternar} aria-label={falando ? 'Parar áudio' : 'Ouvir devocional'}>
            <i className={`fa-solid ${falando ? 'fa-stop' : 'fa-headphones'}`}></i>
          </button>
        )}
        <button className="btn btn-vidro btn-icone" onClick={salvarPDF} disabled={gerandoPDF} aria-label="Salvar PDF">
          <i className={`fa-solid ${gerandoPDF ? 'fa-spinner fa-spin' : 'fa-file-arrow-down'}`}></i>
        </button>
        {!concluido ? (
          <button className="btn btn-fogo" onClick={onConcluir}><i className="fa-solid fa-fire"></i> CONCLUIR DIA</button>
        ) : temProximo ? (
          <button className="btn btn-lima" onClick={onProximo}>PRÓXIMO DIA <i className="fa-solid fa-arrow-right"></i></button>
        ) : (
          <button className="btn btn-lima" onClick={onVoltar}>VER TRILHA 🏆</button>
        )}
      </nav>
    </>
  );
};

// =============== Comemoração ===============

export const Festa: React.FC<{
  dia: number; sequencia: number; final: boolean; jornada: number; temProximaJornada: boolean;
  onFechar: () => void; onProximo?: () => void;
}> = ({ dia, sequencia, final, jornada, temProximaJornada, onFechar, onProximo }) => {
  const confetes = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    dur: 2.2 + Math.random() * 1.8,
    cor: ['#FFC23D', '#FF6B2C', '#FF2D78', '#B8FF3C', '#3DE0FF', '#8B6CFF'][i % 6],
    rot: Math.random() * 360,
  })), []);

  return (
    <div className="festa" onClick={onFechar}>
      {confetes.map((c, i) => (
        <span key={i} className="confete" style={{ left: `${c.left}%`, background: c.cor, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s`, rotate: `${c.rot}deg` }} />
      ))}
      <div className="festa-card" onClick={e => e.stopPropagation()}>
        <div className="grande">{final ? '🏆' : '🔥'}</div>
        <h2 className="display">{final ? <>Jornada {jornada}<br /><span className="texto-fogo">completa!</span></> : <>Dia {dia}<br /><span className="texto-fogo">concluído!</span></>}</h2>
        <p>
          {final
            ? temProximaJornada
              ? 'Você fez os 30 dias na presença de Deus. Que orgulho! A próxima jornada já está liberada 🔥'
              : 'Você fez os 30 dias na presença de Deus. Que orgulho! A próxima jornada chega no dia 1º do mês 🔥'
            : sequencia > 1 ? `${sequencia} dias seguidos! Não deixa a chama apagar 🔥` : 'A chama acendeu! Volta amanhã pra manter ela viva 🔥'}
        </p>
        {onProximo && !final
          ? <button className="btn btn-lima" style={{ width: '100%' }} onClick={onProximo}>BORA PRO DIA {dia + 1} <i className="fa-solid fa-arrow-right"></i></button>
          : onProximo && final && temProximaJornada
            ? <button className="btn btn-lima" style={{ width: '100%' }} onClick={onProximo}>BORA PRA JORNADA {jornada + 1} <i className="fa-solid fa-arrow-right"></i></button>
            : <button className="btn btn-fogo" style={{ width: '100%' }} onClick={onFechar}>VALEU! 🙌</button>}
        <button className="trocar-nome" style={{ marginTop: 16 }} onClick={onFechar}>fechar</button>
      </div>
    </div>
  );
};
