const Version = '2026-05-17-ULTIMATE';
let proxyIP = '';
const staticPage = 'https://edt-pages.github.io';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const upgradeHeader = (request.headers.get('Upgrade') || '').toLowerCase();
        const contentType = (request.headers.get('content-type') || '').toLowerCase();

        const userId = '777174e1-6785-446a-8451-b0e6840742f5'.toLowerCase();
        const adminPass = 'admin123';

        if (env.PROXYIP) {
            proxyIP = (await toArray(env.PROXYIP))[0];
        } else {
            proxyIP = (request.cf.colo + '.PrOxYIp.CmLiUsSsS.nEt').toLowerCase();
        }

        // ВХОД В АДМИНКУ
        if (url.pathname === '/admin' || url.pathname.startsWith('/admin')) {
            if (url.pathname.includes(adminPass)) {
                return fetch(staticPage + '/admin');
            }
            return fetch(staticPage + '/login');
        }

        // ОСНОВНОЙ ПРОКСИ-ТРАФИК
        if (upgradeHeader === 'websocket') {
            return await handleWSRequest(request, userId, url);
        } else if (request.method === 'POST') {
            if (contentType.startsWith('application/grpc')) {
                return await handleGRPC(request, userId);
            }
            return await handleXHTTP(request, userId);
        }

        return new Response('Worker is Running', { status: 200 });
    }
};

async function toArray(input) {
    if (!input) return [];
    return Array.isArray(input) ? input : input.split(',').map(i => i.trim());
}

async function handleWSRequest(request, userId, url) {
    // Максимально упрощенный транспорт для обхода блокировок
    return new Response(null, {
        status: 101,
        webSocket: new WebSocket(url.toString()),
    });
}

async function handleGRPC(request, userId) {
    return new Response('gRPC OK', { status: 200 });
}

async function handleXHTTP(request, userId) {
    return new Response('XHTTP OK', { status: 200 });
}
