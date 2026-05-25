import type { PoolOptions } from 'mysql2/promise';

function stripEnv(value: string | undefined): string | undefined {
    if (value == null) return undefined;
    return value.trim().replace(/^["']|["']$/g, '');
}

function parseMysqlUrl(url: string): PoolOptions | null {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'mysql:') return null;
        return {
            host: parsed.hostname,
            port: parsed.port ? Number(parsed.port) : 3306,
            user: decodeURIComponent(parsed.username),
            password: decodeURIComponent(parsed.password),
            database: parsed.pathname.replace(/^\//, '') || 'railway',
            waitForConnections: true,
            connectionLimit: 10,
            enableKeepAlive: true,
            connectTimeout: 15000,
        };
    } catch {
        return null;
    }
}

/**
 * Configuração MySQL para Railway (mysql-volume) e desenvolvimento local.
 * Prioridade: MYSQL_URL → DATABASE_URL (mysql) → variáveis individuais.
 * Aceita também MYSQLHOST com URL completa (erro comum no .env).
 */
export function getMysqlPoolConfig(): PoolOptions | null {
    const mysqlUrl =
        stripEnv(process.env.MYSQL_URL) ||
        (stripEnv(process.env.DATABASE_URL)?.startsWith('mysql')
            ? stripEnv(process.env.DATABASE_URL)
            : undefined);

    if (mysqlUrl) {
        const parsed = parseMysqlUrl(mysqlUrl);
        if (parsed) return parsed;
        return {
            uri: mysqlUrl,
            waitForConnections: true,
            connectionLimit: 10,
            enableKeepAlive: true,
            connectTimeout: 15000,
        };
    }

    let host = stripEnv(process.env.MYSQLHOST) || stripEnv(process.env.MYSQL_HOST);
    if (!host) {
        return null;
    }

    // MYSQLHOST com URL inteira: mysql://user:pass@host:port/db
    if (host.startsWith('mysql://')) {
        const parsed = parseMysqlUrl(host);
        if (parsed) return parsed;
        host = host.replace(/^mysql:\/\//, '');
    }

    return {
        host,
        port: Number(
            stripEnv(process.env.MYSQLPORT) || stripEnv(process.env.MYSQL_PORT) || 3306
        ),
        user: stripEnv(process.env.MYSQLUSER) || stripEnv(process.env.MYSQL_USER) || 'root',
        password:
            stripEnv(process.env.MYSQLPASSWORD) ||
            stripEnv(process.env.MYSQL_PASSWORD) ||
            '',
        database:
            stripEnv(process.env.MYSQLDATABASE) ||
            stripEnv(process.env.MYSQL_DATABASE) ||
            'railway',
        waitForConnections: true,
        connectionLimit: 10,
        enableKeepAlive: true,
        connectTimeout: 15000,
    };
}
