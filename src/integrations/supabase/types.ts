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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
