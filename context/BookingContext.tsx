import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

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

const BookingContext = createContext<BookingContextData>({
  bookings: [],
  addBooking: () => {},
  cancelBooking: () => {},
});

const STORAGE_KEY = '@reservago:bookings';

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadBookings();
    } else {
      setBookings([]);
    }
  }, [user]);

  const loadBookings = async () => {
    try {
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY}:${user?.id}`);
      if (stored) setBookings(JSON.parse(stored));
    } catch (e) {
      console.error('Erro ao carregar reservas:', e);
    }
  };

  const saveBookings = async (newBookings: Booking[]) => {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEY}:${user?.id}`,
        JSON.stringify(newBookings)
      );
    } catch (e) {
      console.error('Erro ao salvar reservas:', e);
    }
  };

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
    const updated = [newBooking, ...bookings];
    setBookings(updated);
    saveBookings(updated);
  };

  const cancelBooking = (propertyId: string) => {
    setBookings(prev => {
      const idx = prev.findIndex(
        b => b.propertyId === propertyId && b.status === 'reservada'
      );
      if (idx === -1) return prev;
      const updated = prev.filter((_, i) => i !== idx);
      saveBookings(updated);
      return updated;
    });
  };

  return (
    <BookingContext.Provider value={{ bookings, addBooking, cancelBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export const useBookings = () => useContext(BookingContext);
