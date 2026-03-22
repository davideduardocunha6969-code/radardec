import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Phone, Bot, Mic, TrendingUp, Upload, CreditCard, Users, Wand2, BarChart3, MessageSquare, Zap, Radio } from "lucide-react";

const sections = [
  {
    id: "funis-kanban",
    icon: TrendingUp,
    title: "Funis e Kanban",
    badge: "CRM Core",
    content: [
      "O usuário cria funis em /crm-outbound informando nome, área de atuação e tipo de ação (Ativo/Receptivo).",
      "Cada funil possui colunas (etapas) que representam os estágios do lead no pipeline.",
      "Colunas podem ser reordenadas via drag-and-drop (ícone ⠿) com persistência automática da ordem no banco de dados.",
      "Funis podem ser Ativados/Desativados via menu de ações (coluna 'ativo' na tabela crm_funis). Funis desativados exibem um Badge indicativo.",
      "A exclusão de funil exige confirmação explícita via AlertDialog para evitar perdas acidentais.",
      "Cada funil pode ter uma equipe configurada (crm_funil_membros) com papéis SDR e Closer.",
      "A configuração de equipe é feita via o menu de ações do funil → 'Configurar Equipe'.",
      "Scripts e Robôs Coach podem ser configurados a nível de funil (SDR e Closer independentes).",
    ],
  },
  {
    id: "importacao-listas",
    icon: Upload,
    title: "Importação de Listas",
    badge: "Dados",
    content: [
      "O usuário faz upload de arquivos Excel (.xlsx) ou CSV diretamente no Kanban do funil.",
      "O sistema abre o ImportMappingDialog que lista todas as colunas do arquivo enviado.",
      "O usuário mapeia cada coluna do arquivo para um campo do sistema (nome, endereço, telefone_1 a telefone_4, ou campos dinâmicos).",
      "Colunas mapeadas para 'telefone_1' até 'telefone_4' são direcionadas diretamente para o array JSONB 'telefones' do lead, NÃO para dados_extras.",
      "Campos dinâmicos (crm_lead_campos) mapeados vão para a coluna JSONB 'dados_extras' do lead.",
      "A inserção em lote é feita via RPC 'bulk_insert_leads' que processa todos os registros de uma vez.",
      "Se houver erro na importação, nenhum lead é inserido (transação atômica) e o usuário é notificado.",
      "Leads importados são colocados na primeira coluna (menor ordem) do funil.",
    ],
  },
  {
    id: "cards-lead",
    icon: CreditCard,
    title: "Cards de Lead",
    badge: "Interface",
    content: [
      "Cada lead é representado por um card no Kanban que pode ser arrastado entre colunas.",
      "Ao clicar no card, abre-se um dialog com abas: Dados, Contatos, SDR e Closer.",
      "A aba 'Dados' exibe campos dinâmicos definidos na tabela 'crm_lead_campos', organizados em seções configuráveis (crm_lead_secoes).",
      "Os valores dos campos dinâmicos são persistidos na coluna JSONB 'dados_extras' do lead.",
      "O campo 'Nome' do lead tem a chave especial '__nome__' e é editável como qualquer outro campo, mas grava diretamente na coluna 'nome' do lead.",
      "Novos campos globais podem ser criados na página de Configurações → Campos do Lead.",
      "O sistema impede criação de campos com nomes duplicados.",
      "A movimentação do lead entre colunas atualiza automaticamente o campo 'etapa_desde' com a data/hora atual.",
    ],
  },
  {
    id: "telefones-contatos",
    icon: Phone,
    title: "Telefones e Contatos",
    badge: "Dados",
    content: [
      "O array JSONB 'telefones' na tabela 'crm_leads' é a ÚNICA fonte de verdade para todos os números do lead.",
      "Cada item do array contém: número, tipo (celular/fixo/comercial) e observação.",
      "Na aba 'Dados' do card, são exibidos 4 slots fixos (Telefone 1 a 4) com número e observação editáveis.",
      "Nas abas SDR e Closer, os telefones aparecem como botões de ação somente-leitura para disparar ligações.",
      "O campo 'observacao' é usado para notas sobre cada telefone (ex: 'WhatsApp principal', 'Horário comercial').",
      "A seção 'Dados de Contato' é preservada na interface mesmo quando não há outros campos dinâmicos configurados.",
      "O Power Dialer utiliza este mesmo array para discagem automática, garantindo consistência.",
    ],
  },
  {
    id: "scripts-roteiros",
    icon: FileText,
    title: "Scripts e Roteiros",
    badge: "Coaching",
    content: [
      "Existem dois tipos de scripts: SDR e Closer, gerenciados na página Robô Coach.",
      "Scripts SDR possuem estrutura livre (lista de itens/perguntas sequenciais).",
      "Scripts Closer possuem estrutura tripartida obrigatória: Apresentação, Qualificação e Fechamento.",
      "Cada item do script pode ter perguntas condicionais via 'sub_items' recursivos.",
      "Sub-itens são filtrados por prefixo: 'SE SIM:', 'SE NÃO:' ou opções específicas de resposta.",
      "Na interface de atendimento, apenas perguntas principais aparecem inicialmente. Sub-itens expandem conforme a resposta do usuário.",
      "Uma pergunta principal com condicionais permanece em sua posição até que todo seu ramo (todos sub-itens visíveis) seja respondido.",
      "O sistema usa verificação recursiva 'isFullyCompleted' para determinar quando um item está pronto para ser movido.",
      "Cada item pode ter a propriedade 'campo_lead_key' que mapeia a resposta a um campo dinâmico do lead (crm_lead_campos).",
      "Isso permite que respostas capturadas durante atendimento sejam vinculadas ao perfil do lead em 'dados_extras'.",
      "Scripts Closer incluem colunas especiais: 'instrucoes_extrator' (para IA Extratora) e 'instrucoes_lacunas' (para IA de Lacunas).",
    ],
  },
  {
    id: "robo-coach-feedback",
    icon: Bot,
    title: "Robô Coach e Feedback",
    badge: "IA",
    content: [
      "A configuração de Robôs é feita a nível de FUNIL, não por coluna individual.",
      "Cada funil pode ter robôs independentes para SDR e Closer:",
      "→ IA Coach SDR / IA Coach Closer: acompanha o atendimento em tempo real e dá orientações.",
      "→ IA Detectora (Feedback) SDR / Closer: analisa a qualidade do atendimento e gera feedback pós-chamada.",
      "→ Resumo IA: gera resumo automático dos contatos (resumo_ia_contatos).",
      "→ IA Extratora: extrai dados estruturados da conversa com base nas 'instrucoes_extrator' do script.",
      "→ IA de Lacunas: identifica gaps na qualificação com base nas 'instrucoes_lacunas' do script.",
      "→ IA Radar (apenas Closer): monitora objeções em tempo real e sugere contra-argumentos.",
      "Prompts são gerenciados na tabela 'coaching_prompts' com versionamento e flag 'is_active'.",
      "Sessões de coaching são rastreadas na tabela 'coaching_sessions' com estado JSONB.",
    ],
  },
  {
    id: "transcricao-tempo-real",
    icon: Mic,
    title: "Transcrição em Tempo Real",
    badge: "Áudio",
    content: [
      "O sistema captura dois canais de áudio simultaneamente: local (microfone do operador) e remoto (áudio do lead).",
      "A captura local usa navigator.mediaDevices.getUserMedia().",
      "A captura remota usa getRemoteStream() do SDK Twilio (para VoIP) ou captura do ElevenLabs (para WhatsApp).",
      "A transcrição é processada em tempo real via edge function 'transcribe-voice'.",
      "Auto-save automático a cada 30 segundos para evitar perda de dados.",
      "O sistema detecta chamadas órfãs (mais de 5 minutos sem atualização) e permite recuperação.",
      "Transcrições parciais (chamada ainda em andamento) exibem badge 'Parcial' na interface.",
      "Ao encerrar a chamada, a transcrição completa é salva na tabela 'crm_chamadas' (coluna 'transcricao').",
    ],
  },
  {
    id: "ligacao-whatsapp",
    icon: MessageSquare,
    title: "Ligação WhatsApp",
    badge: "Comunicação",
    content: [
      "O fluxo de ligação WhatsApp é acionado com um único clique no Kanban (botão WhatsApp no card do lead).",
      "O sistema usa '1-click flow' com parâmetro autoStart=true na URL para iniciar gravação automaticamente.",
      "Cada sessão recebe um SID único para rastreamento.",
      "O componente de gravação permanece montado de forma fixa na página de Atendimento para evitar resets de streams.",
      "O botão de WhatsApp possui trava de debounce de 2 segundos para evitar disparos duplicados.",
      "O encerramento automático da sessão é validado por: transcrição com mais de 20 caracteres E presença de pelo menos 2 interlocutores.",
      "Ao encerrar, o sistema grava o áudio e registra a chamada em crm_chamadas com canal='whatsapp'.",
      "O token de conversação é obtido via edge function 'elevenlabs-conversation-token'.",
    ],
  },
  {
    id: "ligacao-voip",
    icon: Phone,
    title: "Ligação VoIP (Twilio)",
    badge: "Comunicação",
    content: [
      "Discagem direta via componente VoipDialer integrado na interface do lead.",
      "Utiliza o SDK @twilio/voice-sdk para estabelecer chamadas via navegador.",
      "O token de autenticação é obtido via edge function 'twilio-token'.",
      "A captura de áudio local usa getUserMedia() e o áudio remoto usa getRemoteStream() do Twilio Device.",
      "Cada chamada é registrada automaticamente na tabela 'crm_chamadas' com status, duração e caller_id usado.",
      "O sistema seleciona automaticamente o Caller ID mais apropriado com base no DDD do número discado (Local Presence).",
      "A gravação da chamada é gerenciada server-side pelo Twilio.",
      "O TwiML é gerado pela edge function 'twilio-twiml'.",
    ],
  },
  {
    id: "power-dialer",
    icon: Zap,
    title: "Power Dialer",
    badge: "Automação",
    content: [
      "O Power Dialer automatiza a discagem sequencial de leads em lote.",
      "O tamanho do lote é calculado dinamicamente com base no número de números Twilio ativos na conta (DYNAMIC_BATCH_SIZE).",
      "O sistema ordena os leads para priorizar aqueles com DDD idêntico aos números Twilio disponíveis (Local Presence).",
      "Utiliza AMD (Answering Machine Detection) no modo 'Enable' (assíncrono) para detectar secretárias eletrônicas.",
      "A atualização do lead atendido é feita de forma atômica via 'lead_atendido_id' na sessão.",
      "O sistema implementa retry de até 5 tentativas para capturar os streams de áudio do SDK Twilio.",
      "A interface de atendimento (coaching, scripts, extratores) é renderizada inline em /atendimento-aguardando.",
      "Isso mantém o Twilio Device e os fluxos de mídia na mesma janela, evitando falhas de áudio por popups ou transferência de MediaStreams.",
      "A gravação é iniciada server-side na edge function 'power-dialer-twiml' usando o CallSid da perna outbound.",
      "O status da sessão é atualizado via edge function 'power-dialer-session-status' usando service_role.",
      "A interface exibe em tempo real: status de cada chamada, Caller ID utilizado e badges de compatibilidade de DDD.",
      "O sistema avança automaticamente para o próximo lote ao detectar que todas as chamadas atingiram estados terminais.",
    ],
  },
  {
    id: "extrator-dados",
    icon: Wand2,
    title: "Extrator de Dados",
    badge: "IA",
    content: [
      "O extrator utiliza as 'instrucoes_extrator' definidas no script Closer.",
      "Durante o atendimento, a IA analisa a conversa transcrita e extrai dados estruturados automaticamente.",
      "Os dados extraídos são mapeados para os campos dinâmicos do lead via 'campo_lead_key'.",
      "O painel de extração é exibido na interface de atendimento (aba Closer) em tempo real.",
      "A edge function 'extract-lead-data' processa a extração usando o contexto da conversa.",
      "Os dados extraídos são salvos automaticamente na coluna 'dados_extras' do lead.",
    ],
  },
  {
    id: "calculo-valor-acao",
    icon: BarChart3,
    title: "Cálculo de Valor da Ação",
    badge: "IA",
    content: [
      "Utiliza as 'instrucoes_lacunas' definidas no script Closer.",
      "O painel de lacunas é exibido em tempo real durante o atendimento.",
      "A IA identifica gaps na qualificação do lead com base na conversa e nos dados já preenchidos.",
      "A edge function 'analyze-gaps' processa a análise comparando dados extraídos com requisitos do script.",
      "O painel exibe: lacunas identificadas, dados já obtidos e estimativa do valor potencial da ação.",
      "As lacunas são atualizadas dinamicamente conforme novos dados são extraídos da conversa.",
    ],
  },
  {
    id: "coaching-tempo-real",
    icon: Radio,
    title: "Coaching em Tempo Real",
    badge: "IA",
    content: [
      "O coaching é renderizado na interface de atendimento com múltiplos componentes:",
      "→ Checklist Dinâmico: lista de itens do script que o operador deve cumprir, com marcação automática e manual.",
      "→ Radar de Objeções: monitora a conversa em tempo real e detecta objeções do lead, sugerindo contra-argumentos.",
      "→ Script Condicional Colapsável: exibe o roteiro com expansão dinâmica baseada nas respostas.",
      "A verificação recursiva 'isFullyCompleted' determina quando um item (e todos seus sub-itens) está concluído.",
      "O coaching utiliza a edge function 'coaching-realtime' para processar a conversa em tempo real.",
      "A sessão de coaching é persistida na tabela 'coaching_sessions' para permitir retomada.",
      "O estado do coaching (itens marcados, respostas, objeções detectadas) é salvo em JSONB.",
    ],
  },
  {
    id: "historico-contatos",
    icon: Users,
    title: "Histórico de Contatos",
    badge: "CRM Core",
    content: [
      "Cada chamada (WhatsApp, VoIP ou Power Dialer) é registrada na tabela 'crm_chamadas'.",
      "O registro inclui: canal, status, duração, caller_id usado, número discado, papel (SDR/Closer), tentativa número.",
      "O resumo IA dos contatos é gerado automaticamente via edge function 'resumo-contatos-lead'.",
      "O campo 'resumo_ia_contatos' do lead armazena o resumo consolidado de todas as interações.",
      "O campo 'ultimo_contato_em' é atualizado automaticamente via trigger no banco de dados.",
      "Na aba 'Contatos' do card do lead, o histórico completo de chamadas é exibido com status, data e resumo.",
      "Feedbacks da IA (nota_ia, feedback_ia) são gerados pós-chamada pela edge function 'feedback-chamada'.",
      "O Power Dialer registra adicionalmente o 'power_dialer_session_id' para rastreamento de sessão.",
    ],
  },
];

export default function Funcionalidades() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Funcionalidades do Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Documentação completa de todas as regras e fluxos do CRM Outbound.
        </p>
      </div>

      <div className="grid gap-4">
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
                <AccordionContent className="px-6 pb-4">
                  <ul className="space-y-2">
                    {section.content.map((item, i) => (
                      <li key={i} className={`text-sm text-muted-foreground ${item.startsWith("→") ? "ml-4 list-none" : "list-disc ml-4"}`}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
