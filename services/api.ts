import type { Tracker, Product, NewTrackerData } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper para tratar as respostas da API
const handleResponse = async <T,>(response: Response): Promise<T> => {
    if (!response.ok) {
        // Tenta extrair uma mensagem de erro do corpo da resposta
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido na API.' }));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }
    return response.json();
};

// Helper para converter as datas dos rastreadores de string para Date
const parseTrackerDates = (tracker: any): Tracker => ({
    ...tracker,
    createdAt: new Date(tracker.createdAt),
});

// Helper para converter as datas dos produtos de string para Date
const parseProductDates = (product: any): Product => ({
    ...product,
    foundAt: new Date(product.foundAt),
});


// Função para buscar os rastreadores ativos
export const getTrackers = async (): Promise<Tracker[]> => {
    const response = await fetch(`${API_BASE_URL}/trackers`);
    const data = await handleResponse<any[]>(response);
    return data.map(parseTrackerDates).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

// Função para buscar o histórico de produtos
export const getProducts = async (): Promise<Product[]> => {
    const response = await fetch(`${API_BASE_URL}/products`);
    const data = await handleResponse<any[]>(response);
    return data.map(parseProductDates).sort((a, b) => b.foundAt.getTime() - a.foundAt.getTime());
}

// Função para criar um novo rastreador
export const createTracker = async (trackerData: NewTrackerData): Promise<Tracker> => {
    const response = await fetch(`${API_BASE_URL}/trackers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(trackerData),
    });
    const data = await handleResponse<any>(response);
    return parseTrackerDates(data);
};

// Função para deletar um rastreador
export const deleteTracker = async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/trackers/${id}`, {
        method: 'DELETE',
    });
    // handleResponse pode não retornar um corpo JSON em um DELETE bem-sucedido
    if (!response.ok) {
        await handleResponse(response);
    }
    return { success: true };
};

// Função para confirmar o rastreador
export const confirmTracker = async (id: string, code: string): Promise<Tracker> => {
    const response = await fetch(`${API_BASE_URL}/trackers/${id}/confirm`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
    });
    const data = await handleResponse<any>(response);
    return parseTrackerDates(data);
}

// Nova função para reenviar o código de confirmação
export const resendConfirmationCode = async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/trackers/${id}/resend-code`, {
        method: 'POST',
    });
     if (!response.ok) {
        await handleResponse(response);
    }
    return { success: true };
}