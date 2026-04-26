export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  description: string;
  image: string;
  category: "Praia Privativa" | "Campo" | "Cachoeira";
  subCategory: string; 
}

export const PROPERTIES: Property[] = [
  // --- CAMPO ---
  {
    id: '1',
    title: "Cabana do Lago Azul",
    location: "Campos do Jordão, SP",
    price: 450,
    rating: 4.9,
    description: "Um refúgio tranquilo à beira do lago.",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
    category: "Campo",
    subCategory: "Populares"
  },
  {
    id: '2',
    title: "Chalé Nascer do Sol",
    location: "Urubici, SC",
    price: 380,
    rating: 4.8,
    description: "Vista privilegiada da serra.",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
    category: "Campo",
    subCategory: "Montanhas"
  },
  {
    id: '3',
    title: "A-Frame Forest House",
    location: "Gramado, RS",
    price: 550,
    rating: 4.9,
    description: "Cabana estilo A-frame.",
    image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739",
    category: "Campo",
    subCategory: "Montanhas"
  },

  // --- CACHOEIRA ---
  {
    id: '4',
    title: "Refúgio da Montanha",
    location: "Monte Verde, MG",
    price: 520,
    rating: 5.0,
    description: "Luxo com som de queda d'água.",
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
    category: "Cachoeira",
    subCategory: "Populares"
  },
  {
    id: '5',
    title: "Eco-Cabana das Águas",
    location: "Pirenópolis, GO",
    price: 420,
    rating: 4.7,
    description: "Trilha privativa para cachoeira.",
    image: "https://images.unsplash.com/photo-1542718610-a1d656d1884c",
    category: "Cachoeira",
    subCategory: "Centro-Oeste"
  },

  // --- PRAIA PRIVATIVA ---
  {
    id: '6',
    title: "Casa de Vidro Oceânica",
    location: "Ilhabela, SP",
    price: 950,
    rating: 4.9,
    description: "Totalmente privativa com acesso ao mar.",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2",
    category: "Praia Privativa",
    subCategory: "Populares"
  },
  {
    id: '7',
    title: "Bangalô Areia Branca",
    location: "Trancoso, BA",
    price: 1200,
    rating: 5.0,
    description: "Pé na areia com serviço exclusivo.",
    image: "https://images.unsplash.com/photo-1439066615861-d1af74d74000",
    category: "Praia Privativa",
    subCategory: "Nordeste"
  },
  {
    id: '8',
    title: "Vila dos Corais",
    location: "São Miguel dos Milagres, AL",
    price: 880,
    rating: 4.8,
    description: "Design moderno com piscinas naturais.",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
    category: "Praia Privativa",
    subCategory: "Nordeste"
  }
];