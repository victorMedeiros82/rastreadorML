import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrackerForm } from './components/TrackerForm';
import { TrackerList } from './components/TrackerList';
import { ProductHistory } from './components/ProductHistory';
import { getTrackers, createTracker, deleteTracker, getProducts, confirmTracker, resendConfirmationCode } from './services/api';
import type { Tracker, Product, NewTrackerData } from './types';
import { Condition, TrackerStatus } from './types';
import { LogoIcon } from './components/icons/LogoIcon';

// --- DADOS DE EXEMPLO PARA O MODO DE DEMONSTRAÇÃO ---
const mockTrackers: Tracker[] = [
  {
    id: 'mock-1',
    searchTerm: 'Macbook Pro M3',
    minPrice: 10000,
    maxPrice: 15000,
    condition: Condition.NEW,
    location: 'SP',
    whatsappNumber: '(11) 99999-9999',
    createdAt: new Date(),
    status: TrackerStatus.ACTIVE,
  },
  {
    id: 'mock-2',
    searchTerm: 'Playstation 5',
    minPrice: 3000,
    maxPrice: 4000,
    condition: Condition.ALL,
    location: 'RJ',
    whatsappNumber: '(21) 98888-8888',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
    status: TrackerStatus.PENDING,
  }
];

const mockProducts: Product[] = [
    {
        id: 'mock-p1',
        title: 'Apple Macbook Pro 14 Chip M3 8gb 512gb Ssd Cinza-espacial',
        price: 11999,
        link: '#',
        thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_657984-MLA72658821495_112023-O.webp',
        foundAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutos atrás
    },
    {
        id: 'mock-p2',
        title: 'Console Playstation 5 825gb Cfi-1214a Cor Branco E Preto',
        price: 3589,
        link: '#',
        thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_798586-MLU72712437053_112023-O.webp',
        foundAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hora atrás
    }
];
// --- FIM DOS DADOS DE EXEMPLO ---


const App: React.FC = () => {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    console.error(err);
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      setError('Falha de conexão: Não foi possível conectar à API. Verifique se o servidor backend está em execução e acessível (verifique CORS).');
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError(defaultMessage);
    }
  }, []);
  
  const showNotification = useCallback((message: string) => {
      setNotification(message);
      setTimeout(() => setNotification(null), 5000);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [trackersData, productsData] = await Promise.all([getTrackers(), getProducts()]);
        setTrackers(trackersData);
        setProducts(productsData);
        setError(null);
      } catch (err) {
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
            console.warn('Falha ao conectar à API. Ativando modo de demonstração.');
            setIsDemoMode(true);
            setTrackers(mockTrackers);
            setProducts(mockProducts);
            setError(null);
            setBanner("API indisponível. Rodando em modo de demonstração com dados de exemplo. Todas as alterações são locais.");
        } else {
             handleError(err, 'Falha ao carregar dados. Tente novamente mais tarde.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [handleError]);
  
  const handleAddTracker = useCallback(async (trackerData: NewTrackerData) => {
    if (isDemoMode) {
        const newMockTracker: Tracker = {
            ...trackerData,
            id: `mock-${Date.now()}`,
            createdAt: new Date(),
            status: TrackerStatus.PENDING,
        };
        setTrackers(prev => [newMockTracker, ...prev]);
        showNotification('Modo Demo: Rastreador adicionado. Confirme-o para ativar.');
        return;
    }

    try {
      const newTracker = await createTracker(trackerData);
      setTrackers(prev => [newTracker, ...prev]);
      setError(null);
      showNotification('Rastreador criado! Verifique seu WhatsApp para o código de confirmação.');
    } catch (err) {
      handleError(err, 'Não foi possível criar o rastreador. Verifique os dados e tente novamente.');
      throw err;
    }
  }, [handleError, isDemoMode, showNotification]);

  const handleDeleteTracker = useCallback(async (id: string) => {
     if (isDemoMode) {
        setTrackers(prev => prev.filter(t => t.id !== id));
        showNotification('Modo Demo: Rastreador removido.');
        return;
    }
    try {
      await deleteTracker(id);
      setTrackers(prev => prev.filter(t => t.id !== id));
      setError(null);
    } catch (err) {
      handleError(err, 'Não foi possível remover o rastreador. Tente novamente.');
    }
  }, [handleError, isDemoMode, showNotification]);

  const handleConfirmTracker = useCallback(async (id: string, code: string) => {
      if (isDemoMode) {
        setTrackers(prev => prev.map(t => t.id === id ? { ...t, status: TrackerStatus.ACTIVE } : t));
        showNotification('Modo Demo: Rastreador ativado!');
        return;
      }

      try {
          const updatedTracker = await confirmTracker(id, code);
          setTrackers(prev => prev.map(t => t.id === id ? updatedTracker : t));
          setError(null);
          showNotification('Rastreador ativado com sucesso!');
      } catch (err: any) {
          handleError(err, 'Falha ao confirmar o rastreador. Verifique o código.');
          throw err;
      }
  }, [handleError, isDemoMode, showNotification]);
  
  const handleResendConfirmation = useCallback(async (id: string) => {
    if (isDemoMode) {
      showNotification('Modo Demo: Código de confirmação reenviado!');
      return;
    }
    try {
      await resendConfirmationCode(id);
      showNotification('Código de confirmação reenviado. Verifique seu WhatsApp.');
    } catch (err) {
      handleError(err, 'Não foi possível reenviar o código. Tente novamente mais tarde.');
      throw err;
    }
  }, [handleError, isDemoMode, showNotification]);


  return (
    <div className="min-h-screen bg-slate-900 font-sans text-text-DEFAULT antialiased relative overflow-x-hidden">
      {/* Aurora Background Effect */}
      <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full filter blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/2 w-[800px] h-[800px] bg-accent/20 rounded-full filter blur-3xl opacity-40 animate-pulse animation-delay-4000"></div>

      <div className="bg-gradient-to-r from-primary to-accent h-1.5"></div>
      <header className="sticky top-0 z-10 bg-slate-900/60 backdrop-blur-lg border-b border-slate-700/50 p-4">
        <div className="container mx-auto flex items-center">
          <LogoIcon className="h-7 w-auto text-primary" />
          <h1 className="text-2xl font-bold text-text-DEFAULT ml-3">Rastreador de Ofertas</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 relative z-0">
        <AnimatePresence>
            {banner && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-warning/10 backdrop-blur-sm border border-warning/50 text-warning px-4 py-3 rounded-xl relative mb-6"
                    role="status"
                >
                    <strong className="font-bold">Aviso: </strong>
                    <span className="block sm:inline">{banner}</span>
                </motion.div>
            )}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-danger/10 backdrop-blur-sm border border-danger/50 text-danger px-4 py-3 rounded-xl relative mb-6"
                    role="alert"
                >
                    <strong className="font-bold">Erro: </strong>
                    <span className="block sm:inline">{error}</span>
                </motion.div>
            )}
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-accent/10 backdrop-blur-sm border border-accent/50 text-accent px-4 py-3 rounded-xl relative mb-6"
                    role="alert"
                >
                    <strong className="font-bold">Sucesso: </strong>
                    <span className="block sm:inline">{notification}</span>
                </motion.div>
            )}
        </AnimatePresence>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <TrackerForm onAddTracker={handleAddTracker} />
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold mb-4 text-text-DEFAULT bg-clip-text text-transparent bg-gradient-to-br from-slate-200 to-slate-400">Rastreamentos Ativos</h2>
            {isLoading ? (
              <p>Carregando rastreadores...</p>
            ) : (
              <TrackerList 
                trackers={trackers} 
                onDeleteTracker={handleDeleteTracker} 
                onConfirmTracker={handleConfirmTracker}
                onResendConfirmation={handleResendConfirmation}
              />
            )}
            
            <h2 className="text-3xl font-bold mt-8 mb-4 text-text-DEFAULT bg-clip-text text-transparent bg-gradient-to-br from-slate-200 to-slate-400">Histórico de Produtos Encontrados</h2>
             {isLoading ? (
              <p>Carregando histórico de produtos...</p>
            ) : (
              <ProductHistory products={products} />
            )}
          </div>
        </div>
      </main>
      <footer className="text-center py-4 mt-8 text-text-subtle">
        <p>Desenvolvido com React, TypeScript e Tailwind CSS</p>
      </footer>
    </div>
  );
};

export default App;