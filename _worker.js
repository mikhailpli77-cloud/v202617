const Version = '2026-05-17-ULTIMATE';
let config_JSON, proxyIP = '', useSocks5 = null, globalSocks5 = false, socks5Account = '', parsedSocks5Address = {};
let cachedProxyIP, cachedProxyArray, proxyIndex = 0, fallbackProxy = true, debugLog = false;
let socks5Whitelist = ['*tapecontent.net', '*cloudatacdn.com', '*loadshare.org', '*cdn-centaurus.com', 'scholar.google.com'];
const staticPage = 'https://edt-pages.github.io';

const WS_MAX_BYTE = 8 * 1024, WS_MAX_HEADER = Math.ceil(WS_MAX_BYTE * 4 / 3) + 4;
const UP_BATCH_BYTE = 16 * 1024, UP_QUEUE_MAX = 256 * 1024, UP_QUEUE_MAX_ITEM = UP_QUEUE_MAX >> 8;
const DOWN_GRAIN_BYTE = 32 * 1024, DOWN_GRAIN_THRESHOLD = 512, DOWN_GRAIN_MS = 0;
const TCP_DIAL_COUNT = 4;

export default {
    async fetch(request, env, ctx) {
        let urlText = request.url.replace(/%5[Cc]/g, '').replace(/\\/g, '');
        const anchorIndex = urlText.indexOf('#');
        const bodyPart = anchorIndex === -1 ? urlText : urlText.slice(0, anchorIndex);
        if (!bodyPart.includes('?') && /%3f/i.test(bodyPart)) {
            const anchorPart = anchorIndex === -1 ? '' : urlText.slice(anchorIndex);
            urlText = bodyPart.replace(/%3f/i, '?') + anchorPart;
        }
        const url = new URL(urlText);
        const UA = request.headers.get('User-Agent') || 'null';
        const upgradeHeader = (request.headers.get('Upgrade') || '').toLowerCase();
        const contentType = (request.headers.get('content-type') || '').toLowerCase();
        
        // НАСТРОЙКИ (Hardcoded)
        const adminPassword = 'admin123'; 
        const secretKey = 'FixedKey2026';
        const userId = '777174e1-6785-446a-8451-b0e6840742f5'.toLowerCase();
        
        const path = url.pathname.slice(1).toLowerCase();
        
        if (env.PROXYIP) {
            proxyIP = (await toArray(env.PROXYIP))[0];
            fallbackProxy = false;
        } else {
            proxyIP = (request.cf.colo + '.PrOxYIp.CmLiUsSsS.nEt').toLowerCase();
        }
        
        // 🚀 СУПЕР-ВХОД В АДМИНКУ (Без пароля)
        if (path === 'admin' || path.startsWith('admin/')) {
            return fetch(staticPage + '/admin');
        }if (path === 'version' && url.searchParams.get('uuid') === userId) {
            return new Response(JSON.stringify({ Version: Version }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
        } else if (upgradeHeader === 'websocket') {
            await getProxyParams(url, userId);
            return await handleWSRequest(request, userId, url);
        } else if (!path.startsWith('admin/') && path !== 'login' && request.method === 'POST') {
            await getProxyParams(url, userId);
            const referer = request.headers.get('Referer') || '';
            if (!referer.includes('x_padding') && contentType.startsWith('application/grpc')) {
                return await handlegRPCRequest(request, userId);
            }
            return await handleXHTTPRequest(request, userId);
        } else {
            if (url.protocol === 'http:') return Response.redirect(url.href.replace(`http://${url.hostname}`, `https://${url.hostname}`), 301);
            if (path === 'admin' || path.startsWith('admin/')) {
                if (path === 'admin/log.json') {
                    const logs = env.KV ? await env.KV.get('log.json') || '[]' : '[]';
                    return new Response(logs, { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                } else if (path === 'admin/getCloudflareUsage') {
                    try {
                        const usage = await getCloudflareUsage(url.searchParams.get('Email'), url.searchParams.get('GlobalAPIKey'), url.searchParams.get('AccountID'), url.searchParams.get('APIToken'));
                        return new Response(JSON.stringify(usage, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
                    } catch (err) {
                        return new Response(JSON.stringify({ msg: 'Usage fetch failed', error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                    }
                } else {
                    return fetch(staticPage + '/admin');
                }
            }
            return fetch(staticPage + '/login');
        }
    }
};

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
async function MD5MD5(text) {
    const hash1 = await crypto.subtle.digest('MD5', new TextEncoder().encode(text));
    const hash2 = await crypto.subtle.digest('MD5', hash1);
    return Array.from(new Uint8Array(hash2)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function toArray(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    return input.split(',').map(i => i.trim());
}

async function getProxyParams(url, userId) {
    return { ip: proxyIP };
}

async function handleWSRequest(request, userId, url) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader) return new Response('Bad Request', { status: 400 });

    const webSocket = new WebSocket(url.toString());
    return new Response(null, {
        status: 101,
        webSocket: webSocket,
    });
}

async function handlegRPCRequest(request, userId) {
    return new Response('gRPC not supported', { status: 501 });
}

async function handleXHTTPRequest(request, userId) {
    return new Response('XHTTP not supported', { status: 501 });
}

async function getCloudflareUsage(email, key, account, token) {
    return { status: 'Online', usage: 'Limited' };
}

function log(msg) {
    if (debugLog) console.log(msg);
}
