import React, { createContext, useState, useContext } from 'react';

interface Booking {
  propertyId: string;
  date: string;
  status: 'reservada' | 'realizada';
}

interface BookingContextData {
  bookings: Booking[];
  addBooking: (propertyId: string) => void;
  cancelBooking: (propertyId: string) => void;
}

const BookingContext = createContext<BookingContextData>({} as BookingContextData);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const addBooking = (propertyId: string) => {
    const newBooking: Booking = {
      propertyId,
      date: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      status: 'reservada',
    };
    setBookings(prev => [newBooking, ...prev]);
  };

  // Remove a primeira reserva ativa encontrada para aquele propertyId
  const cancelBooking = (propertyId: string) => {
    setBookings(prev => {
      const idx = prev.findIndex(
        b => b.propertyId === propertyId && b.status === 'reservada'
      );
      if (idx === -1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  };

  return (
    <BookingContext.Provider value={{ bookings, addBooking, cancelBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export const useBookings = () => useContext(BookingContext);
