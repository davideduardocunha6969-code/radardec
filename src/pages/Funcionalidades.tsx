import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Phone, Bot, Mic, TrendingUp, Upload, CreditCard, Users,
  Wand2, BarChart3, MessageSquare, Zap, Radio, Settings, Pencil,
  GripVertical, Plus, Trash2, ArrowRight, Eye, PhoneCall, Calculator,
  FileSearch, HelpCircle, CheckCircle2, AlertTriangle, Star,
} from "lucide-react";

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
        {number}
      </span>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start ml-9">
      <span className="text-primary mt-1">•</span>
      <span className="text-sm text-muted-foreground">{children}</span>
    </div>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="font-semibold text-foreground text-sm mt-4 mb-2 ml-9">{children}</h4>;
}

function ScreenDesc({ children }: { children: React.ReactNode }) {
  return (
    <div className="ml-9 my-2 p-3 rounded-md border border-border bg-muted/30 text-sm text-foreground">
      {children}
    </div>
  );
}

const sections = [
  {
    id: "visao-geral",
    icon: Eye,
    title: "Visão Geral do Fluxo",
    badge: "Início",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">O CRM Outbound segue um fluxo linear que vai da configuração inicial até o atendimento com IA em tempo real:</p>
        <Step number={1}>
          <strong>Criar Funil</strong> → Em <code>/crm-outbound</code>, o administrador cria um funil definindo nome, área de atuação e tipo de ação.
        </Step>
        <Step number={2}>
          <strong>Configurar Equipe</strong> → Atribui SDRs e Closers ao funil via menu de ações → "Equipe".
        </Step>
        <Step number={3}>
          <strong>Criar Colunas</strong> → Dentro do funil, cria as etapas do pipeline (Ex: Sem Contato → Contato Realizado → Agendado → Fechado).
        </Step>
        <Step number={4}>
          <strong>Configurar Scripts e Robôs</strong> → No botão ⚙️ do funil, vincula o Script SDR, Script Closer, Robô Coach SDR, Robô Coach Closer, Robô Feedback SDR e Robô Feedback Closer.
        </Step>
        <Step number={5}>
          <strong>Importar Lista de Leads</strong> → Upload de Excel/CSV com mapeamento de colunas.
        </Step>
        <Step number={6}>
          <strong>Atender Leads</strong> → Via WhatsApp, VoIP individual ou Power Dialer automático.
        </Step>
        <Step number={7}>
          <strong>Coaching em Tempo Real</strong> → Durante a chamada, a tela de atendimento exibe transcrição, script, checklist e radar de objeções.
        </Step>
      </div>
    ),
  },
  {
    id: "criar-funil",
    icon: TrendingUp,
    title: "Passo 1 — Criar e Gerenciar Funis",
    badge: "CRM Core",
    content: (
      <div className="space-y-3">
        <Step number={1}>
          Acesse <code>/crm-outbound</code>. A tela exibe cards de todos os funis criados em grid. Cada card mostra: <strong>nome</strong>, <strong>badge da área</strong> (Previdenciário, Trabalhista, etc.), tipo de ação e descrição.
        </Step>
        <Step number={2}>
          Clique em <strong>"Novo Funil"</strong> (canto superior direito). Preencha:
        </Step>
        <Rule>Nome (obrigatório) — Ex: "Aposentadorias BPC"</Rule>
        <Rule>Área de Atuação (obrigatório) — Previdenciário, Cível, Trabalhista, Bancário ou Outro</Rule>
        <Rule>Tipo de Ação (opcional) — Ex: "Prospecção ativa"</Rule>
        <Rule>Descrição (opcional) — Texto livre</Rule>
        <Step number={3}>
          Ao passar o mouse sobre um card de funil, aparece o ícone <strong>⋮</strong> (três pontos) com as opções:
        </Step>
        <Rule><strong>Equipe</strong> — Abre dialog para selecionar quais perfis são SDRs e quais são Closers deste funil. Usa checkboxes separados por papel.</Rule>
        <Rule><strong>Ativar/Desativar</strong> — Funis desativados exibem badge "Desativado" e continuam visíveis, mas sinalizados.</Rule>
        <Rule><strong>Excluir</strong> — Abre AlertDialog de confirmação: "Essa ação é irreversível. Todos os leads, colunas e dados serão permanentemente excluídos."</Rule>
        <Step number={4}>
          Clique no card para entrar no <strong>Kanban do funil</strong>.
        </Step>
      </div>
    ),
  },
  {
    id: "kanban-colunas",
    icon: GripVertical,
    title: "Passo 2 — Kanban: Colunas e Cards",
    badge: "Interface",
    content: (
      <div className="space-y-3">
        <SubTitle>Tela do Kanban</SubTitle>
        <ScreenDesc>
          <strong>Header:</strong> botão ← Voltar, nome do funil, área de atuação, botão ⚙️ (Configurações do Funil), botão "Importar Lista" e botão "Nova Coluna".
          <br /><br />
          <strong>Corpo:</strong> colunas lado a lado em scroll horizontal. Cada coluna tem:
          <br />— Barra colorida no topo (cor configurável)
          <br />— Ícone ⠿ para drag-and-drop de reordenação da coluna
          <br />— Nome da coluna + badge com contagem de leads
          <br />— Botão ⚡ do <strong>Power Dialer</strong> (aparece apenas se houver leads com telefone naquela coluna)
          <br />— Botão + para adicionar lead manual
          <br />— Botão ✏️ para editar nome/cor da coluna
          <br />— Botão 🗑️ para excluir coluna
          <br /><br />
          <strong>Cards de lead:</strong> Cada card mostra ícone de pessoa + nome. Abaixo: "Cadastrado há X", "Nesta etapa há X", "Sem contato há X" (ou "Sem contato").
          <br />Cards podem ser <strong>arrastados entre colunas</strong>. Ao soltar, aparece um dialog de confirmação: "Mover [nome] de [coluna origem] para [coluna destino]?"
        </ScreenDesc>

        <SubTitle>Botão ⚙️ — Configurações do Funil</SubTitle>
        <ScreenDesc>
          Abre um dialog com 6 seletores organizados em 2 grupos:
          <br /><br />
          <strong>SDR:</strong>
          <br />— Script SDR (lista apenas scripts do tipo 'sdr')
          <br />— Robô Coach SDR (lista robôs coach ativos)
          <br />— Robô Feedback SDR (lista robôs coach ativos)
          <br /><br />
          <strong>Closer:</strong>
          <br />— Script Closer (lista apenas scripts do tipo 'closer')
          <br />— Robô Coach Closer
          <br />— Robô Feedback Closer
          <br /><br />
          <em>Regra importante: a configuração é por funil, NÃO por coluna. Todas as colunas do funil usam a mesma configuração.</em>
        </ScreenDesc>

        <SubTitle>Regras de Reordenação</SubTitle>
        <Rule>Colunas podem ser reordenadas arrastando o ícone ⠿. A nova ordem é salva automaticamente no banco.</Rule>
        <Rule>A coluna com menor 'ordem' é onde os leads importados são inseridos por padrão.</Rule>
      </div>
    ),
  },
  {
    id: "importacao-lista",
    icon: Upload,
    title: "Passo 3 — Importação de Lista (Upload)",
    badge: "Dados",
    content: (
      <div className="space-y-3">
        <Step number={1}>
          No Kanban do funil, clique em <strong>"Importar Lista"</strong>. Abre o dialog de upload.
        </Step>
        <Step number={2}>
          Arraste ou selecione um arquivo <strong>.xlsx ou .csv</strong>. O sistema lê todas as colunas do arquivo e exibe na tela.
        </Step>
        <Step number={3}>
          Para cada coluna do arquivo, o sistema exibe um <strong>seletor de mapeamento</strong> com as opções:
        </Step>
        <Rule><strong>Nome do Lead</strong> (chave especial <code>__nome__</code>) — Campo obrigatório, grava na coluna 'nome' do lead</Rule>
        <Rule><strong>Telefone 1, 2, 3 ou 4</strong> (chave <code>__telefone__</code>) — São direcionados para o array JSONB 'telefones' do lead, NÃO para dados_extras</Rule>
        <Rule><strong>Endereço</strong> — Grava na coluna 'endereco' do lead</Rule>
        <Rule><strong>Campos dinâmicos</strong> — Qualquer campo criado em Configurações → Campos do Lead (ex: "CPF", "Data de Nascimento"). São salvos em 'dados_extras'</Rule>
        <Rule><strong>Ignorar</strong> — A coluna é descartada</Rule>

        <SubTitle>Auto-mapeamento</SubTitle>
        <Rule>O sistema tenta mapear automaticamente colunas com nomes similares. Ex: coluna "telefone" → Telefone 1, coluna "nome_completo" → Nome</Rule>
        <Rule>O matching usa normalização (lowercase, remoção de acentos, underscores)</Rule>

        <Step number={4}>
          Clique em <strong>"Importar"</strong>. O sistema:
        </Step>
        <Rule>Insere todos os leads via RPC <code>bulk_insert_leads</code> (transação atômica — se um falhar, nenhum é inserido)</Rule>
        <Rule>Coloca todos na <strong>primeira coluna</strong> (menor ordem) do funil</Rule>
        <Rule>Exibe toast: "X leads importados com sucesso!"</Rule>
        <Rule>Se houver erro: "Nenhum lead foi importado. Corrija o problema e tente novamente."</Rule>

        <SubTitle>Regras dos Telefones na Importação</SubTitle>
        <Rule>Até 4 colunas podem ser mapeadas como telefone (Telefone 1 a 4)</Rule>
        <Rule>Cada telefone é inserido como objeto no array: <code>{`{ numero, tipo: "celular", observacao: "" }`}</code></Rule>
        <Rule>Telefones vazios na planilha são ignorados (não criam entrada vazia)</Rule>
      </div>
    ),
  },
  {
    id: "card-lead-detail",
    icon: CreditCard,
    title: "Passo 4 — Card do Lead (Tela ao Clicar)",
    badge: "Interface",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Ao clicar em um card no Kanban, abre um <strong>Dialog em tela cheia</strong> com abas:</p>

        <SubTitle>Aba "Dados" (primeira aba)</SubTitle>
        <ScreenDesc>
          <strong>Seção "Dados de Contato":</strong>
          <br />— 4 slots fixos (Telefone 1 a 4), cada um com campo "Número" e campo "Observação"
          <br />— Editáveis diretamente. Ao sair do campo, salva automaticamente
          <br /><br />
          <strong>Seções dinâmicas:</strong>
          <br />— Campos definidos em Configurações → Campos do Lead, organizados por seções (crm_lead_secoes)
          <br />— Tipos suportados: texto, data, número, sim/não, seleção
          <br />— O campo "Nome" tem chave especial <code>__nome__</code> e grava na coluna 'nome' do lead (não em dados_extras)
          <br />— Todos os outros campos gravam em 'dados_extras' (JSONB)
          <br /><br />
          <strong>Mover para outra etapa:</strong>
          <br />— Seletor no topo permite mover o lead para qualquer coluna do funil
          <br />— Ao mover, o campo 'etapa_desde' é atualizado para a data/hora atual
        </ScreenDesc>

        <SubTitle>Aba "Contatos" (histórico)</SubTitle>
        <ScreenDesc>
          <strong>Resumo IA:</strong> Resumo automático consolidado de todas as interações (gerado pela edge function 'resumo-contatos-lead')
          <br /><br />
          <strong>Histórico de Chamadas:</strong>
          <br />— Lista todas as chamadas (WhatsApp, VoIP, Power Dialer) com: data, duração, canal, status, número discado, caller_id usado
          <br />— Chamadas com status "interrompida" exibem badge amarelo "Parcial" (áudio recuperado de chamada órfã)
          <br />— Cada chamada pode ter: transcrição, resumo IA, feedback IA e nota IA
          <br /><br />
          <strong>Último contato:</strong> atualizado automaticamente via trigger no banco
        </ScreenDesc>

        <SubTitle>Aba "Atendimento SDR"</SubTitle>
        <ScreenDesc>
          Lista todos os telefones como <strong>botões de ação somente-leitura</strong>:
          <br />— Botão <strong>WhatsApp AI</strong> → Abre tela de atendimento com gravação e coaching (1-click flow)
          <br />— Botão <strong>VoIP</strong> → Abre tela de atendimento com discagem Twilio e coaching
          <br />— Botão <strong>WhatsApp direto</strong> → Abre wa.me no navegador
          <br /><br />
          Os botões passam o parâmetro <code>papel=sdr</code> na URL, garantindo que o script e coach SDR sejam carregados.
        </ScreenDesc>

        <SubTitle>Aba "Atendimento Closer"</SubTitle>
        <ScreenDesc>
          Mesma estrutura da aba SDR, mas com <code>papel=closer</code>.
          <br />Carrega o Script Closer e Robô Coach Closer configurados no funil.
          <br />Inclui os painéis laterais de: Extrator de Dados, Lacunas e Estimativa de Valores.
        </ScreenDesc>

        <SubTitle>Aba "Agenda"</SubTitle>
        <ScreenDesc>
          Exibe eventos da agenda vinculados ao lead. Permite agendar reuniões, follow-ups, etc.
        </ScreenDesc>
      </div>
    ),
  },
  {
    id: "tela-atendimento",
    icon: PhoneCall,
    title: "Passo 5 — Tela de Atendimento (Chamada Ativa)",
    badge: "Central",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Quando o operador clica em WhatsApp AI ou VoIP na aba SDR/Closer, abre a <strong>tela de atendimento</strong> (<code>/atendimento</code>):</p>

        <SubTitle>Header da Tela</SubTitle>
        <ScreenDesc>
          Fundo com gradiente primário contendo:
          <br />— Logo do escritório
          <br />— Nome do lead + endereço
          <br />— Badge "SDR" ou "Closer" (conforme o papel)
          <br />— Badge "Power Dialer" (se aplicável)
          <br />— Badge vermelho pulsante "Gravando" quando a chamada está ativa
          <br />— Número discado
        </ScreenDesc>

        <SubTitle>Barra de Contexto</SubTitle>
        <ScreenDesc>
          Abaixo do header, uma barra fina exibe todos os dados_extras do lead como pills:
          <br />Ex: <code>cpf: 123.456.789-00</code> | <code>data_admissao: 01/03/2020</code> | <code>salario: R$ 3.500</code>
          <br />Também exibe o resumo_caso se existir.
        </ScreenDesc>

        <SubTitle>Gravador (WhatsApp ou VoIP)</SubTitle>
        <ScreenDesc>
          <strong>WhatsApp AI:</strong> Componente WhatsAppCallRecorder que inicia gravação automaticamente (autoStart=true), captura áudio local (microfone) e do sistema.
          <br /><br />
          <strong>VoIP:</strong> Componente VoipDialer que disca via Twilio SDK, captura getUserMedia + getRemoteStream.
          <br /><br />
          Em ambos os casos, o auto-save ocorre a cada 30 segundos.
        </ScreenDesc>

        <SubTitle>Painel de Coaching (aparece quando gravação inicia)</SubTitle>
        <ScreenDesc>
          O painel principal ocupa toda a área abaixo do gravador e contém vários cards lado a lado:
          <br /><br />
          <strong>1. Card de Transcrição</strong>
          <br />— Exibe a transcrição em tempo real, separada por interlocutor (Operador / Lead)
          <br />— Usa ElevenLabs Scribe para transcrição contínua
          <br />— Badge "Parcial" enquanto a chamada está ativa
          <br /><br />
          <strong>2. Card do Script/Roteiro</strong> (detalhes na seção seguinte)
          <br /><br />
          <strong>3. Cards RECA / RALOCA / RADOVECA</strong> (detalhes na seção de coaching)
          <br /><br />
          <strong>4. Card Radar de Objeções</strong> (apenas Closer — detalhes adiante)
        </ScreenDesc>

        <SubTitle>Painéis Laterais (ícones flutuantes à direita)</SubTitle>
        <ScreenDesc>
          Três ícones flutuantes na lateral direita da tela que abrem painéis deslizantes:
          <br /><br />
          <strong>🔍 Extrator de Dados:</strong> Exibe dados extraídos automaticamente da conversa pela IA
          <br />— Usa as 'instrucoes_extrator' do script
          <br />— Campos mapeados via 'campo_lead_key' são preenchidos automaticamente nos dados_extras do lead
          <br /><br />
          <strong>❓ Lacunas:</strong> Mostra gaps na qualificação identificados pela IA
          <br />— Usa as 'instrucoes_lacunas' do script
          <br />— Atualiza dinamicamente conforme dados são extraídos
          <br />— Invocado apenas quando há ≥3 lacunas com impacto financeiro
          <br /><br />
          <strong>🧮 Estimativa de Valores:</strong> Cálculo em tempo real do valor potencial da ação
          <br />— Usa motor de cálculo trabalhista v5.2 (107 campos)
          <br />— Valores de fallback: Salário R$ 2.000, Duração 24 meses
        </ScreenDesc>
      </div>
    ),
  },
  {
    id: "scripts-detalhes",
    icon: FileText,
    title: "Passo 6 — Como o Script Aparece na Tela",
    badge: "Coaching",
    content: (
      <div className="space-y-3">
        <SubTitle>Script SDR</SubTitle>
        <ScreenDesc>
          O card de Script SDR exibe as seções na ordem:
          <br /><br />
          <strong>1. Apresentação</strong> — Itens de abertura da ligação (cumprimento, apresentação do escritório)
          <br /><strong>2. Qualificação</strong> — Perguntas para qualificar o lead
          <br /><strong>3. Show Rate</strong> — 9 pilares para reduzir absenteísmo:
          <br />&nbsp;&nbsp;&nbsp;&nbsp;Reafirmação, Antecipação, Autoridade, Ambiente, Inclusão Familiar,
          <br />&nbsp;&nbsp;&nbsp;&nbsp;Microcompromisso, Exclusividade, Imprevistos, Confirmação
          <br /><br />
          Cada item aparece como uma linha com checkbox. O operador marca manualmente quando concluiu a fala.
        </ScreenDesc>

        <SubTitle>Script Closer</SubTitle>
        <ScreenDesc>
          Estrutura tripartida obrigatória:
          <br /><br />
          <strong>1. Apresentação</strong> — Abertura do atendimento
          <br /><strong>2. Qualificação</strong> — Perguntas com lógica condicional
          <br /><strong>3. Fechamento</strong> — Técnicas de fechamento
          <br /><br />
          O script Closer também inclui campos especiais:
          <br />— <code>instrucoes_extrator</code>: prompt para a IA Extratora de Dados
          <br />— <code>instrucoes_lacunas</code>: prompt para a IA de Lacunas
        </ScreenDesc>

        <SubTitle>Perguntas Condicionais (SE SIM / SE NÃO)</SubTitle>
        <ScreenDesc>
          Cada pergunta do script pode ter <strong>sub_items</strong> (recursivos):
          <br /><br />
          <strong>Funcionamento na tela:</strong>
          <br />1. Apenas perguntas principais aparecem inicialmente
          <br />2. Quando o operador responde "Sim", aparecem os sub-itens prefixados com "SE SIM:"
          <br />3. Quando responde "Não", aparecem os sub-itens prefixados com "SE NÃO:"
          <br />4. Sub-itens podem ter seus próprios sub-itens (recursão)
          <br /><br />
          <strong>Regra de posicionamento:</strong>
          <br />— Uma pergunta principal com condicionais permanece em sua posição original até que TODO seu ramo (todos sub-itens visíveis) seja respondido
          <br />— A função <code>isFullyCompleted</code> verifica recursivamente se o item e todos os filhos foram concluídos
          <br />— Itens concluídos são exibidos com estilo <code>line-through</code> e movidos para o final da lista
          <br /><br />
          <strong>Mapeamento de dados:</strong>
          <br />— Cada pergunta pode ter <code>campo_lead_key</code> que vincula a resposta a um campo dinâmico do lead
          <br />— Ex: pergunta "Qual a data de admissão?" com campo_lead_key="data_admissao" → a resposta é salva em dados_extras.data_admissao
        </ScreenDesc>
      </div>
    ),
  },
  {
    id: "script-closer-completo",
    icon: FileText,
    title: "Script Closer — Motorista de Caminhão (Completo)",
    badge: "Script Real",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Script real cadastrado no sistema com <strong>6 falas de apresentação</strong>, <strong>74 perguntas de qualificação</strong> (171 campos com sub-itens) e <strong>6 falas de fechamento</strong>.
        </p>

        <SubTitle>Etapa 1 — Apresentação (6 itens)</SubTitle>
        <ScreenDesc>
                    <strong>Apresentação pessoal</strong><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Bom dia/Boa tarde, [Nome]! Meu nome é [Closer], sou advogado(a) especialista em Direito Trabalhista do Motorista. Tudo bem com o(a) senhor(a)?</span><br />
                    <strong>Contexto da ligação</strong><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Nosso escritório foi procurado porque identificamos que o(a) senhor(a) pode ter direitos trabalhistas que não foram respeitados durante o vínculo de emprego como motorista.</span><br />
                    <strong>Objetivo do atendimento</strong><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Essa conversa é uma análise gratuita e sigilosa. Vou fazer algumas perguntas sobre a sua rotina de trabalho para entender se há algo a ser corrigido.</span><br />
                    <strong>Expectativa de tempo</strong><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Vai levar cerca de 20 a 30 minutos, tá bem? Se em algum momento não souber responder, pode ficar tranquilo, é só me dizer que a gente pula.</span><br />
                    <strong>Consentimento</strong><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Posso gravar essa ligação para fins de registro interno? É apenas para nosso controle.</span><br />
                    <strong>Transição</strong><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Perfeito! Vamos começar com alguns dados básicos.</span><br />
        </ScreenDesc>

        <SubTitle>Etapa 2 — Qualificação Técnica (74 perguntas principais / 171 campos totais)</SubTitle>
        <ScreenDesc>
                    <strong>P1 — Data de nascimento</strong> <code className="text-[10px] bg-muted px-1 rounded">data_nascimento</code> <span className="text-[10px] text-muted-foreground italic">[data]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Qual a sua data de nascimento?</span><br />
                    <strong>P2 — Data de admissão</strong> <code className="text-[10px] bg-muted px-1 rounded">data_admissao</code> <span className="text-[10px] text-muted-foreground italic">[data]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Qual foi a data de admissão na empresa?</span><br />
                    <strong>P3 — Contrato ativo?</strong> <code className="text-[10px] bg-muted px-1 rounded">contrato_ativo</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ O contrato ainda está ativo ou já foi encerrado?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE NÃO: Data de desligamento</strong> <code className="text-[10px] bg-muted px-1 rounded">data_demissao</code> <span className="text-[10px] text-muted-foreground italic">[data]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual foi a data de desligamento?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE NÃO: Modalidade</strong> <code className="text-[10px] bg-muted px-1 rounded">modalidade_desligamento</code> <span className="text-[10px] text-muted-foreground italic">[selecao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Como foi o desligamento? (sem justa causa, pediu conta, acordo, justa causa)</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[10px] text-muted-foreground ml-4">Opções: Sem justa causa | Pediu conta | Acordo | Justa causa</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE NÃO: Aviso prévio trabalhado?</strong> <code className="text-[10px] bg-muted px-1 rounded">aviso_previo_trabalhado</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Cumpriu aviso prévio trabalhado?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE NÃO: Aviso prévio indenizado?</strong> <code className="text-[10px] bg-muted px-1 rounded">aviso_previo_indenizado</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ O aviso prévio foi indenizado?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE NÃO: Dias de aviso pago</strong> <code className="text-[10px] bg-muted px-1 rounded">dias_aviso_previo_efetivamente_pago</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quantos dias de aviso prévio foram efetivamente pagos?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE NÃO: Rescisão paga em 10 dias?</strong> <code className="text-[10px] bg-muted px-1 rounded">rescisao_paga_10_dias</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ A rescisão foi paga dentro do prazo de 10 dias?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE NÃO: Verbas atrasadas?</strong> <code className="text-[10px] bg-muted px-1 rounded">verbas_incontroversas_atrasadas</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Há verbas incontroversas atrasadas?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Valor</strong> <code className="text-[10px] bg-muted px-1 rounded">valor_verbas_incontroversas</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual o valor aproximado?</span><br />
                    <strong>P12 — Função na CTPS</strong> <code className="text-[10px] bg-muted px-1 rounded">funcao_ctps</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Qual a função registrada na sua CTPS?</span><br />
                    <strong>P13 — Descarregava caminhão?</strong> <code className="text-[10px] bg-muted px-1 rounded">descarregava_caminhao</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Além de dirigir, o senhor também descarregava o caminhão?</span><br />
                    <strong>P14 — Fazia abastecimento?</strong> <code className="text-[10px] bg-muted px-1 rounded">fazia_abastecimento</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Fazia o abastecimento do veículo?</span><br />
                    <strong>P15 — Higienização do veículo?</strong> <code className="text-[10px] bg-muted px-1 rounded">fazia_higienizacao_veiculo</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Fazia higienização/limpeza do veículo?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Tempo (min/dia)</strong> <code className="text-[10px] bg-muted px-1 rounded">tempo_higienizacao_minutos_dia</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quanto tempo por dia gastava nisso?</span><br />
                    <strong>P17 — Fazia manutenção?</strong> <code className="text-[10px] bg-muted px-1 rounded">fazia_manutencao</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Fazia manutenção básica do veículo?</span><br />
                    <strong>P18 — Tarefas extras exigidas</strong> <code className="text-[10px] bg-muted px-1 rounded">tarefas_extras_exigidas</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Havia outras tarefas além de dirigir que eram exigidas?</span><br />
                    <strong>P19 — Tipo de veículo</strong> <code className="text-[10px] bg-muted px-1 rounded">tipo_veiculo</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Qual o tipo de veículo que dirigia? (truck, carreta, bi-trem, etc.)</span><br />
                    <strong>P20 — Equiparação salarial?</strong> <code className="text-[10px] bg-muted px-1 rounded">existe_equiparacao</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Havia algum colega que exercia a mesma função e ganhava mais?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Nome do colega</strong> <code className="text-[10px] bg-muted px-1 rounded">colega_salario_maior</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual o nome desse colega?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Salário do colega</strong> <code className="text-[10px] bg-muted px-1 rounded">salario_paradigma</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quanto esse colega ganhava?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Tempo na função (anos)</strong> <code className="text-[10px] bg-muted px-1 rounded">tempo_paradigma_na_funcao_anos</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Há quanto tempo esse colega está na mesma função?</span><br />
                    <strong>P24 — Foi transferido?</strong> <code className="text-[10px] bg-muted px-1 rounded">foi_transferido</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ O senhor foi transferido de local em algum momento?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Definitiva?</strong> <code className="text-[10px] bg-muted px-1 rounded">transferencia_definitiva</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ A transferência foi definitiva?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Meses transferido</strong> <code className="text-[10px] bg-muted px-1 rounded">meses_transferido</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Por quantos meses ficou transferido?</span><br />
                    <strong>P27 — Salário CTPS mensal</strong> <code className="text-[10px] bg-muted px-1 rounded">salario_ctps_mensal</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Qual o salário registrado na CTPS?</span><br />
                    <strong>P28 — Recebia holerite?</strong> <code className="text-[10px] bg-muted px-1 rounded">holerite_existe</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia holerite detalhado?</span><br />
                    <strong>P29 — Comissão habitual?</strong> <code className="text-[10px] bg-muted px-1 rounded">comissao_habitual</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia comissão habitualmente?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Média mensal</strong> <code className="text-[10px] bg-muted px-1 rounded">media_comissao_mensal</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual era a média mensal de comissão?</span><br />
                    <strong>P31 — Prêmio habitual?</strong> <code className="text-[10px] bg-muted px-1 rounded">premio_habitual</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia prêmio habitualmente?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Média mensal</strong> <code className="text-[10px] bg-muted px-1 rounded">media_premio_mensal</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual era a média mensal do prêmio?</span><br />
                    <strong>P33 — Gratificação habitual?</strong> <code className="text-[10px] bg-muted px-1 rounded">gratificacao_habitual</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia gratificação habitualmente?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Média mensal</strong> <code className="text-[10px] bg-muted px-1 rounded">media_gratificacao_mensal</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual era a média mensal?</span><br />
                    <strong>P35 — Diárias habitual?</strong> <code className="text-[10px] bg-muted px-1 rounded">diarias_habitual</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia diárias habitualmente?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Média mensal</strong> <code className="text-[10px] bg-muted px-1 rounded">media_diarias_mensal</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual era a média mensal de diárias?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Fixas ou variáveis?</strong> <code className="text-[10px] bg-muted px-1 rounded">diarias_fixas_ou_variaveis</code> <span className="text-[10px] text-muted-foreground italic">[selecao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ As diárias eram fixas ou variáveis?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[10px] text-muted-foreground ml-4">Opções: Fixas | Variáveis</span><br />
                    <strong>P38 — Ajuda de custo habitual?</strong> <code className="text-[10px] bg-muted px-1 rounded">ajuda_custo_habitual</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia ajuda de custo?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Média mensal</strong> <code className="text-[10px] bg-muted px-1 rounded">media_ajuda_custo_mensal</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual era a média mensal?</span><br />
                    <strong>P40 — Recebia por fora?</strong> <code className="text-[10px] bg-muted px-1 rounded">recebia_por_fora</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia algum valor por fora do holerite?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Valor médio mensal</strong> <code className="text-[10px] bg-muted px-1 rounded">valor_por_fora_mensal_medio</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual era o valor médio mensal?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Forma de pagamento</strong> <code className="text-[10px] bg-muted px-1 rounded">forma_pagamento_por_fora</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Como era pago? (pix, dinheiro, envelope)</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Denominação</strong> <code className="text-[10px] bg-muted px-1 rounded">denominacao_por_fora</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Como chamavam esse pagamento?</span><br />
                    <strong>P44 — Gratificação de função?</strong> <code className="text-[10px] bg-muted px-1 rounded">recebia_gratificacao_funcao</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia gratificação de função?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Tempo recebendo (anos)</strong> <code className="text-[10px] bg-muted px-1 rounded">tempo_recebendo_gratificacao_anos</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Por quantos anos recebeu?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Foi suprimida?</strong> <code className="text-[10px] bg-muted px-1 rounded">gratificacao_foi_suprimida</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ A gratificação foi suprimida?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Data da supressão</strong> <code className="text-[10px] bg-muted px-1 rounded">data_supressao_gratificacao</code> <span className="text-[10px] text-muted-foreground italic">[data]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quando foi suprimida?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Valor suprimido</strong> <code className="text-[10px] bg-muted px-1 rounded">valor_gratificacao_suprimida</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual era o valor?</span><br />
                    <strong>P49 — Hora início média</strong> <code className="text-[10px] bg-muted px-1 rounded">hora_inicio_media</code> <span className="text-[10px] text-muted-foreground italic">[horario]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ A que horas normalmente começava a trabalhar?</span><br />
                    <strong>P50 — Hora fim média</strong> <code className="text-[10px] bg-muted px-1 rounded">hora_fim_media</code> <span className="text-[10px] text-muted-foreground italic">[horario]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ A que horas normalmente terminava?</span><br />
                    <strong>P51 — Variação de horário</strong> <code className="text-[10px] bg-muted px-1 rounded">variacao_horario</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ O horário variava muito ou era mais ou menos fixo?</span><br />
                    <strong>P52 — Regime semanal</strong> <code className="text-[10px] bg-muted px-1 rounded">regime_semanal_contratual</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Qual era o regime semanal contratual? (5x2, 6x1, escala)</span><br />
                    <strong>P53 — Intervalo refeição?</strong> <code className="text-[10px] bg-muted px-1 rounded">fazia_intervalo_refeicao</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Fazia intervalo para refeição?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Quanto tempo (min)?</strong> <code className="text-[10px] bg-muted px-1 rounded">intervalo_refeicao_minutos_medio</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quanto tempo de intervalo em média?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Menor que 1 hora?</strong> <code className="text-[10px] bg-muted px-1 rounded">intervalo_menor_1hora</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ O intervalo era menor que 1 hora?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Intervalo real (min)</strong> <code className="text-[10px] bg-muted px-1 rounded">intervalo_real_minutos</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quantos minutos era o intervalo real?</span><br />
                    <strong>P57 — Descanso entre jornadas (h)</strong> <code className="text-[10px] bg-muted px-1 rounded">descanso_entre_jornadas_horas_medio</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Quantas horas de descanso tinha entre uma jornada e outra?</span><br />
                    <strong>P58 — Violação interjornada?</strong> <code className="text-[10px] bg-muted px-1 rounded">violacao_interjornada</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Acontecia de não ter as 11 horas de descanso entre jornadas?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Frequência</strong> <code className="text-[10px] bg-muted px-1 rounded">frequencia_violacao_interjornada</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Com que frequência isso acontecia?</span><br />
                    <strong>P60 — Descanso coincidia com pausa condução?</strong> <code className="text-[10px] bg-muted px-1 rounded">descanso_coincidia_com_pausa_conducao</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ O descanso entre jornadas coincidia com a pausa obrigatória de condução?</span><br />
                    <strong>P61 — Pausa 30min direção?</strong> <code className="text-[10px] bg-muted px-1 rounded">fazia_pausa_30min_direcao</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Fazia a pausa de 30 minutos a cada 5h30 de direção?</span><br />
                    <strong>P62 — Dirigia após 22h?</strong> <code className="text-[10px] bg-muted px-1 rounded">dirigia_apos_22</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Costumava dirigir após as 22h?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Horas noturnas/dia</strong> <code className="text-[10px] bg-muted px-1 rounded">horas_noturnas_dia_media</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quantas horas por dia em média?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Adicional noturno pago?</strong> <code className="text-[10px] bg-muted px-1 rounded">adicional_noturno_pago</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia adicional noturno?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Valor mensal</strong> <code className="text-[10px] bg-muted px-1 rounded">valor_noturno_pago_mensal</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quanto recebia por mês?</span><br />
                    <strong>P66 — Trabalhava domingos?</strong> <code className="text-[10px] bg-muted px-1 rounded">trabalhava_domingos</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Trabalhava aos domingos?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Domingos/mês</strong> <code className="text-[10px] bg-muted px-1 rounded">domingos_trabalhados_mes_medio</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quantos domingos por mês em média?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Folga compensatória?</strong> <code className="text-[10px] bg-muted px-1 rounded">recebia_folga_compensatoria</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia folga compensatória?</span><br />
                    <strong>P69 — Pagava horas extras?</strong> <code className="text-[10px] bg-muted px-1 rounded">pagava_horas_extras</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ A empresa pagava horas extras?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Horas/mês</strong> <code className="text-[10px] bg-muted px-1 rounded">horas_extras_pagas_horas_mes_media</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quantas horas extras eram pagas por mês?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Percentual pago</strong> <code className="text-[10px] bg-muted px-1 rounded">percentual_hora_extra_pago</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual o percentual pago? (50%, 100%)</span><br />
                    <strong>P72 — Banco de horas?</strong> <code className="text-[10px] bg-muted px-1 rounded">banco_horas</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Tinha banco de horas?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Recebia extrato?</strong> <code className="text-[10px] bg-muted px-1 rounded">recebia_extrato_banco</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia extrato do banco de horas?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Assinava compensações?</strong> <code className="text-[10px] bg-muted px-1 rounded">assinava_compensacoes</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Assinava acordos de compensação?</span><br />
                    <strong>P75 — Aguardava carga/descarga?</strong> <code className="text-[10px] bg-muted px-1 rounded">ficava_aguardando_carga_descarga</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Ficava aguardando carga ou descarga?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Tempo espera (h/dia)</strong> <code className="text-[10px] bg-muted px-1 rounded">tempo_espera_carga_descarga_horas_dia_medio</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quanto tempo em média por dia?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Era pago?</strong> <code className="text-[10px] bg-muted px-1 rounded">tempo_espera_era_pago</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Esse tempo era pago?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Percentual pago</strong> <code className="text-[10px] bg-muted px-1 rounded">percentual_pago_tempo_espera</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual percentual era pago?</span><br />
                    <strong>P79 — Barreiras fiscais?</strong> <code className="text-[10px] bg-muted px-1 rounded">ficava_em_barreiras_fiscais</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Ficava parado em barreiras fiscais?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Tempo (h/dia)</strong> <code className="text-[10px] bg-muted px-1 rounded">tempo_fiscalizacao_barreira_horas_dia_medio</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quanto tempo em média?</span><br />
                    <strong>P81 — Fila de balança?</strong> <code className="text-[10px] bg-muted px-1 rounded">ficava_em_fila_balanca</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Ficava em fila de balança?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Tempo (h/dia)</strong> <code className="text-[10px] bg-muted px-1 rounded">tempo_balanca_horas_dia_medio</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quanto tempo em média?</span><br />
                    <strong>P83 — Dormia no veículo?</strong> <code className="text-[10px] bg-muted px-1 rounded">dormia_no_veiculo</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Dormia no veículo?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Obrigatório permanecer?</strong> <code className="text-[10px] bg-muted px-1 rounded">era_obrigatorio_permanecer</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Era obrigatório permanecer no veículo?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Horas berço/dia</strong> <code className="text-[10px] bg-muted px-1 rounded">horas_berco_dia_medio</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quantas horas no berço por dia em média?</span><br />
                    <strong>P86 — Viagens longa distância?</strong> <code className="text-[10px] bg-muted px-1 rounded">fazia_viagens_longa_distancia</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Fazia viagens de longa distância?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Duração média (dias)</strong> <code className="text-[10px] bg-muted px-1 rounded">duracao_media_viagem_dias</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual a duração média de cada viagem?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Semanas/mês</strong> <code className="text-[10px] bg-muted px-1 rounded">semanas_em_viagem_por_mes_media</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quantas semanas por mês ficava em viagem?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Repouso semanal na viagem?</strong> <code className="text-[10px] bg-muted px-1 rounded">repouso_semanal_concedido_na_viagem</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Tinha repouso semanal durante a viagem?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Repouso fracionado?</strong> <code className="text-[10px] bg-muted px-1 rounded">repouso_semanal_era_fracionado</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ O repouso era fracionado?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Períodos/mês</strong> <code className="text-[10px] bg-muted px-1 rounded">periodos_fracionados_mes_medio</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quantos períodos fracionados por mês?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Acumulava repousos?</strong> <code className="text-[10px] bg-muted px-1 rounded">empresa_acumulava_repousos</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ A empresa acumulava repousos?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Máx consecutivos</strong> <code className="text-[10px] bg-muted px-1 rounded">repousos_acumulados_consecutivos_maximo</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual o máximo de repousos acumulados consecutivos?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Repouso com veículo em movimento?</strong> <code className="text-[10px] bg-muted px-1 rounded">repouso_era_feito_com_veiculo_em_movimento</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ O repouso era feito com o veículo em movimento?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Horas inválidas/dia</strong> <code className="text-[10px] bg-muted px-1 rounded">horas_repouso_invalido_dia_medio</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quantas horas de repouso inválido por dia?</span><br />
                    <strong>P96 — Sobreaviso?</strong> <code className="text-[10px] bg-muted px-1 rounded">ficava_de_sobreaviso</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Ficava de sobreaviso?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Obrigação atender?</strong> <code className="text-[10px] bg-muted px-1 rounded">tinha_obrigacao_atender_chamado</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Tinha obrigação de atender o chamado?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Horas/dia</strong> <code className="text-[10px] bg-muted px-1 rounded">horas_sobreaviso_dia_medio</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quantas horas de sobreaviso por dia?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Recebia pagamento?</strong> <code className="text-[10px] bg-muted px-1 rounded">recebia_sobreaviso</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia pelo sobreaviso?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Valor pago</strong> <code className="text-[10px] bg-muted px-1 rounded">valor_sobreaviso_pago</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual o valor pago?</span><br />
                    <strong>P101 — Carga perigosa?</strong> <code className="text-[10px] bg-muted px-1 rounded">transportava_carga_perigosa</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Transportava carga perigosa (inflamáveis, químicos, explosivos)?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Periculosidade paga?</strong> <code className="text-[10px] bg-muted px-1 rounded">periculosidade_paga</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia adicional de periculosidade?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Percentual pago</strong> <code className="text-[10px] bg-muted px-1 rounded">percentual_periculosidade_pago</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual percentual era pago?</span><br />
                    <strong>P104 — Abastecimento frequente?</strong> <code className="text-[10px] bg-muted px-1 rounded">fazia_abastecimento_frequente</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Fazia abastecimento com frequência (contato com combustíveis)?</span><br />
                    <strong>P105 — Câmara fria?</strong> <code className="text-[10px] bg-muted px-1 rounded">trabalhava_camara_fria</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Trabalhava com câmara fria?</span><br />
                    <strong>P106 — Insalubridade paga?</strong> <code className="text-[10px] bg-muted px-1 rounded">insalubridade_paga</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia adicional de insalubridade?</span><br />
                    <strong>P107 — Ruído excessivo?</strong> <code className="text-[10px] bg-muted px-1 rounded">exposto_ruido_excessivo</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Era exposto a ruído excessivo?</span><br />
                    <strong>P108 — Vibração constante?</strong> <code className="text-[10px] bg-muted px-1 rounded">vibracao_constante</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Sofria vibração constante do veículo?</span><br />
                    <strong>P109 — Percentual insalubridade</strong> <code className="text-[10px] bg-muted px-1 rounded">percentual_insalubridade_pago</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Qual percentual de insalubridade era pago (se aplicável)?</span><br />
                    <strong>P113 — Férias regulares?</strong> <code className="text-[10px] bg-muted px-1 rounded">ferias_regulares</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Gozou férias regularmente?</span><br />
                    <strong>P114 — Férias pagas 2 dias antes?</strong> <code className="text-[10px] bg-muted px-1 rounded">ferias_pagas_2_dias_antes</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ As férias eram pagas com 2 dias de antecedência?</span><br />
                    <strong>P115 — Férias vencidas não gozadas?</strong> <code className="text-[10px] bg-muted px-1 rounded">ferias_vencidas_nao_gozadas</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Tem férias vencidas que não gozou?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Quantos períodos?</strong> <code className="text-[10px] bg-muted px-1 rounded">periodos_ferias_vencidos_nao_gozados</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quantos períodos de férias vencidos?</span><br />
                    <strong>P117 — 13º base real?</strong> <code className="text-[10px] bg-muted px-1 rounded">decimo_terceiro_base_real</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ O 13º salário era calculado sobre a remuneração real (incluindo extras)?</span><br />
                    <strong>P118 — FGTS correto?</strong> <code className="text-[10px] bg-muted px-1 rounded">fgts_depositado_corretamente</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ O FGTS era depositado corretamente sobre toda a remuneração?</span><br />
                    <strong>P119 — Deslocamento até pátio?</strong> <code className="text-[10px] bg-muted px-1 rounded">precisava_deslocamento_ate_patio</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Precisava se deslocar até o pátio da empresa para pegar o veículo?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Vale transporte?</strong> <code className="text-[10px] bg-muted px-1 rounded">recebia_vale_transporte</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia vale transporte?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Custo mensal</strong> <code className="text-[10px] bg-muted px-1 rounded">custo_medio_transporte_mensal</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual o custo médio mensal de transporte?</span><br />
                    <strong>P122 — Plano de saúde?</strong> <code className="text-[10px] bg-muted px-1 rounded">tinha_plano_saude_empresa</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Tinha plano de saúde pela empresa?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Contribuía?</strong> <code className="text-[10px] bg-muted px-1 rounded">contribuia_plano</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Contribuía com o plano?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Manteve após demissão?</strong> <code className="text-[10px] bg-muted px-1 rounded">empresa_manteve_plano_pos_demissao</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ A empresa manteve o plano após a demissão?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Custo mensal</strong> <code className="text-[10px] bg-muted px-1 rounded">custo_plano_mensal</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual o custo mensal do plano?</span><br />
                    <strong>P126 — Guias seguro desemprego?</strong> <code className="text-[10px] bg-muted px-1 rounded">recebeu_guias_seguro_desemprego</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Recebeu as guias do seguro desemprego?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE NÃO: Conseguiu receber?</strong> <code className="text-[10px] bg-muted px-1 rounded">conseguiu_receber_seguro</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Conseguiu receber o seguro desemprego?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE NÃO: Valor parcelas perdidas</strong> <code className="text-[10px] bg-muted px-1 rounded">valor_parcelas_seguro_perdidas</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual o valor das parcelas perdidas?</span><br />
                    <strong>P129 — Descontos indevidos?</strong> <code className="text-[10px] bg-muted px-1 rounded">empresa_fazia_descontos_indevidos</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ A empresa fazia descontos indevidos no salário?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Tipo de desconto</strong> <code className="text-[10px] bg-muted px-1 rounded">tipo_desconto_indevido</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Que tipo de desconto?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Valor médio mensal</strong> <code className="text-[10px] bg-muted px-1 rounded">valor_medio_desconto_mensal</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual o valor médio mensal?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Assinava autorização?</strong> <code className="text-[10px] bg-muted px-1 rounded">assinava_autorizacao_desconto</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Assinava autorização para os descontos?</span><br />
                    <strong>P133 — Trabalhava para transportadora?</strong> <code className="text-[10px] bg-muted px-1 rounded">trabalhava_para_transportadora</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Trabalhava para uma transportadora terceirizada?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Nome da tomadora</strong> <code className="text-[10px] bg-muted px-1 rounded">nome_empresa_tomadora</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual o nome da empresa tomadora dos serviços?</span><br />
                    <strong>P135 — Houve acidente?</strong> <code className="text-[10px] bg-muted px-1 rounded">houve_acidente</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Sofreu algum acidente de trabalho?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Tipo</strong> <code className="text-[10px] bg-muted px-1 rounded">tipo_acidente</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Que tipo de acidente?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Data</strong> <code className="text-[10px] bg-muted px-1 rounded">data_acidente</code> <span className="text-[10px] text-muted-foreground italic">[data]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quando aconteceu?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Houve CAT?</strong> <code className="text-[10px] bg-muted px-1 rounded">houve_cat</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Foi emitida a CAT?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Houve afastamento?</strong> <code className="text-[10px] bg-muted px-1 rounded">houve_afastamento</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Houve afastamento?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Período (meses)</strong> <code className="text-[10px] bg-muted px-1 rounded">periodo_afastamento_meses</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Por quanto tempo ficou afastado?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Auxílio INSS?</strong> <code className="text-[10px] bg-muted px-1 rounded">recebia_auxilio_doenca_inss</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Recebia auxílio doença do INSS?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Valor</strong> <code className="text-[10px] bg-muted px-1 rounded">valor_auxilio_recebido</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual o valor recebido?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Sequela atual</strong> <code className="text-[10px] bg-muted px-1 rounded">sequela_atual</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Ficou com alguma sequela?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Capacidade laboral</strong> <code className="text-[10px] bg-muted px-1 rounded">capacidade_laboral_atual</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Como está sua capacidade de trabalho hoje?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Gravidade</strong> <code className="text-[10px] bg-muted px-1 rounded">gravidade_sequela</code> <span className="text-[10px] text-muted-foreground italic">[selecao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual a gravidade da sequela? (leve, moderada, grave)</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[10px] text-muted-foreground ml-4">Opções: Leve | Moderada | Grave</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Laudos médicos?</strong> <code className="text-[10px] bg-muted px-1 rounded">tem_laudos_medicos</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Tem laudos médicos?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: % incapacidade</strong> <code className="text-[10px] bg-muted px-1 rounded">percentual_incapacidade</code> <span className="text-[10px] text-muted-foreground italic">[numero]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual o percentual de incapacidade?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Gastos médicos?</strong> <code className="text-[10px] bg-muted px-1 rounded">gastos_medicos_comprovados</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Teve gastos médicos comprovados?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Valor</strong> <code className="text-[10px] bg-muted px-1 rounded">valor_gastos_medicos</code> <span className="text-[10px] text-muted-foreground italic">[valor]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual o valor total?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Alta médica?</strong> <code className="text-[10px] bg-muted px-1 rounded">teve_alta_medica</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Teve alta médica?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Data da alta</strong> <code className="text-[10px] bg-muted px-1 rounded">data_alta_medica</code> <span className="text-[10px] text-muted-foreground italic">[data]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Quando foi a alta?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Demissão em 12m?</strong> <code className="text-[10px] bg-muted px-1 rounded">demissao_dentro_12m_alta</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Foi demitido dentro de 12 meses após a alta?</span><br />
                    <strong>P153 — Doença ocupacional?</strong> <code className="text-[10px] bg-muted px-1 rounded">doenca_ocupacional</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Desenvolveu alguma doença relacionada ao trabalho?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Tipo</strong> <code className="text-[10px] bg-muted px-1 rounded">tipo_doenca_ocupacional</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual doença?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Tem diagnóstico?</strong> <code className="text-[10px] bg-muted px-1 rounded">tem_diagnostico_doenca</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Tem diagnóstico médico?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Em tratamento?</strong> <code className="text-[10px] bg-muted px-1 rounded">esta_em_tratamento</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Está em tratamento?</span><br />
                    <strong>P157 — Assédio moral?</strong> <code className="text-[10px] bg-muted px-1 rounded">sofreu_assedio_moral</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Sofreu assédio moral no trabalho?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Frequência</strong> <code className="text-[10px] bg-muted px-1 rounded">frequencia_assedio</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Com que frequência?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Gravidade</strong> <code className="text-[10px] bg-muted px-1 rounded">gravidade_assedio</code> <span className="text-[10px] text-muted-foreground italic">[selecao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ Qual a gravidade? (leve, moderado, grave)</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[10px] text-muted-foreground ml-4">Opções: Leve | Moderado | Grave</span><br />
                    <strong>P160 — Revista íntima?</strong> <code className="text-[10px] bg-muted px-1 rounded">sofreu_revista_intima</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Sofreu revista íntima?</span><br />
                    <strong>P161 — Motivo dispensa suspeito?</strong> <code className="text-[10px] bg-muted px-1 rounded">motivo_real_dispensa_suspeito</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Suspeita que o real motivo da dispensa foi diferente do informado?</span><br />
                    <strong>P162 — Indícios discriminação?</strong> <code className="text-[10px] bg-muted px-1 rounded">indicios_discriminacao</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Há indícios de discriminação na dispensa?</span><br />
                    <strong>P163 — Jornada superior 12h?</strong> <code className="text-[10px] bg-muted px-1 rounded">jornada_habitual_superior_12h</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ A jornada habitual era superior a 12 horas?</span><br />
                    <strong>P164 — Períodos fora de casa</strong> <code className="text-[10px] bg-muted px-1 rounded">periodos_fora_de_casa</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Quanto tempo ficava fora de casa por viagem?</span><br />
                    <strong>P165 — Impacto familiar</strong> <code className="text-[10px] bg-muted px-1 rounded">impacto_familiar_declarado</code> <span className="text-[10px] text-muted-foreground italic">[texto]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Esse regime de trabalho impactou sua vida familiar? Como?</span><br />
                    <strong>P166 — Holerites disponíveis?</strong> <code className="text-[10px] bg-muted px-1 rounded">holerites_disponiveis</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Tem holerites disponíveis?</span><br />
                    <strong>P167 — Veículo tinha tacógrafo?</strong> <code className="text-[10px] bg-muted px-1 rounded">veiculo_tinha_tacografo</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ O veículo tinha tacógrafo?</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>SE SIM: Acesso aos dados?</strong> <code className="text-[10px] bg-muted px-1 rounded">motorista_tem_acesso_dados_tacografo</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-muted-foreground">&nbsp;&nbsp;→ O senhor tem acesso aos dados do tacógrafo?</span><br />
                    <strong>P169 — Registros digitais?</strong> <code className="text-[10px] bg-muted px-1 rounded">registros_digitais_disponiveis</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Tem registros digitais (fotos, prints, mensagens)?</span><br />
                    <strong>P170 — Testemunhas?</strong> <code className="text-[10px] bg-muted px-1 rounded">testemunhas_disponiveis</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Tem testemunhas que possam confirmar a situação?</span><br />
                    <strong>P171 — Empresa atrasa salário?</strong> <code className="text-[10px] bg-muted px-1 rounded">empresa_atrasa_salario</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ A empresa atrasa salário com frequência?</span><br />
                    <strong>P172 — Não deposita FGTS?</strong> <code className="text-[10px] bg-muted px-1 rounded">empresa_nao_deposita_fgts</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ A empresa não deposita o FGTS?</span><br />
                    <strong>P173 — Jornada excessiva?</strong> <code className="text-[10px] bg-muted px-1 rounded">empresa_exige_jornada_excessiva</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ A empresa exige jornada excessiva sistematicamente?</span><br />
                    <strong>P174 — Condições degradantes?</strong> <code className="text-[10px] bg-muted px-1 rounded">condicoes_degradantes</code> <span className="text-[10px] text-muted-foreground italic">[sim_nao]</span><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Existem condições degradantes de trabalho?</span><br />
        </ScreenDesc>

        <SubTitle>Etapa 3 — Fechamento (6 itens)</SubTitle>
        <ScreenDesc>
                    <strong>Transição para fechamento</strong><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ [Nome], com base em tudo que conversamos, identifiquei [X] pontos que merecem atenção jurídica no seu caso.</span><br />
                    <strong>Resumo dos direitos</strong><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Vou resumir os principais pontos: [listar 3-5 principais direitos identificados]. Esses são direitos previstos na CLT e na Lei do Motorista.</span><br />
                    <strong>Proposta de valor</strong><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Nosso escritório é especializado exatamente nesse tipo de caso. Trabalhamos com honorários apenas no êxito — ou seja, você não paga nada se não ganhar.</span><br />
                    <strong>Próximos passos</strong><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ O próximo passo seria agendar uma reunião para apresentar a análise completa e, se fizer sentido, dar entrada na ação. Posso agendar para quando?</span><br />
                    <strong>Documentação necessária</strong><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Para a próxima etapa, seria ideal ter em mãos: CTPS, holerites, TRCT (rescisão) e qualquer outro documento que tenha. Consegue reunir?</span><br />
                    <strong>Confirmação</strong><br />
                    <span className="text-muted-foreground">&nbsp;&nbsp;→ Perfeito! Então fica agendado para [data/hora]. Vou enviar uma mensagem confirmando. Muito obrigado(a) pela confiança, [Nome]!</span><br />
        </ScreenDesc>
      </div>
    ),
  },
  {
    id: "coaching-reca-raloca",
    icon: Star,
    title: "Passo 7 — Cards RECA, RALOCA e RADOVECA",
    badge: "Coaching",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Os cards de coaching são <strong>checklists dinâmicos</strong> que acompanham a performance do operador em tempo real.
          A detecção automática via IA é <strong>limitada a esses cards</strong> — itens do roteiro (Apresentação, Qualificação, Show Rate/Fechamento) são marcados manualmente.
        </p>

        <SubTitle>Card RECA (SDR)</SubTitle>
        <ScreenDesc>
          Checklist de boas práticas de atendimento SDR. Itens marcados automaticamente pela IA quando detecta que a fala foi realizada.
          <br /><br />
          A <strong>IA Detectora</strong> (google/gemini-2.5-flash) analisa a transcrição e identifica falas concluídas.
          <br />A <strong>IA Coach</strong> (google/gemini-3-flash-preview) gerencia o ciclo de vida e marca "DITO" nos itens.
          <br /><br />
          Itens concluídos: estilo <code>line-through</code>, resumidos para economizar espaço, movidos para o final da lista.
        </ScreenDesc>

        <SubTitle>Card RALOCA (SDR)</SubTitle>
        <ScreenDesc>
          Checklist similar ao RECA, mas com itens focados em rapport, localização e captura de atenção.
          <br />Mesma lógica de detecção automática via IA.
        </ScreenDesc>

        <SubTitle>Card RADOVECA / Objeções (SDR e Closer)</SubTitle>
        <ScreenDesc>
          Checklist para tratamento de objeções. Quando a IA detecta uma objeção do lead na transcrição, o item correspondente é destacado com sugestão de contra-argumento.
          <br /><br />
          Para SDR: integrado ao checklist do Show Rate (9 pilares).
          <br />Para Closer: exibido no Card Radar de Objeções com monitoramento contínuo.
        </ScreenDesc>

        <SubTitle>Comportamento Visual dos Cards</SubTitle>
        <Rule>Cards possuem altura flexível que se ajusta ao conteúdo</Rule>
        <Rule>Itens concluídos são <strong>resumidos</strong> (texto encurtado) e movidos para o final</Rule>
        <Rule>As próximas falas sugeridas ficam sempre no topo</Rule>
        <Rule>O contêiner principal gerencia a rolagem da página</Rule>
        <Rule>Estado salvo em JSONB na tabela 'coaching_sessions' para permitir retomada</Rule>
      </div>
    ),
  },
  {
    id: "radar-objecoes",
    icon: AlertTriangle,
    title: "Passo 8 — Radar de Objeções (Closer)",
    badge: "IA",
    content: (
      <div className="space-y-3">
        <ScreenDesc>
          Card dedicado que monitora a conversa em tempo real e detecta objeções do lead.
          <br /><br />
          <strong>Funcionamento:</strong>
          <br />1. A IA analisa a transcrição continuamente buscando padrões de objeção
          <br />2. Quando detecta, exibe: tipo da objeção + contra-argumento sugerido
          <br />3. O operador pode marcar a objeção como "tratada"
          <br /><br />
          <strong>Exemplos de objeções detectadas:</strong>
          <br />— "Preciso pensar" → Sugestão: técnica de urgência
          <br />— "Está caro" → Sugestão: ancoragem de valor
          <br />— "Vou falar com meu cônjuge" → Sugestão: inclusão familiar
          <br /><br />
          Disponível <strong>apenas para Closers</strong>. O radar usa a IA Radar vinculada ao robô coach do funil.
        </ScreenDesc>
      </div>
    ),
  },
  {
    id: "ligacao-whatsapp",
    icon: MessageSquare,
    title: "Ligação WhatsApp — Fluxo Completo",
    badge: "Comunicação",
    content: (
      <div className="space-y-3">
        <Step number={1}>
          Operador clica no botão <strong>"WhatsApp AI"</strong> na aba SDR ou Closer do card do lead.
        </Step>
        <Step number={2}>
          O sistema navega para <code>/atendimento</code> com parâmetros: <code>leadId, numero, tipo=whatsapp, papel=sdr|closer, autoStart=true, sid=[uuid único]</code>
        </Step>
        <Step number={3}>
          O componente WhatsAppCallRecorder monta <strong>fixo na página</strong> e inicia gravação automaticamente.
        </Step>
        <Rule>Trava de <strong>debounce de 2 segundos</strong> no botão para evitar disparos duplicados</Rule>
        <Rule>Token de conversação obtido via edge function 'elevenlabs-conversation-token'</Rule>
        <Rule>Gravação permanece montada de forma fixa para evitar resets de streams ou prompts de permissão</Rule>
        <Step number={4}>
          Durante a chamada: transcrição em tempo real + coaching + auto-save a cada 30s.
        </Step>
        <Step number={5}>
          Encerramento automático validado por:
        </Step>
        <Rule>Transcrição com mais de <strong>20 caracteres</strong></Rule>
        <Rule>Presença de pelo menos <strong>2 interlocutores</strong> na transcrição</Rule>
        <Step number={6}>
          Ao encerrar: áudio salvo, chamada registrada em crm_chamadas com <code>canal='whatsapp'</code>.
        </Step>
      </div>
    ),
  },
  {
    id: "ligacao-voip",
    icon: Phone,
    title: "Ligação VoIP Individual — Fluxo Completo",
    badge: "Comunicação",
    content: (
      <div className="space-y-3">
        <Step number={1}>
          Operador clica no botão <strong>"VoIP"</strong> na aba SDR ou Closer do card do lead.
        </Step>
        <Step number={2}>
          O sistema navega para <code>/atendimento</code> com <code>tipo=voip</code>.
        </Step>
        <Step number={3}>
          O componente VoipDialer:
        </Step>
        <Rule>Obtém token via edge function 'twilio-token'</Rule>
        <Rule>Inicializa o Twilio Device SDK no navegador</Rule>
        <Rule>Disca para o número do lead</Rule>
        <Rule>Seleciona automaticamente o <strong>Caller ID</strong> com DDD mais próximo do número discado (Local Presence)</Rule>
        <Step number={4}>
          Captura de áudio:
        </Step>
        <Rule><code>getUserMedia()</code> → áudio local (microfone do operador)</Rule>
        <Rule><code>getRemoteStream()</code> do Twilio Device → áudio remoto (lead)</Rule>
        <Step number={5}>
          TwiML gerado pela edge function 'twilio-twiml'. Gravação server-side pelo Twilio.
        </Step>
        <Step number={6}>
          Chamada registrada automaticamente em crm_chamadas com: status, duração, caller_id_usado, ddd_destino, ddd_caller.
        </Step>
      </div>
    ),
  },
  {
    id: "power-dialer",
    icon: Zap,
    title: "Power Dialer — Fluxo Completo",
    badge: "Automação",
    content: (
      <div className="space-y-3">
        <Step number={1}>
          No Kanban, o botão ⚡ aparece no header de cada coluna que tenha leads com telefone. Clique para iniciar o Power Dialer para aquela coluna.
        </Step>
        <Step number={2}>
          O sistema calcula o <strong>tamanho do lote</strong> dinamicamente com base no número de números Twilio ativos na conta (DYNAMIC_BATCH_SIZE).
        </Step>
        <Step number={3}>
          Os leads são <strong>ordenados por prioridade de DDD</strong>: leads com DDD idêntico aos números Twilio disponíveis são discados primeiro (Local Presence).
        </Step>
        <Step number={4}>
          O operador é redirecionado para <code>/atendimento-aguardando</code>:
        </Step>

        <SubTitle>Tela de Aguardo (/atendimento-aguardando)</SubTitle>
        <ScreenDesc>
          <strong>Header:</strong> Logo, badge "Power Dialer", botão "Encerrar Sessão"
          <br /><br />
          <strong>Painel de status do lote:</strong>
          <br />— Cards para cada lead do lote atual mostrando:
          <br />&nbsp;&nbsp;&nbsp;&nbsp;• Nome do lead
          <br />&nbsp;&nbsp;&nbsp;&nbsp;• Número discado + formatação (XX) XXXXX-XXXX
          <br />&nbsp;&nbsp;&nbsp;&nbsp;• Status em tempo real: Iniciando → Chamando → Atendeu/Não atendeu/Ocupado/Falhou
          <br />&nbsp;&nbsp;&nbsp;&nbsp;• Caller ID utilizado pelo Twilio
          <br />&nbsp;&nbsp;&nbsp;&nbsp;• Badge de compatibilidade de DDD (✓ verde se DDD match)
          <br /><br />
          <strong>Barra de progresso:</strong> Lote X de Y — X leads processados
        </ScreenDesc>

        <Step number={5}>
          O Twilio disca todos os leads do lote simultaneamente. Usa <strong>AMD (Answering Machine Detection)</strong> modo "Enable" (assíncrono) para detectar secretárias eletrônicas sem delay na conexão.
        </Step>
        <Step number={6}>
          Quando um lead atende, o sistema:
        </Step>
        <Rule>Seleciona o lead "vencedor" via <strong>atualização atômica</strong> (<code>.is("lead_atendido_id", null)</code>)</Rule>
        <Rule>Cancela as chamadas concorrentes em paralelo (fire-and-forget)</Rule>
        <Rule>Conecta a ponte de áudio em menos de 1 segundo</Rule>
        <Rule>Inicia gravação server-side com o CallSid da perna outbound</Rule>
        <Step number={7}>
          A interface de atendimento (coaching, scripts, extratores) é renderizada <strong>inline na mesma janela</strong> de aguardo. Isso é OBRIGATÓRIO porque:
        </Step>
        <Rule>Mantém o Twilio Device e os fluxos de mídia na mesma janela</Rule>
        <Rule>Evita falhas de áudio causadas por bloqueadores de popup</Rule>
        <Rule>MediaStreams não podem ser transferidos entre abas</Rule>
        <Rule>Retry de até 5 tentativas para capturar os streams de áudio do SDK</Rule>
        <Step number={8}>
          Ao encerrar a chamada, o sistema avança automaticamente para o próximo lote quando todas as chamadas atingirem estados terminais sem atendimento.
        </Step>

        <SubTitle>Regras de Gravação no Power Dialer</SubTitle>
        <Rule>A gravação é iniciada na edge function 'power-dialer-twiml' usando o <strong>CallSid da perna outbound</strong> (Twilio para o lead)</Rule>
        <Rule>O CallSid recebido pelo navegador (evento 'incoming') pertence à perna inbound — são diferentes!</Rule>
        <Rule>O callback de status da gravação aponta para 'twilio-webhook'</Rule>
      </div>
    ),
  },
  {
    id: "transcricao-tempo-real",
    icon: Mic,
    title: "Transcrição em Tempo Real — Detalhes",
    badge: "Áudio",
    content: (
      <div className="space-y-3">
        <ScreenDesc>
          A transcrição é exibida no card de transcrição dentro do painel de coaching, separando as falas por interlocutor.
        </ScreenDesc>

        <SubTitle>Captura de Áudio</SubTitle>
        <Rule><strong>Canal local</strong> (operador): <code>navigator.mediaDevices.getUserMedia()</code></Rule>
        <Rule><strong>Canal remoto</strong> (lead): <code>getRemoteStream()</code> do Twilio SDK (VoIP) ou captura do ElevenLabs (WhatsApp)</Rule>

        <SubTitle>Processamento</SubTitle>
        <Rule>Transcrição via ElevenLabs Scribe com commit strategy configurável</Rule>
        <Rule>O painel de coaching monta imediatamente ao iniciar gravação (~1s), independente da disponibilidade do coach</Rule>
        <Rule>As análises de coaching aguardam o carregamento dos dados do banco (lead → funil → robos_coach), que pode levar até 5s</Rule>

        <SubTitle>Auto-save e Recuperação</SubTitle>
        <Rule>Auto-save automático a cada <strong>30 segundos</strong></Rule>
        <Rule>O hook <code>useCleanupOrphanedChamadas</code> detecta chamadas órfãs (estagnadas em 'em_chamada' ou 'iniciando' por mais de 5 minutos)</Rule>
        <Rule>Chamadas órfãs são marcadas como 'interrompida' e o processamento de transcrição é disparado para os áudios parciais</Rule>
        <Rule>No histórico, chamadas recuperadas exibem badge amarelo <strong>"Parcial"</strong> com tooltip explicativo</Rule>
      </div>
    ),
  },
  {
    id: "extrator-lacunas",
    icon: Wand2,
    title: "Extrator de Dados e Lacunas — Detalhes",
    badge: "IA",
    content: (
      <div className="space-y-3">
        <SubTitle>Extrator de Dados</SubTitle>
        <ScreenDesc>
          Painel lateral acessível pelo ícone 🔍 flutuante na tela de atendimento.
          <br /><br />
          <strong>Funcionamento:</strong>
          <br />1. A IA lê a transcrição em andamento + dados já existentes do lead
          <br />2. Usa as <code>instrucoes_extrator</code> definidas no Script Closer como prompt
          <br />3. Extrai dados estruturados e os mapeia para campos via <code>campo_lead_key</code>
          <br />4. Campos extraídos são salvos automaticamente em <code>dados_extras</code> do lead
          <br />5. O painel exibe os dados extraídos em tempo real, editáveis pelo operador
          <br /><br />
          Edge function: <code>extract-lead-data</code>
        </ScreenDesc>

        <SubTitle>Análise de Lacunas</SubTitle>
        <ScreenDesc>
          Painel lateral acessível pelo ícone ❓ flutuante.
          <br /><br />
          <strong>Funcionamento:</strong>
          <br />1. Usa as <code>instrucoes_lacunas</code> do Script Closer como prompt
          <br />2. Compara dados extraídos com os campos necessários para o motor de cálculo (107 campos v5.2)
          <br />3. Identifica quais dados ainda faltam e seu impacto no cálculo
          <br />4. Invocado <strong>apenas quando há ≥3 lacunas com impacto financeiro</strong>
          <br /><br />
          <strong>Valores de fallback</strong> para campos críticos ainda não preenchidos:
          <br />— Salário: R$ 2.000
          <br />— Duração: 24 meses
          <br /><br />
          Edge function: <code>analyze-gaps</code>
        </ScreenDesc>

        <SubTitle>Estimativa de Valores</SubTitle>
        <ScreenDesc>
          Painel lateral acessível pelo ícone 🧮 flutuante.
          <br /><br />
          Calcula em tempo real o valor potencial da ação com base nos dados já extraídos, usando o motor de cálculo trabalhista integrado.
        </ScreenDesc>
      </div>
    ),
  },
  {
    id: "historico-contatos",
    icon: Users,
    title: "Histórico de Contatos e Feedback IA",
    badge: "CRM Core",
    content: (
      <div className="space-y-3">
        <SubTitle>O que é registrado em cada chamada</SubTitle>
        <Rule>Canal: whatsapp, voip ou power_dialer</Rule>
        <Rule>Status: iniciando → em_chamada → finalizada / nao_atendida / interrompida / etc.</Rule>
        <Rule>Duração em segundos</Rule>
        <Rule>Caller ID usado (número Twilio)</Rule>
        <Rule>Número discado + DDD destino + DDD caller</Rule>
        <Rule>Papel: SDR ou Closer</Rule>
        <Rule>Tentativa número (para Power Dialer)</Rule>
        <Rule>Power Dialer Session ID (para rastreamento)</Rule>

        <SubTitle>Processamento pós-chamada</SubTitle>
        <Rule><strong>Transcrição</strong> salva na coluna 'transcricao' da tabela crm_chamadas</Rule>
        <Rule><strong>Resumo IA</strong> gerado pela edge function 'resumo-contatos-lead' e salvo em 'resumo_ia' da chamada + consolidado em 'resumo_ia_contatos' do lead</Rule>
        <Rule><strong>Feedback IA</strong> gerado pela edge function 'feedback-chamada' com nota (0-10) e análise detalhada</Rule>
        <Rule>O feedback SDR suporta 12 seções: Nota, RECA, RALOCA, RADOVECA, etc. com rendering Markdown e tabelas</Rule>

        <SubTitle>Chamadas órfãs</SubTitle>
        <Rule>Chamadas estagnadas por mais de 5 minutos são marcadas como 'interrompida'</Rule>
        <Rule>Se há áudio parcial (auto-save 30s), o sistema dispara processamento assíncrono</Rule>
        <Rule>Badge amarelo "Parcial" no histórico + tooltip explicando que a gravação pode estar incompleta</Rule>
      </div>
    ),
  },
  {
    id: "campos-configuracoes",
    icon: Settings,
    title: "Configurações — Campos do Lead",
    badge: "Admin",
    content: (
      <div className="space-y-3">
        <Step number={1}>
          Acesse <code>/configuracoes</code> → aba "Campos do Lead".
        </Step>
        <Step number={2}>
          A tela exibe todos os campos dinâmicos criados (tabela crm_lead_campos), organizados por seções.
        </Step>
        <Step number={3}>
          Para criar um novo campo: clique "Novo Campo", informe o nome. A chave interna é gerada automaticamente via <code>normalizeKey</code> (lowercase, sem acentos, underscores).
        </Step>
        <Rule>O sistema impede criação de campos com <strong>nomes duplicados</strong></Rule>
        <Rule>Campos podem ser organizados em <strong>seções</strong> (crm_lead_secoes) via drag-and-drop</Rule>
        <Rule>Excluir um campo remove a definição globalmente, mas os dados já salvos em dados_extras permanecem</Rule>
        <Rule>Esses campos aparecem: no card do lead (aba Dados), no mapeamento de importação e no mapeamento de scripts (campo_lead_key)</Rule>
      </div>
    ),
  },
  {
    id: "scripts-robos-config",
    icon: Bot,
    title: "Configuração de Scripts e Robôs Coach",
    badge: "Admin",
    content: (
      <div className="space-y-3">
        <Step number={1}>
          Acesse <strong>Robô Coach</strong> no menu lateral. A tela tem 2 abas: SDR e Closer.
        </Step>

        <SubTitle>Scripts SDR</SubTitle>
        <Rule>Seções: Apresentação, Qualificação, Show Rate (9 pilares RADOVECA)</Rule>
        <Rule>Cada item pode ter sub_items recursivos para lógica condicional</Rule>
        <Rule>Cada item pode ter campo_lead_key para mapear a resposta a um dado do lead</Rule>

        <SubTitle>Scripts Closer</SubTitle>
        <Rule>Estrutura tripartida: Apresentação, Qualificação, Fechamento</Rule>
        <Rule>Campo especial: <code>instrucoes_extrator</code> — prompt para IA Extratora</Rule>
        <Rule>Campo especial: <code>instrucoes_lacunas</code> — prompt para IA de Lacunas</Rule>

        <SubTitle>Robôs Coach</SubTitle>
        <Rule>Gerenciados na mesma página, vinculados ao funil via Configurações do Funil (⚙️)</Rule>
        <Rule>Prompts versionados na tabela coaching_prompts com flag is_active</Rule>
        <Rule>Sessões persistidas em coaching_sessions (JSONB) para retomada</Rule>

        <SubTitle>Nomenclatura unificada</SubTitle>
        <Rule><strong>RECA</strong> — Rapport, Empatia, Confiança, Ação</Rule>
        <Rule><strong>RALOCA</strong> — Rapport, Atenção, Localização, Captura</Rule>
        <Rule><strong>RADOVECA</strong> — Reafirmação, Antecipação, Dor, Objeção, Valor, Exclusividade, Compromisso, Ação</Rule>
      </div>
    ),
  },
];

export default function Funcionalidades() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Funcionalidades do Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Guia completo passo a passo de todas as telas, regras e fluxos do CRM Outbound.
        </p>
      </div>

      <div className="grid gap-3">
        <Accordion type="multiple" className="space-y-3">
          {sections.map((section) => (
            <AccordionItem key={section.id} value={section.id} className="border-none">
              <Card>
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <section.icon className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">{section.title}</span>
                    <Badge variant="secondary" className="ml-2">{section.badge}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  {section.content}
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
