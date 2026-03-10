import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Shield, ShieldCheck, Edit } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { AgendaTiposEventoManager } from '@/components/agenda/AgendaTiposEventoManager';

type AppRole = 'admin' | 'marketing_manager' | 'user';

interface UserWithDetails {
  user_id: string;
  display_name: string;
  email: string;
  role: AppRole;
  permissions: string[];
}

const AVAILABLE_PAGES_GROUPED = [
  {
    group: 'Radares',
    pages: [
      { key: 'gestao-geral', label: 'Gestão Geral' },
      { key: 'radar-controladoria', label: 'Radar Controladoria' },
      { key: 'radar-comercial', label: 'Radar Comercial' },
      { key: 'radar-bancario', label: 'Radar Bancário' },
      { key: 'radar-previdenciario', label: 'Radar Previdenciário' },
      { key: 'radar-trabalhista', label: 'Radar Trabalhista' },
    ],
  },
  {
    group: 'Comercial',
    pages: [
      { key: 'comercial-atendimentos', label: 'Atendimentos' },
      { key: 'radar-outbound', label: 'Radar Outbound' },
      { key: 'crm-outbound', label: 'CRM Outbound' },
    ],
  },
  {
    group: 'Marketing',
    pages: [
      { key: 'marketing-atividades', label: 'Atividades' },
      { key: 'content-hub', label: 'Content Hub' },
      { key: 'midia-social', label: 'Calendário de Conteúdo' },
      { key: 'marketing-modelador', label: 'Modelador de Conteúdo' },
      { key: 'marketing-radar', label: 'Radar de Viralização' },
      { key: 'marketing-reels-machine', label: 'Reels Machine' },
    ],
  },
  {
    group: 'Robôs',
    pages: [
      { key: 'robos-perfil-ia', label: 'Perfil IA' },
      { key: 'robos-coach', label: 'Robô Coach' },
      { key: 'robos-transcricao', label: 'Transcritor de Audiências' },
      { key: 'robos-prompts', label: 'Prompts de IA' },
      { key: 'robos-prompts-modelador', label: 'Prompts Modelador' },
      { key: 'robos-modelador-replica', label: 'Modelador Réplica' },
      { key: 'robos-produtos', label: 'Tipos de Produtos' },
    ],
  },
  {
    group: 'Recrutamento',
    pages: [
      { key: 'recrutamento', label: 'Recrutamento Inteligente' },
    ],
  },
];

// Flat list for lookups
const ALL_PAGES = AVAILABLE_PAGES_GROUPED.flatMap(g => g.pages);

export default function Admin() {
  const { isAdmin, loading } = useAuthContext();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);

  // Create user form
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('user');
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Edit permissions form
  const [editRole, setEditRole] = useState<AppRole>('user');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch all permissions
      const { data: permissions, error: permsError } = await supabase
        .from('user_permissions')
        .select('*');

      if (permsError) throw permsError;

      // Combine data
      const usersData: UserWithDetails[] = profiles?.map(profile => {
        const role = roles?.find(r => r.user_id === profile.user_id);
        const userPerms = permissions?.filter(p => p.user_id === profile.user_id).map(p => p.page_key) || [];
        
        return {
          user_id: profile.user_id,
          display_name: profile.display_name,
          email: profile.display_name, // We'll use display_name as identifier since we can't access auth.users
          role: (role?.role as AppRole) || 'user',
          permissions: userPerms,
        };
      }) || [];

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive',
      });
    }
    setIsLoadingUsers(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Create user via Supabase Auth Admin API (using edge function)
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newEmail,
          password: newPassword,
          displayName: newDisplayName,
          role: newRole,
          permissions: newPermissions,
        },
      });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Usuário criado com sucesso.',
      });

      setCreateDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewDisplayName('');
      setNewRole('user');
      setNewPermissions([]);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o usuário.',
        variant: 'destructive',
      });
    }

    setIsCreating(false);
  };

  const handleEditUser = (user: UserWithDetails) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditPermissions(user.permissions);
    setEditDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setIsSaving(true);

    try {
      // Update role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: editRole })
        .eq('user_id', selectedUser.user_id);

      if (roleError) throw roleError;

      // Delete existing permissions
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', selectedUser.user_id);

      // Insert new permissions (only if not admin)
      if (editRole !== 'admin' && editPermissions.length > 0) {
        const { error } = await supabase
          .from('user_permissions')
          .insert(
            editPermissions.map(pageKey => ({
              user_id: selectedUser.user_id,
              page_key: pageKey,
            }))
          );

        if (error) throw error;
      }

      toast({
        title: 'Sucesso!',
        description: 'Usuário atualizado com sucesso.',
      });

      setEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o usuário.',
        variant: 'destructive',
      });
    }

    setIsSaving(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Usuário excluído com sucesso.',
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o usuário.',
        variant: 'destructive',
      });
    }
  };

  const togglePermission = (pageKey: string, isEdit = false) => {
    if (isEdit) {
      setEditPermissions(prev =>
        prev.includes(pageKey)
          ? prev.filter(p => p !== pageKey)
          : [...prev, pageKey]
      );
    } else {
      setNewPermissions(prev =>
        prev.includes(pageKey)
          ? prev.filter(p => p !== pageKey)
          : [...prev, pageKey]
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administração</h1>
          <p className="text-muted-foreground">Gerencie usuários e permissões do sistema</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome de Exibição</Label>
                <Input
                  id="displayName"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Nome do usuário"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newEmail">Email (Login)</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="usuario@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Usuário</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="roleAdmin"
                      checked={newRole === 'admin'}
                      onCheckedChange={(checked) => setNewRole(checked ? 'admin' : 'user')}
                    />
                    <Label htmlFor="roleAdmin" className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-amber-500" />
                      Administrador (acesso total)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="roleMarketing"
                      checked={newRole === 'marketing_manager'}
                      onCheckedChange={(checked) => setNewRole(checked ? 'marketing_manager' : 'user')}
                    />
                    <Label htmlFor="roleMarketing" className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-500" />
                      Gestor de Marketing (valida conteúdo)
                    </Label>
                  </div>
                </div>
              </div>
              {newRole !== 'admin' && (
                <div className="space-y-3">
                  <Label>Páginas Permitidas</Label>
                  <div className="max-h-64 overflow-y-auto border rounded-md p-3 space-y-4">
                    {AVAILABLE_PAGES_GROUPED.map(group => (
                      <div key={group.group} className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {group.group}
                        </p>
                        <div className="space-y-1.5 pl-2">
                          {group.pages.map(page => (
                            <div key={page.key} className="flex items-center space-x-2">
                              <Checkbox
                                id={`new-${page.key}`}
                                checked={newPermissions.includes(page.key)}
                                onCheckedChange={() => togglePermission(page.key)}
                              />
                              <Label htmlFor={`new-${page.key}`} className="text-sm font-normal">
                                {page.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>Lista de todos os usuários cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário cadastrado ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.display_name}</TableCell>
                    <TableCell>
                      {user.role === 'admin' ? (
                        <Badge className="bg-amber-500">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      ) : user.role === 'marketing_manager' ? (
                        <Badge className="bg-purple-500">
                          <Shield className="h-3 w-3 mr-1" />
                          Gestor Mkt
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Shield className="h-3 w-3 mr-1" />
                          Usuário
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.role === 'admin' ? (
                        <span className="text-sm text-muted-foreground">Acesso total</span>
                      ) : user.permissions.length === 0 ? (
                        <span className="text-sm text-muted-foreground">Nenhuma</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.map(perm => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {ALL_PAGES.find(p => p.key === perm)?.label || perm}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(user.user_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Permissions Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário - {selectedUser?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Usuário</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editRoleAdmin"
                    checked={editRole === 'admin'}
                    onCheckedChange={(checked) => setEditRole(checked ? 'admin' : 'user')}
                  />
                  <Label htmlFor="editRoleAdmin" className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-500" />
                    Administrador (acesso total)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editRoleMarketing"
                    checked={editRole === 'marketing_manager'}
                    onCheckedChange={(checked) => setEditRole(checked ? 'marketing_manager' : 'user')}
                  />
                  <Label htmlFor="editRoleMarketing" className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-500" />
                    Gestor de Marketing (valida conteúdo)
                  </Label>
                </div>
              </div>
            </div>
            {editRole !== 'admin' && (
              <div className="space-y-3">
                <Label>Páginas Permitidas</Label>
                <div className="max-h-72 overflow-y-auto border rounded-md p-3 space-y-4">
                  {AVAILABLE_PAGES_GROUPED.map(group => (
                    <div key={group.group} className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {group.group}
                      </p>
                      <div className="space-y-1.5 pl-2">
                        {group.pages.map(page => (
                          <div key={page.key} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${page.key}`}
                              checked={editPermissions.includes(page.key)}
                              onCheckedChange={() => togglePermission(page.key, true)}
                            />
                            <Label htmlFor={`edit-${page.key}`} className="text-sm font-normal">
                              {page.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {editRole === 'admin' && (
              <p className="text-sm text-muted-foreground">
                Administradores têm acesso a todas as páginas.
              </p>
            )}
            <Button
              onClick={handleSavePermissions}
              className="w-full"
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tipos de Evento da Agenda */}
      <Card>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
          <CardDescription>Gerencie os tipos de evento disponíveis na agenda do sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <AgendaTiposEventoManager />
        </CardContent>
      </Card>
    </div>
  );
}
