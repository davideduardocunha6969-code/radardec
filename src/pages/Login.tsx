import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail, Scale, Users, FileCheck, Shield } from 'lucide-react';
import logoEscritorio from '@/assets/logo-escritorio.webp';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Erro ao entrar',
        description: 'Credenciais inválidas. Verifique seu email e senha.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.',
      });
      navigate('/');
    }

    setIsLoading(false);
  };

  const stats = [
    { icon: Scale, value: '+10', label: 'Anos de Atuação' },
    { icon: FileCheck, value: '+20.000', label: 'Processos Ativos' },
    { icon: Users, value: '+11.000', label: 'Clientes Atendidos' },
    { icon: Shield, value: '+80', label: 'Profissionais' },
  ];

  return (
    <div className="min-h-screen flex bg-primary">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 animate-fade-in">
        <div>
          <img src={logoEscritorio} alt="David Eduardo Cunha Advogados" className="h-16 w-auto" />
        </div>
        
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
              Sistema de Gestão<br />
              <span className="text-accent">Radar DEC</span>
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="flex items-center gap-3 p-4 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10 backdrop-blur-sm"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-2 rounded-md bg-accent/20">
                  <stat.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xl font-bold text-accent">{stat.value}</p>
                  <p className="text-xs text-primary-foreground/60">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary-foreground/50 text-sm">
            <Shield className="h-4 w-4" />
            <span>Seguro de Responsabilidade Civil de até R$ 1.000.000,00</span>
          </div>
          <p className="text-primary-foreground/40 text-sm">
            © 2024 David Eduardo Cunha Advogados. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logoEscritorio} alt="Logo" className="h-12 w-auto" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Bem-vindo</h2>
            <p className="text-muted-foreground">Entre com suas credenciais para acessar o sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 text-base border-border bg-background"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-12 text-base border-border bg-background"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground" 
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar no Sistema'}
            </Button>
          </form>

          {/* Mobile Stats */}
          <div className="lg:hidden grid grid-cols-2 gap-3 pt-6 border-t border-border">
            {stats.slice(0, 2).map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <stat.icon className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground lg:hidden pt-4">
            © 2024 David Eduardo Cunha Advogados
          </p>
        </div>
      </div>
    </div>
  );
}
