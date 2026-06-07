import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Jogo } from '../types';

export const useJogos = () => {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'jogos'), orderBy('dataHora', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jogosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Jogo[];
      
      setJogos(jogosData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { jogos, loading };
};
