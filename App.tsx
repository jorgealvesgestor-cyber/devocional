import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnelProgresso, Festa, Leitura, Trilha } from './components/WizardUI';
import { jornadasLiberadas } from './data/jornadas';

type Tela = 'nome' | 'trilha' | 'leitura';
/** chave "jornada-dia" -> data em que foi concluído (AAAA-MM-DD) */
type Concluidos = Record<string, string>;

// Contribuição voluntária (Pix CNPJ do Jorge)
const PIX_CHAVE = '53948821000110';
const PIX_EXIBICAO = '53.948.821/0001-10';

// Tudo fica salvo só no aparelho do jovem: sem login, sem servidor.
const ler = <T,>(chave: string, padrao: T): T => {
  try { const v = localStorage.getItem(chave); return v ? (JSON.parse(v) as T) : padrao; } catch { return padrao; }
};
const gravar = (chave: string, valor: unknown) => {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* segue sem salvar */ }
};

const hojeISO = (d = new Date()) => {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
const chave = (jornada: number, dia: number) => `${jornada}-${dia}`;

// Versões anteriores guardavam só "dia" (sem jornada): vira jornada 1.
const carregarConcluidos = (): Concluidos => {
  const atual = ler<Concluidos | null>('dv_concluidos', null);
  if (atual) return atual;
  const antigo = ler<unknown>('dp_concluidos', {});
  if (Array.isArray(antigo)) return Object.fromEntries(antigo.map((d: number) => [chave(1, d), hojeISO()]));
  return Object.fromEntries(Object.entries((antigo ?? {}) as Record<string, string>).map(([d, data]) => [chave(1, Number(d)), data]));
};

// Dias seguidos com pelo menos um devocional feito (estilo "ofensiva")
const calcularSequencia = (c: Concluidos) => {
  const datas = new Set(Object.values(c));
  const d = new Date();
  if (!datas.has(hojeISO(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (datas.has(hojeISO(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
};

const App: React.FC = () => {
  const jornadas = useMemo(jornadasLiberadas, []);
  const [nome, setNome] = useState<string>(() => ler('dv_nome', ler('dp_nome', '')));
  const [rascunho, setRascunho] = useState(nome);
  const [concluidos, setConcluidos] = useState<Concluidos>(carregarConcluidos);
  const [tela, setTela] = useState<Tela>(nome ? 'trilha' : 'nome');
  const [jornadaNum, setJornadaNum] = useState<number>(() => {
    const c = carregarConcluidos();
    const aberta = jornadas.find(j => j.devocionais.some(d => !c[chave(j.numero, d.dia)]));
    return (aberta ?? jornadas[jornadas.length - 1]).numero;
  });
  const [dia, setDia] = useState(1);
  const [festa, setFesta] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => gravar('dv_nome', nome), [nome]);
  useEffect(() => gravar('dv_concluidos', concluidos), [concluidos]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, [tela, dia, jornadaNum]);

  const jornada = jornadas.find(j => j.numero === jornadaNum) ?? jornadas[0];
  const proximaJornada = jornadas.find(j => j.numero === jornada.numero + 1);
  const total = jornada.devocionais.length;
  const feitosDaJornada: Record<number, string> = Object.fromEntries(
    jornada.devocionais.filter(d => concluidos[chave(jornada.numero, d.dia)]).map(d => [d.dia, concluidos[chave(jornada.numero, d.dia)]])
  );
  const totalFeitos = Object.keys(feitosDaJornada).length;
  const sequencia = calcularSequencia(concluidos);
  const proximo = jornada.devocionais.find(d => !feitosDaJornada[d.dia])?.dia ?? total;
  const devocional = jornada.devocionais.find(d => d.dia === dia) ?? jornada.devocionais[0];
  const conteudo = devocional.conteudo.split('{{nome}}').join(nome || 'Jovem');
  const proxDevocional = jornada.devocionais.find(d => d.dia === proximo)!;

  const mostrarToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  };

  const copiarPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_CHAVE);
      mostrarToast('Chave Pix copiada! Deus abençoe 💜');
    } catch {
      mostrarToast('Não deu pra copiar. Chave: ' + PIX_EXIBICAO);
    }
  };

  const abrir = (d: number) => { setDia(d); setTela('leitura'); setFesta(false); };
  const trocarJornada = (n: number) => { setJornadaNum(n); setTela('trilha'); setFesta(false); };
  const concluir = () => {
    const k = chave(jornada.numero, dia);
    setConcluidos(prev => (prev[k] ? prev : { ...prev, [k]: hojeISO() }));
    setFesta(true);
  };
  const salvarNome = () => {
    const n = rascunho.trim();
    if (!n) return;
    setNome(n);
    setTela('trilha');
  };

  const jornadaCompleta = totalFeitos >= total;

  return (
    <>
      <div className="atmosfera" />
      <div className="grao" />

      <div className="app">
        <header className="topo">
          <button className="marca" onClick={() => nome && setTela('trilha')}>
            <div className="marca-icone"><i className="fa-solid fa-fire-flame-curved"></i></div>
            <div>
              <div className="marca-nome">DEVOCIONAL</div>
              <div className="marca-sub">jornada jovem</div>
            </div>
          </button>
          {nome && (
            <div className={`chip-chama ${sequencia > 0 ? 'acesa' : 'apagada'}`} title="Dias seguidos">
              <span className="fogo">🔥</span>{sequencia}
            </div>
          )}
        </header>

        {tela === 'nome' && (
          <section className="boas-vindas">
            <div className="adesivos entrar">
              <span className="adesivo" style={{ ['--r' as string]: '-3deg' }}>📖 30 dias por jornada</span>
              <span className="adesivo" style={{ ['--r' as string]: '2deg' }}>🔥 cheio do Espírito</span>
              <span className="adesivo" style={{ ['--r' as string]: '-1deg' }}>📲 versículo pra postar</span>
            </div>
            <h1 className="display entrar d1">Bora viver<br /><span className="texto-fogo">30 dias</span><br />com Deus?</h1>
            <p className="entrar d2">Uma jornada pra geração que não se conforma com este mundo. Primeiro, como você se chama?</p>
            <div className="entrar d3">
              <input
                className="campo-nome"
                placeholder="Seu nome..."
                value={rascunho}
                maxLength={30}
                onChange={e => setRascunho(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && salvarNome()}
                autoFocus
              />
              <button className="btn btn-fogo" style={{ width: '100%', marginTop: 14 }} onClick={salvarNome} disabled={!rascunho.trim()}>
                COMEÇAR A JORNADA <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </section>
        )}

        {tela === 'trilha' && (
          <>
            <section className="saudacao">
              <div className="rotulo entrar">Fala,</div>
              <h1 className="display entrar d1">{nome}! <span className="texto-fogo">🔥</span></h1>
            </section>

            {jornadas.length > 1 && (
              <div className="jornadas entrar d1" role="tablist">
                {jornadas.map(j => {
                  const completa = j.devocionais.every(d => concluidos[chave(j.numero, d.dia)]);
                  return (
                    <button key={j.numero} role="tab" aria-selected={j.numero === jornada.numero}
                      className={`jornada-pill ${j.numero === jornada.numero ? 'ativa' : ''}`}
                      onClick={() => trocarJornada(j.numero)}>
                      <span className="n">Jornada {j.numero}{completa ? ' ✓' : ''}</span>
                      <span className="t">{j.titulo}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <button className="card-continuar entrar d2" onClick={() => abrir(proximo)}>
              <div>
                <div className="rotulo">
                  Jornada {jornada.numero} · {totalFeitos === 0 ? 'Começar' : jornadaCompleta ? 'Ler de novo' : 'Continuar'} · Dia {proximo}
                </div>
                <h2>{proxDevocional.titulo}</h2>
                <div className="ref">{proxDevocional.livro} {proxDevocional.capitulo}</div>
              </div>
              <div className="play"><i className="fa-solid fa-play"></i></div>
            </button>

            <div className="anel-wrap entrar d3">
              <AnelProgresso feitos={totalFeitos} total={total} />
              <div className="anel-info">
                <strong>{totalFeitos} de {total} dias</strong>
                <span>
                  {totalFeitos === 0 ? `Jornada ${jornada.numero}: ${jornada.titulo}` :
                   jornadaCompleta ? (proximaJornada ? `Completa! A Jornada ${proximaJornada.numero} já te espera 🏆` : 'Completa! A próxima jornada chega no dia 1º 🏆') :
                   sequencia > 1 ? `${sequencia} dias seguidos. Tá voando! 🚀` : 'Volta todo dia pra manter a chama acesa 🔥'}
                </span>
              </div>
            </div>

            <Trilha semanas={jornada.semanas} devocionais={jornada.devocionais} concluidos={feitosDaJornada} diaAtual={proximo} onAbrir={abrir} />

            <section className="apoio">
              <div className="apoio-icone">💜</div>
              <h3>Esse app é gratuito</h3>
              <p>
                Pais, líderes e igrejas: se este devocional abençoou a sua família ou o seu grupo de jovens
                e você quiser ajudar o projeto a continuar, qualquer oferta é recebida com muita gratidão.
              </p>
              <div className="apoio-pix">
                <span className="rotulo">Chave Pix (CNPJ)</span>
                <strong>{PIX_EXIBICAO}</strong>
              </div>
              <button className="btn btn-vidro" style={{ width: '100%' }} onClick={copiarPix}>
                <i className="fa-regular fa-copy"></i> COPIAR CHAVE PIX
              </button>
            </section>

            <button className="trocar-nome" onClick={() => { setRascunho(nome); setTela('nome'); }}>
              Não é {nome}? Trocar nome
            </button>
          </>
        )}

        {tela === 'leitura' && (
          <Leitura
            key={`${jornada.numero}-${dia}`}
            jornada={jornada.numero}
            total={total}
            devocional={devocional}
            conteudo={conteudo}
            concluido={!!feitosDaJornada[dia]}
            temProximo={dia < total}
            onVoltar={() => setTela('trilha')}
            onConcluir={concluir}
            onProximo={() => abrir(dia + 1)}
            onToast={mostrarToast}
          />
        )}
      </div>

      {festa && (
        <Festa
          dia={dia}
          sequencia={sequencia}
          final={jornadaCompleta}
          jornada={jornada.numero}
          temProximaJornada={!!proximaJornada}
          onFechar={() => setFesta(false)}
          onProximo={dia < total ? () => abrir(dia + 1) : proximaJornada ? () => trocarJornada(proximaJornada.numero) : undefined}
        />
      )}

      <div className={`toast ${toast ? 'on' : ''}`}>{toast}</div>
    </>
  );
};

export default App;
