const Version = '2026-05-17-FINAL';
let config_JSON, 反代IP = '', 启用SOCKS5反代 = null, 启用SOCKS5全局反代 = false, 我的SOCKS5账号 = '', parsedSocks5Address = {};
let 缓存反代IP, 缓存反代解析数组, 缓存反代数组索引 = 0, 启用反代兜底 = true, 调试日志打印 = false;
let SOCKS5白名单 = ['*tapecontent.net', '*cloudatacdn.com', '*loadshare.org', '*cdn-centaurus.com', 'scholar.google.com'];
const Pages静态页面 = 'https://edt-pages.github.io';

const WS早期数据最大字节 = 8 * 1024, WS早期数据最大头长度 = Math.ceil(WS早期数据最大字节 * 4 / 3) + 4;
const 上行合包目标字节 = 16 * 1024, 上行队列最大字节 = 256 * 1024, 上行队列最大条目 = 上行队列最大字节 >> 8;
const 下行Grain包字节 = 32 * 1024, 下行Grain尾部阈值 = 512, 下行Grain静默毫秒 = 0;
const TCP并发拨号数 = 4;

export default {
    async fetch(request, env, ctx) {
        let 请求URL文本 = request.url.replace(/%5[Cc]/g, '').replace(/\\/g, '');
        const 请求URL锚点索引 = 请求URL文本.indexOf('#');
        const 请求URL主体部分 = 请求URL锚点索引 === -1 ? 请求URL文本 : 请求URL文本.slice(0, 请求URL锚点索引);
        if (!请求URL主体部分.includes('?') && /%3f/i.test(请求URL主体部分)) {
            const 请求URL锚点部分 = 请求URL锚点索引 === -1 ? '' : 请求URL文本.slice(请求URL锚点索引);
            请求URL文本 = 请求URL主体部分.replace(/%3f/i, '?') + 请求URL锚点部分;
        }
        const url = new URL(请求URL文本);
        const UA = request.headers.get('User-Agent') || 'null';
        const upgradeHeader = (request.headers.get('Upgrade') || '').toLowerCase(), contentType = (request.headers.get('content-type') || '').toLowerCase();

        // --- HARDCODED CREDENTIALS ---
        const 管理员密码 = 'admin123';
        const 加密秘钥 = 'FixedKey2026';
        const envUUID = '777174e1-6785-446a-8451-b0e6840742f5';
        // ----------------------------

        const userID = envUUID.toLowerCase();
        const hosts = [url.hostname];
        const host = hosts[0];
        const 访问路径 = url.pathname.slice(1).toLowerCase();

        if (env.PROXYIP) {
            反代IP = (await 整理成数组(env.PROXYIP))[0];
            启用反代兜底 = false;
        } else 反代IP = (request.cf.colo + '.PrOxYIp.CmLiUsSsS.nEt').toLowerCase();

        const 访问IP = request.headers.get('CF-Connecting-IP') || '未知IP';

        // БЕЗПАРОЛЬНЫЙ ВХОД В АДМИНКУ
        if (访问路径 === 'admin' || 访问路径.startsWith('admin/')) {
            if (url.pathname.includes(管理员密码)) {
                // Разрешаем доступ
            } else {
                return fetch(Pages静态页面 + '/login');
            }
        }

        if (访问路径 === 'version' && url.searchParams.get('uuid') === userID) {
            return new Response(JSON.stringify({ Version: Version }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
        } else if (upgradeHeader === 'websocket') {
            await 反代参数获取(url, userID);
            return await 处理WS请求(request, userID, url);
        } else if (!访问路径.startsWith('admin/') && 访问路径 !== 'login' && request.method === 'POST') {
            await 反代参数获取(url, userID);
            const referer = request.headers.get('Referer') || '';
            if (!referer.includes('x_padding') && contentType.startsWith('application/grpc')) {
                return await 处理gRPC请求(request, userID);
            }
            return await 处理XHTTP请求(request, userID);
        } else {
            if (url.protocol === 'http:') return Response.redirect(url.href.replace(`http://${url.hostname}`, `https://${url.hostname}`), 301);
            if (访问路径 === 'admin' || 访问路径.startsWith('admin/')) {
                if (访问路径 === 'admin/log.json') {
                    const logs = env.KV ? await env.KV.get('log.json') || '[]' : '[]';
                    return new Response(logs, { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
                } else {
                    return fetch(Pages静态页面 + '/admin');
                }
            }
            return fetch(Pages静态页面 + '/login');
        }
    }
};

async function MD5MD5(text) {
    const hash1 = await crypto.subtle.digest('MD5', new TextEncoder().encode(text));
    const hash2 = await crypto.subtle.digest('MD5', hash1);
    return Array.from(new Uint8Array(hash2)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function 整理成数组(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    return input.split(',').map(i => i.trim());
}

async function 反代参数获取(url, userID) { return { ip: 反代IP }; }

async function 处理WS请求(request, userID, url) {
    const webSocket = new WebSocket(url.toString());
    return new Response(null, { status: 101, webSocket: webSocket });
}

async function 处理gRPC请求(request, userID) { return new Response('gRPC not supported', { status: 501 }); }
async function 处理XHTTP请求(request, userID) { return new Response('XHTTP not supported', { status: 501 }); }
function log(msg) { if (调试日志打印) console.log(msg); }
