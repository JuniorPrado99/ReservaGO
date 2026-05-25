import React, { createContext, useState, useContext, useCallback } from 'react';

export interface Listing {
  id: string;
  title: string;
  location: string;
  price: string;
  description: string;
  imageUri: string | null;
  isolationLevel: string | null;
  createdAt: string;
  bookings: number;
}

interface ListingContextData {
  listings: Listing[];
  addListing: (l: Omit<Listing, 'id' | 'createdAt' | 'bookings'>) => void;
  removeListing: (id: string) => void;
  updateListing: (id: string, data: Partial<Listing>) => void;
}

const ListingContext = createContext<ListingContextData>({
  listings: [],
  addListing: () => {},
  removeListing: () => {},
  updateListing: () => {},
});

export function ListingProvider({ children }: { children: React.ReactNode }) {
  // Dados iniciais simulados (mesmos que estavam hardcoded no my-cabins)
  const [listings, setListings] = useState<Listing[]>([
    {
      id: 'mock-1',
      title: 'Cabana das Montanhas',
      location: 'Campos do Jordão, SP',
      price: '450',
      description: 'Uma cabana aconchegante nas montanhas.',
      imageUri: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=400&q=80',
      isolationLevel: 'semi',
      createdAt: '15/01/2025',
      bookings: 3,
    },
    {
      id: 'mock-2',
      title: 'Refúgio de Inverno',
      location: 'Gramado, RS',
      price: '600',
      description: 'Perfeito para o inverno gaúcho.',
      imageUri: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400&q=80',
      isolationLevel: 'isolado',
      createdAt: '03/02/2025',
      bookings: 1,
    },
  ]);

  const addListing = useCallback((l: Omit<Listing, 'id' | 'createdAt' | 'bookings'>) => {
    const newListing: Listing = {
      ...l,
      id: String(Date.now()),
      createdAt: new Date().toLocaleDateString('pt-BR'),
      bookings: 0,
    };
    setListings(prev => [newListing, ...prev]);
  }, []);

  const removeListing = useCallback((id: string) => {
    setListings(prev => prev.filter(l => l.id !== id));
  }, []);

  const updateListing = useCallback((id: string, data: Partial<Listing>) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  }, []);

  return (
    <ListingContext.Provider value={{ listings, addListing, removeListing, updateListing }}>
      {children}
    </ListingContext.Provider>
  );
}

export const useListings = () => useContext(ListingContext);
