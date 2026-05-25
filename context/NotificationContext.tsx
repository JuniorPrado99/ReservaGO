import React, { createContext, useState, useContext, useCallback } from 'react';

type NotificationType = 'reserva' | 'mensagem' | 'promocao' | 'aviso';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

interface NotificationContextData {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'read'>) => void;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: '1',
    type: 'reserva',
    title: 'Reserva confirmada! 🎉',
    body: 'Sua reserva no Refúgio das Pedras foi confirmada para 15–18 de Jun.',
    time: 'Agora',
    read: false,
  },
  {
    id: '2',
    type: 'mensagem',
    title: 'Carlos Mendes respondeu',
    body: 'Olá! O check-in pode ser feito a partir das 14h. Qualquer dúvida é só chamar.',
    time: '5 min atrás',
    read: false,
  },
  {
    id: '3',
    type: 'promocao',
    title: '🏷️ Oferta especial para você',
    body: 'Use o cupom RESERVAGO15 e ganhe 15% de desconto na sua próxima reserva.',
    time: '1 hora atrás',
    read: false,
  },
  {
    id: '4',
    type: 'aviso',
    title: 'Lembrete de viagem',
    body: 'Sua estadia na Cabana Suíça começa em 3 dias. Confira as diretrizes da hospedagem.',
    time: 'Ontem',
    read: true,
  },
  {
    id: '5',
    type: 'reserva',
    title: 'Reserva pendente',
    body: 'Sua solicitação para a Cabana do Rio está aguardando confirmação do anfitrião.',
    time: 'Ontem',
    read: true,
  },
  {
    id: '6',
    type: 'mensagem',
    title: 'Nova mensagem de Ana Lima',
    body: 'Tudo certo para a chegada de vocês! Deixei as instruções na porta.',
    time: '2 dias atrás',
    read: true,
  },
  {
    id: '7',
    type: 'promocao',
    title: '🌿 Novidade no ReservaGO',
    body: 'Agora você pode filtrar cabanas por nível de isolamento. Experimente!',
    time: '3 dias atrás',
    read: true,
  },
  {
    id: '8',
    type: 'reserva',
    title: 'Reserva cancelada',
    body: 'A reserva no Chalé das Montanhas foi cancelada. O reembolso será processado em até 5 dias úteis.',
    time: '1 semana atrás',
    read: true,
  },
];

const NotificationContext = createContext<NotificationContextData>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  addNotification: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'read'>) => {
    const newN: AppNotification = {
      ...n,
      id: String(Date.now()),
      read: false,
    };
    setNotifications(prev => [newN, ...prev]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
