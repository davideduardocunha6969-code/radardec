import { toPng } from 'html-to-image';
import { type PlanoNode } from '@/hooks/usePlanoComercial';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function groupBySetor(nodes: PlanoNode[]): Record<string, PlanoNode[]> {
  const map: Record<string, PlanoNode[]> = {};
  for (const n of nodes) {
    const setor = n.setor || 'Sem setor';
    if (!map[setor]) map[setor] = [];
    map[setor].push(n);
  }
  return map;
}

function renderPositionRows(nodes: PlanoNode[]): string {
  const grouped = groupBySetor(nodes);
  const sortedSetores = Object.entries(grouped).sort(([, a], [, b]) => b.length - a.length);

  return sortedSetores.map(([setor, items]) => `
    <tr><td colspan="4" style="background:#f1f5f9;font-weight:700;padding:8px 12px;border:1px solid #e2e8f0;">${setor}</td></tr>
    ${items.map(n => {
      const obs = (n.dados_extras as any)?.observacoes || '—';
      return `<tr>
        <td style="padding:6px 12px;border:1px solid #e2e8f0;">${n.label}</td>
        <td style="padding:6px 12px;border:1px solid #e2e8f0;">${n.pessoa_nome || '—'}</td>
        <td style="padding:6px 12px;border:1px solid #e2e8f0;">${n.funil || '—'}</td>
        <td style="padding:6px 12px;border:1px solid #e2e8f0;">${obs}</td>
      </tr>`;
    }).join('')}
  `).join('');
}

export async function printPlanoComercial(nodes: PlanoNode[], flowElement: HTMLElement | null) {
  const posicoes = nodes.filter(n => n.node_type === 'posicao');
  const ocupadas = posicoes.filter(n => n.pessoa_nome && !n.precisa_contratar);
  const pendentes = posicoes.filter(n => !n.pessoa_nome || n.precisa_contratar);
  const dataStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  let flowImageHtml = '';
  if (flowElement) {
    try {
      const imgData = await toPng(flowElement, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        filter: (node: HTMLElement) => {
          const cl = node?.classList;
          if (!cl) return true;
          return !cl.contains('react-flow__minimap') && !cl.contains('react-flow__controls') && !cl.contains('react-flow__background');
        },
      });
      flowImageHtml = `
        <div style="page-break-before:always;margin-top:24px;">
          <h2 style="font-size:18px;margin-bottom:12px;color:#1e293b;">Fluxograma</h2>
          <img src="${imgData}" style="width:100%;max-width:100%;border:1px solid #e2e8f0;border-radius:8px;" />
        </div>
      `;
    } catch {
      flowImageHtml = '<p style="color:#94a3b8;margin-top:24px;">Não foi possível capturar o fluxograma.</p>';
    }
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Plano de Implementação Comercial</title>
  <style>
    @page { size: landscape; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; padding: 20px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .date { font-size: 12px; color: #64748b; margin-bottom: 20px; }
    .summary { display: flex; gap: 16px; margin-bottom: 24px; }
    .summary-card { flex: 1; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .summary-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-card .value { font-size: 28px; font-weight: 700; margin-top: 2px; }
    .green { color: #16a34a; }
    .red { color: #dc2626; }
    h2 { font-size: 18px; margin-bottom: 8px; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    th { background: #1e293b; color: #fff; padding: 8px 12px; text-align: left; }
    td { vertical-align: top; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <h1>Plano de Implementação Comercial</h1>
  <p class="date">${dataStr}</p>

  <div class="summary">
    <div class="summary-card">
      <div class="label">Total de Posições</div>
      <div class="value">${posicoes.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Posições Ocupadas</div>
      <div class="value green">${ocupadas.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Posições Pendentes</div>
      <div class="value red">${pendentes.length}</div>
    </div>
  </div>

  <h2>Posições Ocupadas (${ocupadas.length})</h2>
  <table>
    <thead><tr><th>Cargo</th><th>Pessoa</th><th>Funil</th><th>Observações</th></tr></thead>
    <tbody>${ocupadas.length ? renderPositionRows(ocupadas) : '<tr><td colspan="4" style="padding:12px;color:#94a3b8;">Nenhuma posição ocupada</td></tr>'}</tbody>
  </table>

  <h2>Posições Pendentes (${pendentes.length})</h2>
  <table>
    <thead><tr><th>Cargo</th><th>Pessoa</th><th>Funil</th><th>Observações</th></tr></thead>
    <tbody>${pendentes.length ? renderPositionRows(pendentes) : '<tr><td colspan="4" style="padding:12px;color:#94a3b8;">Nenhuma posição pendente</td></tr>'}</tbody>
  </table>

  ${flowImageHtml}
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    setTimeout(() => printWindow.print(), 300);
  };
}
