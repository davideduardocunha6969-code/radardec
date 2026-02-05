 import { Bell, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuTrigger,
   DropdownMenuSeparator,
 } from "@/components/ui/dropdown-menu";
 import { useNotificacoes, useUnreadNotificacoesCount, useMarkNotificacaoAsRead, useMarkAllNotificacoesAsRead, useDeleteNotificacao } from "@/hooks/useNotificacoes";
 import { formatDistanceToNow } from "date-fns";
 import { ptBR } from "date-fns/locale";
 import { useNavigate } from "react-router-dom";
 import { cn } from "@/lib/utils";
 
 const tipoColors = {
   info: "bg-blue-500",
   success: "bg-green-500",
   warning: "bg-yellow-500",
   error: "bg-red-500",
 };
 
 export function NotificationsDropdown() {
   const navigate = useNavigate();
   const { data: notificacoes = [] } = useNotificacoes();
   const { data: unreadCount = 0 } = useUnreadNotificacoesCount();
   const markAsRead = useMarkNotificacaoAsRead();
   const markAllAsRead = useMarkAllNotificacoesAsRead();
   const deleteNotificacao = useDeleteNotificacao();
 
   const handleNotificationClick = (notificacao: typeof notificacoes[0]) => {
     if (!notificacao.lida) {
       markAsRead.mutate(notificacao.id);
     }
     if (notificacao.link) {
       navigate(notificacao.link);
     }
   };
 
   return (
     <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <Button variant="ghost" size="icon" className="relative">
           <Bell className="h-5 w-5" />
           {unreadCount > 0 && (
             <Badge 
               variant="destructive" 
               className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
             >
               {unreadCount > 9 ? "9+" : unreadCount}
             </Badge>
           )}
         </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent align="end" className="w-80">
         <div className="flex items-center justify-between px-4 py-2 border-b">
           <span className="font-medium">Notificações</span>
           {unreadCount > 0 && (
             <Button
               variant="ghost"
               size="sm"
               className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
               onClick={() => markAllAsRead.mutate()}
             >
               <CheckCheck className="mr-1 h-3 w-3" />
               Marcar todas como lidas
             </Button>
           )}
         </div>
 
         <ScrollArea className="max-h-80">
           {notificacoes.length === 0 ? (
             <div className="p-8 text-center text-muted-foreground">
               <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
               <p className="text-sm">Nenhuma notificação</p>
             </div>
           ) : (
             <div className="divide-y">
               {notificacoes.slice(0, 10).map((notificacao) => (
                 <div
                   key={notificacao.id}
                   className={cn(
                     "p-3 hover:bg-muted/50 cursor-pointer transition-colors relative group",
                     !notificacao.lida && "bg-primary/5"
                   )}
                   onClick={() => handleNotificationClick(notificacao)}
                 >
                   <div className="flex gap-3">
                     <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", tipoColors[notificacao.tipo])} />
                     <div className="flex-1 min-w-0">
                       <div className="flex items-start justify-between gap-2">
                         <p className={cn("text-sm font-medium", !notificacao.lida && "text-primary")}>
                           {notificacao.titulo}
                         </p>
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                           onClick={(e) => {
                             e.stopPropagation();
                             deleteNotificacao.mutate(notificacao.id);
                           }}
                         >
                           <Trash2 className="h-3 w-3" />
                         </Button>
                       </div>
                       <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                         {notificacao.mensagem}
                       </p>
                       <div className="flex items-center gap-2 mt-1">
                         <span className="text-xs text-muted-foreground">
                           {formatDistanceToNow(new Date(notificacao.created_at), { 
                             addSuffix: true, 
                             locale: ptBR 
                           })}
                         </span>
                         {notificacao.link && (
                           <ExternalLink className="h-3 w-3 text-muted-foreground" />
                         )}
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </ScrollArea>
 
         {notificacoes.length > 10 && (
           <>
             <DropdownMenuSeparator />
             <div className="p-2 text-center">
               <Button variant="ghost" size="sm" className="text-xs">
                 Ver todas as notificações
               </Button>
             </div>
           </>
         )}
       </DropdownMenuContent>
     </DropdownMenu>
   );
 }