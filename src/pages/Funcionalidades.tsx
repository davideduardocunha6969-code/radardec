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
