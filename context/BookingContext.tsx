import React, { createContext, useState, useContext } from 'react';

// Definimos o que é uma Reserva
interface Booking {
  propertyId: string;
  date: string;
  status: 'reservada' | 'realizada';
}

const BookingContext = createContext<any>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  // Começamos com uma lista vazia de reservas
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Função para adicionar uma nova reserva
  const addBooking = (propertyId: string) => {
    const newBooking: Booking = {
      propertyId,
      // Gera a data de hoje formatada
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'reservada'
    };
    setBookings(prev => [newBooking, ...prev]);
  };

  return (
    <BookingContext.Provider value={{ bookings, addBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

// Hook para usarmos as reservas em qualquer tela
export const useBookings = () => useContext(BookingContext);