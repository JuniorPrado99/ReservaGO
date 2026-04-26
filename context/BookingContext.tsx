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
}

const BookingContext = createContext<BookingContextData>({} as BookingContextData);

const STORAGE_KEY = '@reservago:bookings';

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { user } = useAuth();

  // Carrega reservas do AsyncStorage quando o usuário loga
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

  return (
    <BookingContext.Provider value={{ bookings, addBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export const useBookings = () => useContext(BookingContext);
