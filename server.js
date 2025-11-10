const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// --- NOTA IMPORTANTE SOBRE A API E CHAVES SECRETAS ---
// Este servidor utiliza a API de busca PÚBLICA do Mercado Livre.
// Essa abordagem é a mais adequada para este projeto pois:
// 1. Não requer autenticação complexa (OAuth 2.0).
// 2. Permite que o servidor busque ofertas de forma autônoma, sem depender de um login de usuário.
//
// As chaves "Client ID" e "Client Secret" SÃO USADAS para APIs que realizam ações
// em nome de um vendedor (ex: gerenciar anúncios). Para nossa necessidade (buscar produtos),
// elas não são necessárias e, por segurança, a "Client Secret" JAMAIS deve ser
// exposta ou armazenada no código.

// --- BANCO DE DADOS PERSISTENTE (JSON) ---
const DB_PATH = path.join(__dirname, 'db.json');

let db = {
    trackers: [],
    products: []
};

function loadDatabase() {
    try {
        if (fs.existsSync(DB_PATH)) {
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            db = JSON.parse(data);
            // Garante que as datas sejam objetos Date
            db.trackers.forEach(t => t.createdAt = new Date(t.createdAt));
            db.products.forEach(p => p.foundAt = new Date(p.foundAt));
            console.log('💾 Banco de dados carregado com sucesso.');
        } else {
            // Se o DB não existe, cria com dados de exemplo
            console.log('📦 Nenhum banco de dados encontrado. Criando um novo com dados de exemplo.');
            db = {
                trackers: [
                    {
                        id: 'mock-1',
                        searchTerm: 'Macbook Pro M3',
                        minPrice: 10000,
                        maxPrice: 15000,
                        condition: 'new',
                        location: 'SP',
                        whatsappNumber: '(11) 99999-9999',
                        createdAt: new Date(),
                        status: 'active',
                    },
                     {
                        id: 'mock-2',
                        searchTerm: 'Playstation 5',
                        minPrice: 3000,
                        maxPrice: 4000,
                        condition: 'all',
                        location: 'RJ',
                        whatsappNumber: '(21) 98888-8888',
                        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
                        status: 'pending',
                        confirmationCode: '1234',
                    }
                ],
                products: [],
            };
            saveDatabase();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar o banco de dados:', error);
        // Em caso de erro, recomeça com um DB vazio para evitar crash
        db = { trackers: [], products: [] };
    }
}

function saveDatabase() {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    } catch (error) {
        console.error('❌ Erro ao salvar no banco de dados:', error);
    }
}


// --- HELPERS E INTEGRAÇÃO MERCADO LIVRE ---
const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();
const ML_API_BASE = 'https://api.mercadolibre.com';
const stateIdCache = {};

async function getStateId(uf) {
    if (!uf) return null;
    const ufUpper = uf.toUpperCase();
    if (stateIdCache[ufUpper]) return stateIdCache[ufUpper];
    try {
        const response = await fetch(`${ML_API_BASE}/classified_locations/states/BR-${ufUpper}`);
        if (response.ok) {
            const data = await response.json();
            if (data.id) {
                stateIdCache[ufUpper] = data.id;
                return data.id;
            }
        }
        return null;
    } catch (e) {
        console.error(`[WORKER] Falha ao obter ID do estado para ${ufUpper}`, e);
        return null;
    }
}

async function searchMercadoLivre(tracker) {
    try {
        const params = new URLSearchParams({ q: tracker.searchTerm });
        if (tracker.condition && tracker.condition !== 'all') params.append('condition', tracker.condition);

        const minPrice = tracker.minPrice > 0 ? tracker.minPrice : '';
        const maxPrice = tracker.maxPrice > 0 ? tracker.maxPrice : '';
        if (minPrice || maxPrice) params.append('price', `${minPrice}-${maxPrice}`);

        const stateId = await getStateId(tracker.location);
        if (stateId) params.append('state', stateId);

        const url = `${ML_API_BASE}/sites/MLB/search?${params.toString()}`;
        console.log(`[WORKER] Buscando: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`[WORKER] Erro na busca para "${tracker.searchTerm}": ${response.statusText}`);
            return;
        }

        const data = await response.json();
        const results = data.results || [];
        let newProductsFound = 0;

        for (const item of results) {
            if (!db.products.some(p => p.id === item.id)) {
                newProductsFound++;
                const newProduct = {
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    link: item.permalink,
                    thumbnail: item.thumbnail.replace(/^http:/, 'https:'),
                    foundAt: new Date(),
                };
                db.products.unshift(newProduct);

                console.log('--------------------------------------------------');
                console.log('✨ NOVA OFERTA ENCONTRADA!');
                console.log(`📲 [SIMULAÇÃO WHATSAPP] Nova oferta para "${tracker.searchTerm}" enviada para ${tracker.whatsappNumber}:`);
                console.log(`   - Título: ${newProduct.title}`);
                console.log(`   - Preço: R$ ${newProduct.price.toLocaleString('pt-BR')}`);
                console.log('--------------------------------------------------');
            }
        }
        if (newProductsFound > 0) {
            console.log(`[WORKER] Adicionados ${newProductsFound} novos produtos para "${tracker.searchTerm}".`);
            saveDatabase();
        }
    } catch (error) {
        console.error(`[WORKER] Erro no processo de busca para "${tracker.searchTerm}":`, error);
    }
}

function startWorker() {
    console.log('🤖 Worker iniciado. Verificando rastreadores a cada 30 segundos...');
    setInterval(async () => {
        const activeTrackers = db.trackers.filter(t => t.status === 'active');
        if (activeTrackers.length === 0) return;
        
        console.log(`[WORKER] Verificando ${activeTrackers.length} rastreador(es) ativo(s)...`);
        for (const tracker of activeTrackers) {
            await searchMercadoLivre(tracker);
        }
    }, 30000);
}

// --- ROTAS DA API ---

app.get('/api/trackers', (req, res) => {
    const trackersForClient = db.trackers.map(({ confirmationCode, ...tracker }) => tracker);
    res.json(trackersForClient);
});

app.get('/api/products', (req, res) => {
    res.json(db.products);
});

app.post('/api/trackers', (req, res) => {
    const { searchTerm, minPrice, maxPrice, condition, location, whatsappNumber } = req.body;
    if (!searchTerm || !whatsappNumber) {
        return res.status(400).json({ message: 'Termo de busca e WhatsApp são obrigatórios.' });
    }
    const newTracker = {
        id: crypto.randomUUID(),
        searchTerm,
        minPrice: Number(minPrice) || 0,
        maxPrice: Number(maxPrice) || 0,
        condition,
        location,
        whatsappNumber,
        createdAt: new Date(),
        status: 'pending',
        confirmationCode: generateCode(),
    };
    db.trackers.unshift(newTracker);
    saveDatabase();
    
    console.log('--------------------------------------------------');
    console.log('✅ RASTREADOR CRIADO');
    console.log(`📲 [SIMULAÇÃO WHATSAPP] Seu código para "${newTracker.searchTerm}" é: ${newTracker.confirmationCode}`);
    console.log('--------------------------------------------------');

    const { confirmationCode, ...trackerForClient } = newTracker;
    res.status(201).json(trackerForClient);
});

app.delete('/api/trackers/:id', (req, res) => {
    const { id } = req.params;
    const initialLength = db.trackers.length;
    db.trackers = db.trackers.filter(t => t.id !== id);
    if (db.trackers.length < initialLength) {
        saveDatabase();
        res.status(200).json({ success: true });
    } else {
        res.status(404).json({ message: 'Rastreador não encontrado.' });
    }
});

app.post('/api/trackers/:id/confirm', (req, res) => {
    const { id } = req.params;
    const { code } = req.body;
    const tracker = db.trackers.find(t => t.id === id);

    if (!tracker) return res.status(404).json({ message: 'Rastreador não encontrado.' });
    if (tracker.status === 'active') return res.status(400).json({ message: 'Este rastreador já está ativo.' });

    if (tracker.confirmationCode === code) {
        tracker.status = 'active';
        delete tracker.confirmationCode;
        saveDatabase();
        
        console.log(`[API] Rastreador "${tracker.searchTerm}" ativado.`);
        searchMercadoLivre(tracker); // Dispara uma busca imediata

        const { ...trackerForClient } = tracker;
        res.status(200).json(trackerForClient);
    } else {
        res.status(400).json({ message: 'Código de confirmação inválido.' });
    }
});

app.post('/api/trackers/:id/resend-code', (req, res) => {
    const { id } = req.params;
    const tracker = db.trackers.find(t => t.id === id);
    if (!tracker) return res.status(404).json({ message: 'Rastreador não encontrado.' });
    if (tracker.status !== 'pending') return res.status(400).json({ message: 'Este rastreador não está pendente.' });

    tracker.confirmationCode = generateCode();
    saveDatabase();

    console.log('--------------------------------------------------');
    console.log('✅ CÓDIGO REENVIADO');
    console.log(`📲 [SIMULAÇÃO WHATSAPP] Seu novo código para "${tracker.searchTerm}" é: ${tracker.confirmationCode}`);
    console.log('--------------------------------------------------');
    
    res.status(200).json({ success: true });
});

app.listen(PORT, () => {
    loadDatabase();
    console.log(`🚀 Servidor persistente rodando em http://localhost:${PORT}`);
    startWorker();
});
