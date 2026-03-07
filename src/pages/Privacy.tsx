const Privacy = () => (
  <div className="min-h-screen bg-background text-foreground px-4 py-12 max-w-3xl mx-auto">
    <h1 className="text-3xl font-bold mb-8">Política de Privacidade — Radardec Insights</h1>
    <p className="text-muted-foreground mb-6">Última atualização: 7 de março de 2026</p>

    <section className="space-y-4 mb-8">
      <h2 className="text-xl font-semibold">1. Dados coletados</h2>
      <p>O Radardec Insights coleta exclusivamente dados públicos e métricas de desempenho de contas do Instagram Business que pertencem ao próprio usuário autenticado. Isso inclui: contagem de seguidores, métricas de engajamento, dados de publicações, insights de audiência e estatísticas de alcance disponibilizados pela API oficial da Meta/Instagram.</p>
    </section>

    <section className="space-y-4 mb-8">
      <h2 className="text-xl font-semibold">2. Uso dos dados</h2>
      <p>Todos os dados coletados são utilizados unicamente para fins de análise interna de performance do próprio usuário. As informações são processadas para gerar dashboards, gráficos de evolução e relatórios que auxiliam na tomada de decisões estratégicas de conteúdo.</p>
    </section>

    <section className="space-y-4 mb-8">
      <h2 className="text-xl font-semibold">3. Compartilhamento com terceiros</h2>
      <p>O Radardec Insights <strong>não compartilha, vende ou distribui</strong> nenhum dado coletado com terceiros. Os dados permanecem armazenados de forma segura e são acessíveis apenas pelo próprio usuário.</p>
    </section>

    <section className="space-y-4 mb-8">
      <h2 className="text-xl font-semibold">4. API da Meta/Instagram</h2>
      <p>Este aplicativo utiliza a API oficial da Meta (Instagram Graph API) para acessar dados das contas conectadas. O acesso é feito mediante autorização explícita do usuário via protocolo OAuth, respeitando todas as diretrizes e políticas de uso da plataforma Meta.</p>
    </section>

    <section className="space-y-4 mb-8">
      <h2 className="text-xl font-semibold">5. Segurança</h2>
      <p>Os dados são armazenados em infraestrutura segura com criptografia em trânsito e em repouso. Tokens de acesso são mantidos de forma protegida e nunca expostos ao cliente.</p>
    </section>

    <section className="space-y-4 mb-8">
      <h2 className="text-xl font-semibold">6. Exclusão de dados</h2>
      <p>O usuário pode solicitar a exclusão completa de seus dados a qualquer momento entrando em contato com a equipe do Radardec Insights.</p>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold">7. Contato</h2>
      <p>Para dúvidas sobre esta política, entre em contato pelo e-mail disponível na plataforma.</p>
    </section>
  </div>
);

export default Privacy;
