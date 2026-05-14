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

API Gateway se forward request tu `http://localhost:3000/api/auth/...` toi `auth-service` ben trong Docker network.

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
