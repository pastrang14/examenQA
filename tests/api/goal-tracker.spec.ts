import { test, expect } from '@playwright/test';

const BASE_URL = process.env.GOAL_TRACKER_BASE_URL || 'https://goal-tracker-api.onrender.com';

test.describe.serial('Goal Tracker API Test Suite', () => {

  const userName = 'Guillermo QA';
  const userPassword = 'Password123!';
  const userEmail = `qa_user_${Date.now()}@test.com`; 
  
  let authToken = '';
  let firstGoalId = '';
  let secondGoalId = '';

  // --- FASE 1: HEALTH CHECK ---
  test('Health Check - GET /api/v1/status', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/status`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('OPERATIONAL');
  });

  // --- FASE 2: REGISTRO Y LOGIN ---
  test('Registro - POST /api/v1/auth/register', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/auth/register`, {
      data: {
        name: userName,
        email: userEmail,
        password: userPassword
      }
    });
    expect(response.status()).toBe(201);
    
    const body = await response.json();
    expect(body.user.name).toBe(userName);
    expect(body.user.email).toBe(userEmail);
  });

  test('Login Positivo - POST /api/v1/auth/login', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: {
        email: userEmail,
        password: userPassword
      }
    });
    expect(response.status()).toBe(200); 
    
    const body = await response.json();
    expect(body.token).toBeDefined();
    authToken = body.token;
  });

  test('Login Negativo - POST /api/v1/auth/login', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: {
        email: 'correo_que_no_existe@test.com',
        password: 'ClaveIncorrecta'
      }
    });
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.msg).toBe('Invalid Credentials');
  });

  // --- FASE 3: CREACIÓN DE GOALS ---
  test('Crear Primer Goal - POST /api/v1/goals', async ({ request }) => {
    const goalData = {
      title: 'Dominar la automatización de APIs',
      description: 'Aprender a depurar errores de validación de datos'
    };

    const response = await request.post(`${BASE_URL}/api/v1/goals`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: goalData
    });

    expect([200, 201]).toContain(response.status());
    
    const body = await response.json();
    
    // Validaciones con la ruta correcta hacia el objeto 'goal'
    expect(body.goal.title).toBe(goalData.title);
    
    const generatedId = body.goal._id || body.goal.id;
    expect(generatedId).toBeDefined();
    expect(body.goal.createdAt).toBeDefined();
    
    firstGoalId = generatedId;
  });

  test('Crear Segundo Goal - POST /api/v1/goals', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/goals`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        title: 'Completar suite de pruebas',
        description: 'Finalizar los endpoints de consulta y eliminación'
      }
    });

    expect([200, 201]).toContain(response.status());
    
    const body = await response.json();
    secondGoalId = body.goal._id || body.goal.id;
  });

});