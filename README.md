# DoAn1

## Chay bang Docker Compose

Yeu cau cai Docker Desktop truoc khi chay.

```bash
docker compose up --build
```

Sau khi cac container khoi dong:

- Frontend: http://localhost:5173
- API Gateway: http://localhost:3000
- Auth Service: http://localhost:5000
- MongoDB: mongodb://localhost:27017
- Redis: redis://localhost:6379

API Gateway se forward request tu `http://localhost:3000/api/auth/...` toi `auth-service` ben trong Docker network.
Ben trong Docker network, cac backend service ket noi Redis qua `REDIS_URL=redis://redis:6379`.
API Gateway dung Redis cho rate limit va cache response GET cong khai. Co the cau hinh bang:

```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RESPONSE_CACHE_ENABLED=true
RESPONSE_CACHE_TTL_SECONDS=60
```

Neu can dung upload qua Supabase, copy `.env.example` thanh `.env` o thu muc goc va dien gia tri that:

```bash
JWT_SECRET=your-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

Dung stack:

```bash
docker compose down
```
    