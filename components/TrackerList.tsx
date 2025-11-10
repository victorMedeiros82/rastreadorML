import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tracker } from '../types';
import { TrackerStatus } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { TrashIcon } from './icons/TrashIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { Input } from './ui/Input';

interface TrackerListProps {
  trackers: Tracker[];
  onDeleteTracker: (id: string) => void;
  onConfirmTracker: (id: string, code: string) => Promise<void>;
  onResendConfirmation: (id: string) => Promise<void>;
}

// Sub-componente para o formulário de confirmação
const ConfirmationForm: React.FC<{ trackerId: string; onConfirm: (id: string, code: string) => Promise<void>, onResend: (id: string) => Promise<void> }> = ({ trackerId, onConfirm, onResend }) => {
    const [code, setCode] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        // FIX: Use ReturnType<typeof setTimeout> for browser compatibility instead of NodeJS.Timeout
        let timer: ReturnType<typeof setTimeout>;
        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (code.length !== 4) {
            setError('O código deve ter 4 dígitos.');
            return;
        }
        setIsConfirming(true);
        try {
            await onConfirm(trackerId, code);
        } catch (err) {
            setError('Código inválido. Tente novamente.');
        } finally {
            setIsConfirming(false);
        }
    };
    
    const handleResend = async () => {
        if (cooldown > 0) return;
        try {
            await onResend(trackerId);
            setCooldown(30); // 30 segundos de cooldown
        } catch (err) {
            setError('Falha ao reenviar. Tente mais tarde.');
        }
    }

    return (
        <div className="mt-4 p-4 bg-warning/10 backdrop-blur-sm border border-warning/30 rounded-lg">
            <p className="text-sm font-medium text-warning mb-2">Aguardando confirmação. Insira o código de 4 dígitos enviado ao seu WhatsApp.</p>
            <form onSubmit={handleSubmit}>
                <div className="flex items-start space-x-2">
                    <div className="flex-grow">
                        <Input 
                            id={`code-${trackerId}`}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            maxLength={4}
                            placeholder="1234"
                            type="text"
                            pattern="\d{4}"
                            required
                            aria-label="Código de confirmação"
                            error={!!error}
                        />
                         {error && <p className="text-danger text-xs mt-1">{error}</p>}
                    </div>
                    <div>
                        <Button type="submit" variant="accent" isLoading={isConfirming} className="py-2 px-4 text-sm h-[40px]">
                            Confirmar
                        </Button>
                    </div>
                </div>
            </form>
            <div className="text-xs text-text-subtle mt-2">
                <span>Não recebeu o código? </span>
                <button 
                    onClick={handleResend} 
                    disabled={cooldown > 0}
                    className="text-primary hover:underline focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {cooldown > 0 ? `Aguarde (${cooldown}s)` : 'Reenviar'}
                </button>
                <span className="ml-2">Pode levar alguns minutos para chegar.</span>
            </div>
        </div>
    );
}

// Componente para exibir um único item da lista de rastreadores
const TrackerItem: React.FC<{ tracker: Tracker; onDelete: (id: string) => void; onConfirm: (id: string, code: string) => Promise<void>; onResend: (id: string) => Promise<void> }> = ({ tracker, onDelete, onConfirm, onResend }) => {
  
  const formatPrice = (price: number) => {
    return price > 0 ? `R$ ${price.toLocaleString('pt-BR')}` : 'N/A';
  }

  const formatCondition = (condition: string) => {
      const map: { [key: string]: string } = {
          'new': 'Novo',
          'used': 'Usado',
          'all': 'Todos'
      };
      return map[condition] || 'Todos';
  }
  
  const isPending = tracker.status === TrackerStatus.PENDING;

  return (
    <Card className="mb-4 p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex-grow">
                <div className="flex items-center mb-2">
                    <span className="flex h-3 w-3 relative mr-3">
                        {isPending ? (
                             <span className="relative inline-flex rounded-full h-3 w-3 bg-warning" title="Pendente"></span>
                        ) : (
                            <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" title="Ativo"></span>
                            </>
                        )}
                    </span>
                    <h3 className="text-lg font-bold text-text-DEFAULT">{tracker.searchTerm}</h3>
                    {isPending && <span className="ml-3 text-xs font-semibold bg-warning/20 text-warning px-2 py-1 rounded-full">Pendente</span>}
                </div>
                <div className="text-sm text-text-subtle space-y-1 md:space-y-0 md:flex md:space-x-4">
                    <p><strong>Preço:</strong> {formatPrice(tracker.minPrice)} - {formatPrice(tracker.maxPrice)}</p>
                    <p><strong>Condição:</strong> {formatCondition(tracker.condition)}</p>
                    <p><strong>UF:</strong> {tracker.location || 'Brasil'}</p>
                </div>
                <div className="flex items-center text-sm text-text-subtle mt-2">
                    <WhatsAppIcon className="w-4 h-4 mr-2 text-accent" />
                    <span>{tracker.whatsappNumber}</span>
                </div>
            </div>
            <div className="mt-4 md:mt-0 md:ml-4 w-full md:w-auto self-center">
                <Button variant="danger" onClick={() => onDelete(tracker.id)} className="py-2 px-4 text-sm h-10">
                    <TrashIcon className="w-4 h-4 mr-2"/>
                    {isPending ? 'Cancelar' : 'Parar'}
                </Button>
            </div>
        </div>
        {isPending && <ConfirmationForm trackerId={tracker.id} onConfirm={onConfirm} onResend={onResend} />}
    </Card>
  );
};

export const TrackerList: React.FC<TrackerListProps> = ({ trackers, onDeleteTracker, onConfirmTracker, onResendConfirmation }) => {
  if (trackers.length === 0) {
    return (
      <Card className="text-center py-10 px-6">
        <p className="text-text-subtle">Nenhum rastreamento ativo.</p>
        <p className="text-text-subtle/80 text-sm mt-1">Crie um novo para começar a monitorar ofertas.</p>
      </Card>
    );
  }

  return (
    <div>
      <AnimatePresence>
        {trackers.map((tracker) => (
          <motion.div
            key={tracker.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            layout
          >
            <TrackerItem tracker={tracker} onDelete={onDeleteTracker} onConfirm={onConfirmTracker} onResend={onResendConfirmation} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};