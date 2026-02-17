export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_prompts: {
        Row: {
          created_at: string
          descricao: string | null
          formato_origem: string | null
          formato_saida: string | null
          id: string
          nome: string
          prompt: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          formato_origem?: string | null
          formato_saida?: string | null
          id?: string
          nome: string
          prompt: string
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          formato_origem?: string | null
          formato_saida?: string | null
          id?: string
          nome?: string
          prompt?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analises_curriculo: {
        Row: {
          created_at: string
          curriculo_id: string
          id: string
          match_experiencia: Json | null
          match_formacao: Json | null
          match_skills: Json | null
          pontos_fortes: string[] | null
          pontos_fracos: string[] | null
          processado_em: string | null
          prompt_usado: string | null
          recomendacao: string | null
          resposta_ia: Json | null
          score_calculado: number | null
          user_id: string
          vaga_id: string
        }
        Insert: {
          created_at?: string
          curriculo_id: string
          id?: string
          match_experiencia?: Json | null
          match_formacao?: Json | null
          match_skills?: Json | null
          pontos_fortes?: string[] | null
          pontos_fracos?: string[] | null
          processado_em?: string | null
          prompt_usado?: string | null
          recomendacao?: string | null
          resposta_ia?: Json | null
          score_calculado?: number | null
          user_id: string
          vaga_id: string
        }
        Update: {
          created_at?: string
          curriculo_id?: string
          id?: string
          match_experiencia?: Json | null
          match_formacao?: Json | null
          match_skills?: Json | null
          pontos_fortes?: string[] | null
          pontos_fracos?: string[] | null
          processado_em?: string | null
          prompt_usado?: string | null
          recomendacao?: string | null
          resposta_ia?: Json | null
          score_calculado?: number | null
          user_id?: string
          vaga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analises_curriculo_curriculo_id_fkey"
            columns: ["curriculo_id"]
            isOneToOne: false
            referencedRelation: "curriculos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analises_curriculo_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas_recrutamento"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimentos_closers: {
        Row: {
          analises_ia: Json | null
          audio_url: string | null
          created_at: string
          dados_atendimento: Json | null
          dados_cliente: Json | null
          data_atendimento: string
          duracao_segundos: number | null
          erro_mensagem: string | null
          id: string
          segmentos: Json | null
          status: string
          transcricao_texto: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analises_ia?: Json | null
          audio_url?: string | null
          created_at?: string
          dados_atendimento?: Json | null
          dados_cliente?: Json | null
          data_atendimento?: string
          duracao_segundos?: number | null
          erro_mensagem?: string | null
          id?: string
          segmentos?: Json | null
          status?: string
          transcricao_texto?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analises_ia?: Json | null
          audio_url?: string | null
          created_at?: string
          dados_atendimento?: Json | null
          dados_cliente?: Json | null
          data_atendimento?: string
          duracao_segundos?: number | null
          erro_mensagem?: string | null
          id?: string
          segmentos?: Json | null
          status?: string
          transcricao_texto?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      atividades_anexos: {
        Row: {
          atividade_id: string
          created_at: string
          id: string
          nome_arquivo: string
          url: string
          user_id: string
        }
        Insert: {
          atividade_id: string
          created_at?: string
          id?: string
          nome_arquivo: string
          url: string
          user_id: string
        }
        Update: {
          atividade_id?: string
          created_at?: string
          id?: string
          nome_arquivo?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_anexos_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades_marketing"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades_colunas: {
        Row: {
          cor: string | null
          created_at: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      atividades_comentarios: {
        Row: {
          atividade_id: string
          created_at: string
          id: string
          texto: string
          user_id: string
        }
        Insert: {
          atividade_id: string
          created_at?: string
          id?: string
          texto: string
          user_id: string
        }
        Update: {
          atividade_id?: string
          created_at?: string
          id?: string
          texto?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_comentarios_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades_marketing"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades_marketing: {
        Row: {
          atividade: string
          coluna_id: string | null
          created_at: string
          id: string
          ordem: number
          prazo_fatal: string | null
          prioridade: string
          responsavel_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          atividade: string
          coluna_id?: string | null
          created_at?: string
          id?: string
          ordem?: number
          prazo_fatal?: string | null
          prioridade?: string
          responsavel_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          atividade?: string
          coluna_id?: string | null
          created_at?: string
          id?: string
          ordem?: number
          prazo_fatal?: string | null
          prioridade?: string
          responsavel_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_marketing_coluna_id_fkey"
            columns: ["coluna_id"]
            isOneToOne: false
            referencedRelation: "atividades_colunas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_marketing_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidato_vaga: {
        Row: {
          candidato_id: string
          created_at: string
          curriculo_id: string | null
          enviar_email_automatico: boolean | null
          explicacao_score: string | null
          id: string
          notas: string | null
          ordem: number | null
          score_detalhado: Json | null
          score_total: number | null
          status: Database["public"]["Enums"]["candidato_status"]
          updated_at: string
          user_id: string
          vaga_id: string
        }
        Insert: {
          candidato_id: string
          created_at?: string
          curriculo_id?: string | null
          enviar_email_automatico?: boolean | null
          explicacao_score?: string | null
          id?: string
          notas?: string | null
          ordem?: number | null
          score_detalhado?: Json | null
          score_total?: number | null
          status?: Database["public"]["Enums"]["candidato_status"]
          updated_at?: string
          user_id: string
          vaga_id: string
        }
        Update: {
          candidato_id?: string
          created_at?: string
          curriculo_id?: string | null
          enviar_email_automatico?: boolean | null
          explicacao_score?: string | null
          id?: string
          notas?: string | null
          ordem?: number | null
          score_detalhado?: Json | null
          score_total?: number | null
          status?: Database["public"]["Enums"]["candidato_status"]
          updated_at?: string
          user_id?: string
          vaga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidato_vaga_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidato_vaga_curriculo_id_fkey"
            columns: ["curriculo_id"]
            isOneToOne: false
            referencedRelation: "curriculos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidato_vaga_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas_recrutamento"
            referencedColumns: ["id"]
          },
        ]
      }
      candidatos: {
        Row: {
          created_at: string
          cursos_extras: string[] | null
          dados_extraidos: Json | null
          email: string
          experiencia_total_anos: number | null
          formacao: string | null
          id: string
          idiomas: string[] | null
          linkedin_url: string | null
          nome: string
          processado_todas_vagas_em: string | null
          resumo: string | null
          skills_detectadas: string[] | null
          telefone: string | null
          ultimo_cargo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cursos_extras?: string[] | null
          dados_extraidos?: Json | null
          email: string
          experiencia_total_anos?: number | null
          formacao?: string | null
          id?: string
          idiomas?: string[] | null
          linkedin_url?: string | null
          nome: string
          processado_todas_vagas_em?: string | null
          resumo?: string | null
          skills_detectadas?: string[] | null
          telefone?: string | null
          ultimo_cargo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cursos_extras?: string[] | null
          dados_extraidos?: Json | null
          email?: string
          experiencia_total_anos?: number | null
          formacao?: string | null
          id?: string
          idiomas?: string[] | null
          linkedin_url?: string | null
          nome?: string
          processado_todas_vagas_em?: string | null
          resumo?: string | null
          skills_detectadas?: string[] | null
          telefone?: string | null
          ultimo_cargo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      config_recrutamento: {
        Row: {
          created_at: string
          dias_alerta_vaga_parada: number | null
          email_resposta: string | null
          envio_automatico_habilitado: boolean | null
          id: string
          link_agendamento_padrao: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dias_alerta_vaga_parada?: number | null
          email_resposta?: string | null
          envio_automatico_habilitado?: boolean | null
          id?: string
          link_agendamento_padrao?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dias_alerta_vaga_parada?: number | null
          email_resposta?: string | null
          envio_automatico_habilitado?: boolean | null
          id?: string
          link_agendamento_padrao?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conteudos_midia: {
        Row: {
          copy_completa: string | null
          created_at: string
          formato: string
          gancho: string | null
          id: string
          link_inspiracao: string | null
          link_video_drive: string | null
          orientacoes_filmagem: string | null
          prioridade: string
          semana_publicacao: number | null
          setor: string
          status: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          copy_completa?: string | null
          created_at?: string
          formato: string
          gancho?: string | null
          id?: string
          link_inspiracao?: string | null
          link_video_drive?: string | null
          orientacoes_filmagem?: string | null
          prioridade?: string
          semana_publicacao?: number | null
          setor: string
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          copy_completa?: string | null
          created_at?: string
          formato?: string
          gancho?: string | null
          id?: string
          link_inspiracao?: string | null
          link_video_drive?: string | null
          orientacoes_filmagem?: string | null
          prioridade?: string
          semana_publicacao?: number | null
          setor?: string
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_chamadas: {
        Row: {
          audio_url: string | null
          canal: string
          created_at: string
          duracao_segundos: number | null
          feedback_ia: string | null
          id: string
          lead_id: string
          nota_ia: number | null
          numero_discado: string
          recording_url: string | null
          resumo_ia: string | null
          status: string
          transcricao: string | null
          twilio_call_sid: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          canal?: string
          created_at?: string
          duracao_segundos?: number | null
          feedback_ia?: string | null
          id?: string
          lead_id: string
          nota_ia?: number | null
          numero_discado: string
          recording_url?: string | null
          resumo_ia?: string | null
          status?: string
          transcricao?: string | null
          twilio_call_sid?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          canal?: string
          created_at?: string
          duracao_segundos?: number | null
          feedback_ia?: string | null
          id?: string
          lead_id?: string
          nota_ia?: number | null
          numero_discado?: string
          recording_url?: string | null
          resumo_ia?: string | null
          status?: string
          transcricao?: string | null
          twilio_call_sid?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_chamadas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_colunas: {
        Row: {
          cor: string | null
          created_at: string
          funil_id: string
          id: string
          nome: string
          ordem: number
          robo_coach_id: string | null
          robo_feedback_id: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string
          funil_id: string
          id?: string
          nome: string
          ordem?: number
          robo_coach_id?: string | null
          robo_feedback_id?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string
          funil_id?: string
          id?: string
          nome?: string
          ordem?: number
          robo_coach_id?: string | null
          robo_feedback_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_colunas_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "crm_funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_colunas_robo_coach_id_fkey"
            columns: ["robo_coach_id"]
            isOneToOne: false
            referencedRelation: "robos_coach"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_colunas_robo_feedback_id_fkey"
            columns: ["robo_feedback_id"]
            isOneToOne: false
            referencedRelation: "robos_coach"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_funis: {
        Row: {
          area_atuacao: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          tipo_acao: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area_atuacao: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          tipo_acao?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area_atuacao?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          tipo_acao?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_leads: {
        Row: {
          coluna_id: string
          created_at: string
          dados_extras: Json | null
          endereco: string | null
          funil_id: string
          id: string
          nome: string
          ordem: number
          resumo_caso: string | null
          telefones: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          coluna_id: string
          created_at?: string
          dados_extras?: Json | null
          endereco?: string | null
          funil_id: string
          id?: string
          nome: string
          ordem?: number
          resumo_caso?: string | null
          telefones?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          coluna_id?: string
          created_at?: string
          dados_extras?: Json | null
          endereco?: string | null
          funil_id?: string
          id?: string
          nome?: string
          ordem?: number
          resumo_caso?: string | null
          telefones?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_coluna_id_fkey"
            columns: ["coluna_id"]
            isOneToOne: false
            referencedRelation: "crm_colunas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "crm_funis"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculos: {
        Row: {
          arquivo_nome: string
          arquivo_tipo: string | null
          arquivo_url: string
          candidato_id: string
          created_at: string
          erro_processamento: string | null
          id: string
          processado: boolean | null
          processado_todas_vagas: boolean | null
          texto_extraido: string | null
          user_id: string
        }
        Insert: {
          arquivo_nome: string
          arquivo_tipo?: string | null
          arquivo_url: string
          candidato_id: string
          created_at?: string
          erro_processamento?: string | null
          id?: string
          processado?: boolean | null
          processado_todas_vagas?: boolean | null
          texto_extraido?: string | null
          user_id: string
        }
        Update: {
          arquivo_nome?: string
          arquivo_tipo?: string | null
          arquivo_url?: string
          candidato_id?: string
          created_at?: string
          erro_processamento?: string | null
          id?: string
          processado?: boolean | null
          processado_todas_vagas?: boolean | null
          texto_extraido?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculos_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates_recrutamento: {
        Row: {
          assunto: string
          ativo: boolean | null
          corpo: string
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assunto: string
          ativo?: boolean | null
          corpo: string
          created_at?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assunto?: string
          ativo?: boolean | null
          corpo?: string
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emails_recrutamento: {
        Row: {
          assunto: string
          candidato_id: string
          corpo: string
          created_at: string
          enviado_em: string | null
          erro: string | null
          id: string
          status: string | null
          template_id: string | null
          user_id: string
          vaga_id: string | null
        }
        Insert: {
          assunto: string
          candidato_id: string
          corpo: string
          created_at?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          status?: string | null
          template_id?: string | null
          user_id: string
          vaga_id?: string | null
        }
        Update: {
          assunto?: string
          candidato_id?: string
          corpo?: string
          created_at?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          status?: string | null
          template_id?: string | null
          user_id?: string
          vaga_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_recrutamento_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_recrutamento_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates_recrutamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_recrutamento_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas_recrutamento"
            referencedColumns: ["id"]
          },
        ]
      }
      formatos_origem: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          descricao: string | null
          icone: string
          id: string
          key: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          icone?: string
          id?: string
          key: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          icone?: string
          id?: string
          key?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      formatos_saida: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          descricao: string | null
          icone: string
          id: string
          key: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          icone?: string
          id?: string
          key: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          icone?: string
          id?: string
          key?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      historico_candidato: {
        Row: {
          candidato_vaga_id: string
          created_at: string
          id: string
          observacao: string | null
          status_anterior:
            | Database["public"]["Enums"]["candidato_status"]
            | null
          status_novo: Database["public"]["Enums"]["candidato_status"]
          user_id: string
        }
        Insert: {
          candidato_vaga_id: string
          created_at?: string
          id?: string
          observacao?: string | null
          status_anterior?:
            | Database["public"]["Enums"]["candidato_status"]
            | null
          status_novo: Database["public"]["Enums"]["candidato_status"]
          user_id: string
        }
        Update: {
          candidato_vaga_id?: string
          created_at?: string
          id?: string
          observacao?: string | null
          status_anterior?:
            | Database["public"]["Enums"]["candidato_status"]
            | null
          status_novo?: Database["public"]["Enums"]["candidato_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_candidato_candidato_vaga_id_fkey"
            columns: ["candidato_vaga_id"]
            isOneToOne: false
            referencedRelation: "candidato_vaga"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      ia_data_context: {
        Row: {
          colunas: Json | null
          created_at: string
          descricao: string | null
          gid: string | null
          id: string
          nome: string
          planilha_key: string
          tipo: string
          updated_at: string
        }
        Insert: {
          colunas?: Json | null
          created_at?: string
          descricao?: string | null
          gid?: string | null
          id?: string
          nome: string
          planilha_key: string
          tipo: string
          updated_at?: string
        }
        Update: {
          colunas?: Json | null
          created_at?: string
          descricao?: string | null
          gid?: string | null
          id?: string
          nome?: string
          planilha_key?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      ia_escritorio: {
        Row: {
          areas_atuacao: string | null
          created_at: string
          diferenciais: string | null
          historico: string | null
          id: string
          metas_ano: string | null
          sobre: string | null
          updated_at: string
          valores: string | null
        }
        Insert: {
          areas_atuacao?: string | null
          created_at?: string
          diferenciais?: string | null
          historico?: string | null
          id?: string
          metas_ano?: string | null
          sobre?: string | null
          updated_at?: string
          valores?: string | null
        }
        Update: {
          areas_atuacao?: string | null
          created_at?: string
          diferenciais?: string | null
          historico?: string | null
          id?: string
          metas_ano?: string | null
          sobre?: string | null
          updated_at?: string
          valores?: string | null
        }
        Relationships: []
      }
      ia_organograma: {
        Row: {
          ativo: boolean
          cargo: string
          created_at: string
          funcao: string | null
          id: string
          nome: string
          ordem: number
          setor: string | null
          subordinado_a: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo: string
          created_at?: string
          funcao?: string | null
          id?: string
          nome: string
          ordem?: number
          setor?: string | null
          subordinado_a?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo?: string
          created_at?: string
          funcao?: string | null
          id?: string
          nome?: string
          ordem?: number
          setor?: string | null
          subordinado_a?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ia_organograma_subordinado_a_fkey"
            columns: ["subordinado_a"]
            isOneToOne: false
            referencedRelation: "ia_organograma"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_profile: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          forma_pensar: string
          formato_resposta: string
          id: string
          nome: string
          persona: string
          postura: string
          regras: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          forma_pensar: string
          formato_resposta: string
          id?: string
          nome?: string
          persona: string
          postura: string
          regras: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          forma_pensar?: string
          formato_resposta?: string
          id?: string
          nome?: string
          persona?: string
          postura?: string
          regras?: string
          updated_at?: string
        }
        Relationships: []
      }
      ideias_conteudo: {
        Row: {
          copy_completa: string | null
          created_at: string
          formato: string
          gancho: string | null
          id: string
          link_inspiracao: string | null
          link_video_drive: string | null
          orientacoes_filmagem: string | null
          prioridade: string
          semana_publicacao: number | null
          setor: string
          titulo: string
          updated_at: string
          user_id: string
          validado: boolean
          validado_em: string | null
          validado_por: string | null
        }
        Insert: {
          copy_completa?: string | null
          created_at?: string
          formato: string
          gancho?: string | null
          id?: string
          link_inspiracao?: string | null
          link_video_drive?: string | null
          orientacoes_filmagem?: string | null
          prioridade?: string
          semana_publicacao?: number | null
          setor: string
          titulo: string
          updated_at?: string
          user_id: string
          validado?: boolean
          validado_em?: string | null
          validado_por?: string | null
        }
        Update: {
          copy_completa?: string | null
          created_at?: string
          formato?: string
          gancho?: string | null
          id?: string
          link_inspiracao?: string | null
          link_video_drive?: string | null
          orientacoes_filmagem?: string | null
          prioridade?: string
          semana_publicacao?: number | null
          setor?: string
          titulo?: string
          updated_at?: string
          user_id?: string
          validado?: boolean
          validado_em?: string | null
          validado_por?: string | null
        }
        Relationships: []
      }
      modelagens_conteudo: {
        Row: {
          analise_estrategia: string | null
          analise_filmagem: string | null
          analise_performance: string | null
          created_at: string
          gancho_original: string | null
          id: string
          ideia_conteudo_id: string | null
          legenda_original: string | null
          link_original: string
          status: string
          tipo: string
          tipo_produto_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analise_estrategia?: string | null
          analise_filmagem?: string | null
          analise_performance?: string | null
          created_at?: string
          gancho_original?: string | null
          id?: string
          ideia_conteudo_id?: string | null
          legenda_original?: string | null
          link_original: string
          status?: string
          tipo: string
          tipo_produto_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analise_estrategia?: string | null
          analise_filmagem?: string | null
          analise_performance?: string | null
          created_at?: string
          gancho_original?: string | null
          id?: string
          ideia_conteudo_id?: string | null
          legenda_original?: string | null
          link_original?: string
          status?: string
          tipo?: string
          tipo_produto_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "modelagens_conteudo_ideia_conteudo_id_fkey"
            columns: ["ideia_conteudo_id"]
            isOneToOne: false
            referencedRelation: "ideias_conteudo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modelagens_conteudo_tipo_produto_id_fkey"
            columns: ["tipo_produto_id"]
            isOneToOne: false
            referencedRelation: "tipos_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          enviado_email: boolean
          id: string
          lida: boolean
          link: string | null
          mensagem: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enviado_email?: boolean
          id?: string
          lida?: boolean
          link?: string | null
          mensagem: string
          tipo?: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          enviado_email?: boolean
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      robos_coach: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          instrucoes: string
          nome: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          instrucoes: string
          nome: string
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          instrucoes?: string
          nome?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scripts_sdr: {
        Row: {
          apresentacao: Json
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          instrucoes_gerais: string | null
          nome: string
          qualificacao: Json
          raloca: Json
          reca: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          apresentacao?: Json
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          instrucoes_gerais?: string | null
          nome: string
          qualificacao?: Json
          raloca?: Json
          reca?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          apresentacao?: Json
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          instrucoes_gerais?: string | null
          nome?: string
          qualificacao?: Json
          raloca?: Json
          reca?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sugestoes_contratacao: {
        Row: {
          anuidade_oab: number | null
          aprovado_em: string | null
          aprovado_por: string | null
          cargo: string
          comissoes_mensais: number | null
          created_at: string
          descricao: string | null
          experiencia_minima_anos: number | null
          formacao_minima: string | null
          hard_skills: string[] | null
          id: string
          is_advogado: boolean | null
          justificativa_contratacao: string
          justificativa_nao_delegar: string
          modalidade: Database["public"]["Enums"]["modalidade_trabalho"]
          motivo_recusa: string | null
          responsabilidades: string | null
          salario_mensal: number
          senioridade: Database["public"]["Enums"]["senioridade"]
          setor: string
          soft_skills: string[] | null
          status: string
          tipo_contrato: Database["public"]["Enums"]["tipo_contrato"]
          updated_at: string
          user_id: string
          vaga_criada_id: string | null
          valor_ppr: number | null
        }
        Insert: {
          anuidade_oab?: number | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          cargo: string
          comissoes_mensais?: number | null
          created_at?: string
          descricao?: string | null
          experiencia_minima_anos?: number | null
          formacao_minima?: string | null
          hard_skills?: string[] | null
          id?: string
          is_advogado?: boolean | null
          justificativa_contratacao: string
          justificativa_nao_delegar: string
          modalidade?: Database["public"]["Enums"]["modalidade_trabalho"]
          motivo_recusa?: string | null
          responsabilidades?: string | null
          salario_mensal: number
          senioridade?: Database["public"]["Enums"]["senioridade"]
          setor: string
          soft_skills?: string[] | null
          status?: string
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato"]
          updated_at?: string
          user_id: string
          vaga_criada_id?: string | null
          valor_ppr?: number | null
        }
        Update: {
          anuidade_oab?: number | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          cargo?: string
          comissoes_mensais?: number | null
          created_at?: string
          descricao?: string | null
          experiencia_minima_anos?: number | null
          formacao_minima?: string | null
          hard_skills?: string[] | null
          id?: string
          is_advogado?: boolean | null
          justificativa_contratacao?: string
          justificativa_nao_delegar?: string
          modalidade?: Database["public"]["Enums"]["modalidade_trabalho"]
          motivo_recusa?: string | null
          responsabilidades?: string | null
          salario_mensal?: number
          senioridade?: Database["public"]["Enums"]["senioridade"]
          setor?: string
          soft_skills?: string[] | null
          status?: string
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato"]
          updated_at?: string
          user_id?: string
          vaga_criada_id?: string | null
          valor_ppr?: number | null
        }
        Relationships: []
      }
      tipos_produtos: {
        Row: {
          caracteristicas: string | null
          created_at: string
          descricao: string | null
          estrutura_editorial: string | null
          id: string
          nome: string
          perfil_cliente_ideal: string | null
          setor: string
          updated_at: string
          user_id: string
        }
        Insert: {
          caracteristicas?: string | null
          created_at?: string
          descricao?: string | null
          estrutura_editorial?: string | null
          id?: string
          nome: string
          perfil_cliente_ideal?: string | null
          setor: string
          updated_at?: string
          user_id: string
        }
        Update: {
          caracteristicas?: string | null
          created_at?: string
          descricao?: string | null
          estrutura_editorial?: string | null
          id?: string
          nome?: string
          perfil_cliente_ideal?: string | null
          setor?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tipos_produtos_anexos: {
        Row: {
          created_at: string
          id: string
          nome_arquivo: string
          tamanho_bytes: number | null
          tipo_arquivo: string | null
          tipo_produto_id: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_arquivo: string
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          tipo_produto_id: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_arquivo?: string
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          tipo_produto_id?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_produtos_anexos_tipo_produto_id_fkey"
            columns: ["tipo_produto_id"]
            isOneToOne: false
            referencedRelation: "tipos_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      transcricoes: {
        Row: {
          arquivo_nome: string
          created_at: string
          duracao_segundos: number | null
          erro_mensagem: string | null
          id: string
          segmentos: Json | null
          status: string
          texto_completo: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivo_nome: string
          created_at?: string
          duracao_segundos?: number | null
          erro_mensagem?: string | null
          id?: string
          segmentos?: Json | null
          status?: string
          texto_completo?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivo_nome?: string
          created_at?: string
          duracao_segundos?: number | null
          erro_mensagem?: string | null
          id?: string
          segmentos?: Json | null
          status?: string
          texto_completo?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          page_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vagas_recrutamento: {
        Row: {
          created_at: string
          descricao: string | null
          experiencia_minima_anos: number | null
          formacao_minima: string | null
          hard_skills_desejaveis: string[] | null
          hard_skills_obrigatorias: string[] | null
          id: string
          modalidade: Database["public"]["Enums"]["modalidade_trabalho"]
          peso_cursos: number | null
          peso_experiencia: number | null
          peso_fit_cultural: number | null
          peso_formacao: number | null
          peso_soft_skills: number | null
          responsabilidades: string | null
          salario_max: number | null
          salario_min: number | null
          senioridade: Database["public"]["Enums"]["senioridade"]
          setor: string
          soft_skills: string[] | null
          status: Database["public"]["Enums"]["vaga_status"]
          tipo_contrato: Database["public"]["Enums"]["tipo_contrato"]
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          experiencia_minima_anos?: number | null
          formacao_minima?: string | null
          hard_skills_desejaveis?: string[] | null
          hard_skills_obrigatorias?: string[] | null
          id?: string
          modalidade?: Database["public"]["Enums"]["modalidade_trabalho"]
          peso_cursos?: number | null
          peso_experiencia?: number | null
          peso_fit_cultural?: number | null
          peso_formacao?: number | null
          peso_soft_skills?: number | null
          responsabilidades?: string | null
          salario_max?: number | null
          salario_min?: number | null
          senioridade?: Database["public"]["Enums"]["senioridade"]
          setor: string
          soft_skills?: string[] | null
          status?: Database["public"]["Enums"]["vaga_status"]
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato"]
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          experiencia_minima_anos?: number | null
          formacao_minima?: string | null
          hard_skills_desejaveis?: string[] | null
          hard_skills_obrigatorias?: string[] | null
          id?: string
          modalidade?: Database["public"]["Enums"]["modalidade_trabalho"]
          peso_cursos?: number | null
          peso_experiencia?: number | null
          peso_fit_cultural?: number | null
          peso_formacao?: number | null
          peso_soft_skills?: number | null
          responsabilidades?: string | null
          salario_max?: number | null
          salario_min?: number | null
          senioridade?: Database["public"]["Enums"]["senioridade"]
          setor?: string
          soft_skills?: string[] | null
          status?: Database["public"]["Enums"]["vaga_status"]
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato"]
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_validate_content: { Args: { _user_id: string }; Returns: boolean }
      has_page_permission: {
        Args: { _page_key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_coordinator: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "marketing_manager" | "coordinator"
      candidato_status:
        | "triagem_ia"
        | "entrevista_rh"
        | "entrevista_tecnica"
        | "proposta"
        | "contratado"
        | "reprovado"
        | "banco_talentos"
        | "agendar_entrevista"
        | "entrevista_agendada"
        | "entrevista_coordenador"
        | "proposta_enviada"
        | "proposta_recusada"
      modalidade_trabalho: "presencial" | "hibrido" | "remoto"
      senioridade: "junior" | "pleno" | "senior"
      tipo_contrato: "clt" | "pj" | "estagio" | "associado"
      vaga_status: "aberta" | "em_analise" | "encerrada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "marketing_manager", "coordinator"],
      candidato_status: [
        "triagem_ia",
        "entrevista_rh",
        "entrevista_tecnica",
        "proposta",
        "contratado",
        "reprovado",
        "banco_talentos",
        "agendar_entrevista",
        "entrevista_agendada",
        "entrevista_coordenador",
        "proposta_enviada",
        "proposta_recusada",
      ],
      modalidade_trabalho: ["presencial", "hibrido", "remoto"],
      senioridade: ["junior", "pleno", "senior"],
      tipo_contrato: ["clt", "pj", "estagio", "associado"],
      vaga_status: ["aberta", "em_analise", "encerrada"],
    },
  },
} as const
