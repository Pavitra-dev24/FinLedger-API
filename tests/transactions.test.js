const { request, app, resetDb, createUserAndLogin } = require('./helpers');

beforeEach(resetDb);

const validTx = {
  amount:   5000,
  type:     'income',
  category: 'salary',
  date:     '2025-01-15',
  notes:    'January salary',
};

describe('POST /api/transactions — role enforcement', () => {
  it('allows admin to create a transaction', async () => {
    const { token } = await createUserAndLogin({ role: 'admin' });
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validTx);

    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(5000);
    expect(res.body.data.type).toBe('income');
  });

  it('blocks analyst from creating a transaction (403)', async () => {
    const { token } = await createUserAndLogin({ role: 'analyst' });
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validTx);
    expect(res.status).toBe(403);
  });

  it('blocks viewer from creating a transaction (403)', async () => {
    const { token } = await createUserAndLogin({ role: 'viewer' });
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validTx);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/transactions — role enforcement', () => {
  it('allows analyst to list transactions', async () => {
    const { token } = await createUserAndLogin({ role: 'analyst' });
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('blocks viewer from listing transactions (403)', async () => {
    const { token } = await createUserAndLogin({ role: 'viewer' });
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('Transaction CRUD (admin)', () => {
  let adminToken, txId;

  beforeEach(async () => {
    const { token } = await createUserAndLogin({ role: 'admin' });
    adminToken = token;

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validTx);
    txId = res.body.data.id;
  });

  it('fetches a single transaction by id', async () => {
    const res = await request(app)
      .get(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(txId);
  });

  it('updates a transaction amount', async () => {
    const res = await request(app)
      .patch(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 9999 });
    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(9999);
  });

  it('soft-deletes a transaction', async () => {
    const del = await request(app)
      .delete(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);

    
    const get = await request(app)
      .get(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(get.status).toBe(404);
  });

  it('returns 404 for a non-existent transaction', async () => {
    const res = await request(app)
      .get('/api/transactions/non-existent-id')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

describe('Transaction validation', () => {
  let adminToken;
  beforeEach(async () => {
    const { token } = await createUserAndLogin({ role: 'admin' });
    adminToken = token;
  });

  it('rejects negative amount', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validTx, amount: -100 });
    expect(res.status).toBe(422);
  });

  it('rejects invalid type', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validTx, type: 'transfer' });
    expect(res.status).toBe(422);
  });

  it('rejects invalid date format', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validTx, date: '15-01-2025' });
    expect(res.status).toBe(422);
  });

  it('rejects invalid category', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validTx, category: 'taxes' });
    expect(res.status).toBe(422);
  });
});

describe('Transaction filtering', () => {
  let adminToken;
  beforeEach(async () => {
    const { token } = await createUserAndLogin({ role: 'admin' });
    adminToken = token;

    
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 5000, type: 'income',  category: 'salary',    date: '2025-03-01' });
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 1500, type: 'expense', category: 'food',      date: '2025-03-05' });
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 800,  type: 'expense', category: 'transport', date: '2025-03-10' });
  });

  it('filters by type=income', async () => {
    const res = await request(app)
      .get('/api/transactions?type=income')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.transactions.every((t) => t.type === 'income')).toBe(true);
  });

  it('filters by category', async () => {
    const res = await request(app)
      .get('/api/transactions?category=food')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.transactions.every((t) => t.category === 'food')).toBe(true);
  });

  it('respects pagination', async () => {
    const res = await request(app)
      .get('/api/transactions?limit=2&page=1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.transactions.length).toBeLessThanOrEqual(2);
    expect(res.body.data.total).toBe(3);
  });
});
