import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import { TagIcon } from './icons/TagIcon';
import { Card } from './ui/Card';

interface ProductHistoryProps {
  products: Product[];
}

// Componente para exibir um único card de produto
const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const timeAgo = (date: Date): string => {
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " anos atrás";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " meses atrás";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " dias atrás";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " horas atrás";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " minutos atrás";
      return Math.floor(seconds) + " segundos atrás";
  };

  return (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ scale: 1.03, y: -5 }}
        className="group"
    >
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="w-full h-48 bg-slate-700 overflow-hidden">
            <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <h4 className="text-md font-semibold text-text-DEFAULT truncate" title={product.title}>{product.title}</h4>
            <div className="flex items-center mt-2">
                <TagIcon className="w-5 h-5 text-primary mr-2"/>
                <p className="text-xl font-bold text-text-DEFAULT">
                    R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
            </div>
             <div className="flex items-center text-xs text-text-subtle mt-3">
                <ClockIcon className="w-4 h-4 mr-1"/>
                <span>Encontrado {timeAgo(product.foundAt)}</span>
            </div>
            <a 
                href={product.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full text-center bg-primary text-slate-950 font-bold py-2 px-4 rounded-md mt-auto hover:bg-primary-dark transition-all duration-200"
            >
                Ver Oferta
            </a>
        </div>
      </Card>
    </motion.div>
  )
}

export const ProductHistory: React.FC<ProductHistoryProps> = ({ products }) => {
  if (products.length === 0) {
    return (
      <Card className="text-center py-10 px-6">
        <p className="text-text-subtle">Nenhum produto encontrado ainda.</p>
        <p className="text-text-subtle/80 text-sm mt-1">Quando uma oferta for detectada, ela aparecerá aqui.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </AnimatePresence>
    </div>
  );
};