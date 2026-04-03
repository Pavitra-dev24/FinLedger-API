const { request, app, resetDb, createUserAndLogin } = require('./helpers');

beforeEach(resetDb);

describe('GET /api/dashboard — access control', () => {
  it('grants analyst access to the full dashboard', async () => {
    const { token } = await createUserAndLogin({ role: 'analyst' });
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('summary');
    expect(res.body.data).toHaveProperty('monthly_trend');
    expect(res.body.data).toHaveProperty('category_breakdown');
    expect(res.body.data).toHaveProperty('recent_activity');
  });

  it('grants viewer access to dashboard data (assignment spec)', async () => {
    
    const { token } = await createUserAndLogin({ role: 'viewer' });
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('summary');
  });

  it('returns 401 for unauthenticated request', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/dashboard/summary — data shape', () => {
  it('returns correct summary keys', async () => {
    const { token } = await createUserAndLogin({ role: 'admin' });

    
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 10000, type: 'income',  category: 'salary',   date: '2025-04-01' });
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 3000,  type: 'expense', category: 'housing',  date: '2025-04-05' });

    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const s = res.body.data;
    expect(s.total_income).toBe(10000);
    expect(s.total_expenses).toBe(3000);
    expect(s.net_balance).toBe(7000);
    expect(s.transaction_count).toBe(2);
  });
});

describe('GET /api/dashboard/trends/monthly — gap filling', () => {
  it('always returns exactly 12 months including zero-filled gaps', async () => {
    const { token } = await createUserAndLogin({ role: 'analyst' });
    const res = await request(app)
      .get('/api/dashboard/trends/monthly')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    
    expect(res.body.data).toHaveLength(12);
    
    for (const entry of res.body.data) {
      expect(entry).toHaveProperty('month');
      expect(entry).toHaveProperty('income');
      expect(entry).toHaveProperty('expenses');
      expect(entry).toHaveProperty('net');
    }
  });
});

describe('GET /api/dashboard/trends/weekly — gap filling', () => {
  it('always returns exactly 8 weekly entries', async () => {
    const { token } = await createUserAndLogin({ role: 'viewer' });
    const res = await request(app)
      .get('/api/dashboard/trends/weekly')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(8);
    for (const entry of res.body.data) {
      expect(entry).toHaveProperty('week');
      expect(entry).toHaveProperty('income');
      expect(entry).toHaveProperty('expenses');
    }
  });

  it('week labels use YYYY-WNN format with zero-padded week numbers', async () => {
    const { token } = await createUserAndLogin({ role: 'analyst' });
    const res = await request(app)
      .get('/api/dashboard/trends/weekly')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    
    const pattern = /^\d{4}-W\d{2}$/;
    for (const entry of res.body.data) {
      expect(entry.week).toMatch(pattern);
    }
    
    const weeks = res.body.data.map((e) => e.week);
    const sorted = [...weeks].sort();
    expect(weeks).toEqual(sorted);
    expect(new Set(weeks).size).toBe(8);
  });
});

describe('GET /api/users — admin only', () => {
  it('allows admin to list users', async () => {
    const { token } = await createUserAndLogin({ role: 'admin' });
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.users)).toBe(true);
  });

  it('blocks analyst from listing users (403)', async () => {
    const { token } = await createUserAndLogin({ role: 'analyst' });
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/users/:id/status — activate/deactivate', () => {
  it('admin can deactivate another user', async () => {
    const { token: adminToken } = await createUserAndLogin({ role: 'admin' });
    const { user: target }      = await createUserAndLogin({ role: 'viewer' });

    const res = await request(app)
      .patch(`/api/users/${target.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inactive' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('inactive');
  });

  it('prevents admin from deactivating themselves', async () => {
    const { token, user } = await createUserAndLogin({ role: 'admin' });
    const res = await request(app)
      .patch(`/api/users/${user.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'inactive' });
    expect(res.status).toBe(403);
  });

  it('deactivated user cannot authenticate', async () => {
    const { token: adminToken } = await createUserAndLogin({ role: 'admin' });
    const { user, raw }         = await createUserAndLogin({ role: 'analyst' });

    
    await request(app)
      .patch(`/api/users/${user.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inactive' });

    
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: raw.email, password: raw.password });
    expect(loginRes.status).toBe(403);
  });
});

describe('404 fallthrough', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
