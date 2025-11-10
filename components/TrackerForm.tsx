import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import type { NewTrackerData } from '../types';
import { Condition } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card } from './ui/Card';
import { SearchIcon } from './icons/SearchIcon';

interface TrackerFormProps {
  onAddTracker: (data: NewTrackerData) => Promise<void>;
}

// Interface para os dados do formulário
type FormInputs = {
    searchTerm: string;
    minPrice: string;
    maxPrice: string;
    condition: Condition;
    location: string;
    whatsappNumber: string;
};


// Função para formatar o número de WhatsApp
const formatWhatsAppNumber = (value: string): string => {
    if (!value) return value;
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length <= 2) return `(${digitsOnly}`;
    if (digitsOnly.length <= 6) return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2)}`;
    if (digitsOnly.length <= 10) return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 6)}-${digitsOnly.slice(6)}`;
    return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7, 11)}`;
}

export const TrackerForm: React.FC<TrackerFormProps> = ({ onAddTracker }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, watch, setValue } = useForm<FormInputs>();
  const [formError, setFormError] = useState<string | null>(null);

  const watchedWhatsApp = watch("whatsappNumber");
  
  React.useEffect(() => {
    setValue("whatsappNumber", formatWhatsAppNumber(watchedWhatsApp));
  }, [watchedWhatsApp, setValue]);

  // Handler para submissão do formulário
  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setFormError(null);
    try {
      const trackerData: NewTrackerData = {
        ...data,
        minPrice: parseFloat(data.minPrice) || 0,
        maxPrice: parseFloat(data.maxPrice) || 0,
      };
      await onAddTracker(trackerData);
      reset();
    } catch (error) {
      setFormError('Ocorreu um erro ao adicionar o rastreador. Tente novamente.');
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-5 text-text-DEFAULT">Criar Novo Rastreamento</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
            <Input
              id="searchTerm"
              label="Termo de Busca"
              placeholder="Ex: iPhone 15 Pro Max"
              error={!!errors.searchTerm}
              {...register('searchTerm', { required: 'Termo de busca é obrigatório' })}
            />
            {errors.searchTerm && <p className="text-danger text-xs mt-1">{errors.searchTerm.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Input
              id="minPrice"
              label="Preço Mínimo (R$)"
              type="number"
              placeholder="Ex: 3000"
              {...register('minPrice')}
            />
            <Input
              id="maxPrice"
              label="Preço Máximo (R$)"
              type="number"
              placeholder="Ex: 5000"
              {...register('maxPrice')}
            />
        </div>
        
        <Select 
            id="condition"
            label="Condição"
            {...register('condition', { required: true })}
            defaultValue={Condition.ALL}
        >
            <option value={Condition.ALL}>Novo e Usado</option>
            <option value={Condition.NEW}>Apenas Novos</option>
            <option value={Condition.USED}>Apenas Usados</option>
        </Select>

        <Input
            id="location"
            label="Localidade (UF)"
            placeholder="Ex: SP, RJ, GO"
            maxLength={2}
            {...register('location')}
        />
        <div>
            <Input
              id="whatsappNumber"
              label="Nº de WhatsApp para Alertas"
              placeholder="(99) 99999-9999"
              error={!!errors.whatsappNumber}
              {...register('whatsappNumber', { 
                  required: 'Número de WhatsApp é obrigatório',
                  pattern: {
                      value: /^\(\d{2}\) \d{5}-\d{4}$/,
                      message: 'Formato de número inválido. Use (99) 99999-9999'
                  }
              })}
            />
            {errors.whatsappNumber && <p className="text-danger text-xs mt-1">{errors.whatsappNumber.message}</p>}
        </div>

        {formError && <p className="text-danger text-sm">{formError}</p>}
        
        <div className="pt-2">
            <Button type="submit" isLoading={isSubmitting}>
              <SearchIcon className="w-5 h-5 mr-2"/>
              Iniciar Rastreamento
            </Button>
        </div>
      </form>
    </Card>
  );
};