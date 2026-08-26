import { test, expect } from '@playwright/test';

const BASE_URL = process.env.GOAL_TRACKER_BASE_URL || 'https://goal-tracker-api.onrender.com';

//funcion de arreglo para agrupar multiples pruebas
test.describe.serial('Goal Tracker API Test Suite', () => {

  const userName = 'Guillermo QA';
  const userPassword = 'Password123!';
  //En esta constante, con ese tipo de comillas colocamos funcion date de js para asi tener correos unicos y no tener problemas de acceso al volver a ejecutarlo por el tema de registro
  const userEmail = `qa_user_${Date.now()}@test.com`; 
  
  let authToken = '';
  let firstGoalId = '';
  let secondGoalId = '';

  // --------------------- FASE 1: HEALTH CHECK ---
  test('Health Check - GET /api/v1/status', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/status`);
   //validar resultado de estado 200 
    expect(response.status()).toBe(200);

    const body = await response.json();
    //Aca tambien puede estar la palabra MAINTENANCE Y DOWN, en status
    //expect es de manera silenciosa quien genera un resultado --reporter=list es quien brinda los ok
    expect(body.status).toBe('OPERATIONAL');
  });

  // ------------- FASE 2: REGISTRO Y LOGIN ---
  test('Registro - POST /api/v1/auth/register', async ({ request }) => {

    //aca hacemos el request y lo asignamos a la constante response
    const response = await request.post(`${BASE_URL}/api/v1/auth/register`, {
      //payload para la petición
        data: {
        name: userName,
        email: userEmail,
        password: userPassword
      }
    });
    //Codigo 201 este es el codigo de registro en la base aca no es un 200 como podria ser un login
    expect(response.status()).toBe(201);
    
    const body = await response.json();
    //console.log(body) //A partir de esto sabemos los propiedades que trae el arreglo de user en el json 
    expect(body.user.name).toBe(userName);
    expect(body.user.email).toBe(userEmail);
    
  });

  //LOGIN POSITIVO
  test('Login Positivo - POST /api/v1/auth/login', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: {
        email: userEmail,
        password: userPassword
      }
    });
    expect(response.status()).toBe(200); 
    
    const body = await response.json();
    //Con esta funcion de playwright no importa el tipo de caracter que venga solo valida que venga uno
    expect(body.token).toBeDefined();
    authToken = body.token;
  });

  //LOGIN NEGATIVO
  test('Login Negativo - POST /api/v1/auth/login', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: {
        email: 'correo_que_no_existe@test.com',
        password: 'ClaveIncorrecta'
      }
    });
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    //con esto se asegura que si el dia de mañana se tiene otra respuesta, se esta buscando siempre el Invalid Credentials
    expect(body.msg).toBe('Invalid Credentials');
  });



  // --------------- FASE 3: CREACIÓN DE GOALS ---
  test('Crear Primer Goal - POST /api/v1/goals', async ({ request }) => {
    const goalData = {
      title: 'Dominar la automatización de APIs',
      description: 'Aprender a depurar errores de validación de datos'
    };

    const response = await request.post(`${BASE_URL}/api/v1/goals`, {
        //aqui a diferencia de todo lo anterior se necesita tener una autrhorization por el tema que se registrara informacion
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: goalData
    });
//en este caso de igual manera para ver si tuvimos el regitro de la authorization usamos el 201
    expect([200, 201]).toContain(response.status());
    
    const body = await response.json();
    
    //console.log(body)
    // Validaciones con la ruta correcta hacia el objeto 'goal'
    expect(body.goal.title).toBe(goalData.title);
    
    //como recomendacion se utilizo este or para evitar problema con base de datos que quita el guion bajo al inicio
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


  
  // --- FASE 4: CONSULTAS Y ELIMINACIÓN ---
  test('Consultar Single Goal - GET /api/v1/goals/:id', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/goals/${firstGoalId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    // Verificamos la integridad de los datos consultados
    const returnedId = body.goal._id || body.goal.id;
    expect(returnedId).toBe(firstGoalId);
    expect(body.goal.title).toBe('Dominar la automatización de APIs');
  });

  test('Consultar Listado Completo - GET /api/v1/goals', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/goals`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    
    // 1. Validar cantidad de registros
    expect(Array.isArray(body.goals)).toBeTruthy();
    expect(body.goals.length).toBeGreaterThanOrEqual(2);

    // 2. NUEVO: Validar "Existencia de goals creados"
    // Extraemos todos los IDs de la lista devuelta por el servidor
    const idsEnElListado = body.goals.map((goal: any) => goal._id || goal.id);
    
    // Verificamos que nuestros dos goals estén dentro de ese listado
    expect(idsEnElListado).toContain(firstGoalId);
    expect(idsEnElListado).toContain(secondGoalId);
  });

  test('Eliminar Goal - DELETE /api/v1/goals/:id', async ({ request }) => {
    // 1. Ejecutamos la instrucción de borrado
    const deleteResponse = await request.delete(`${BASE_URL}/api/v1/goals/${firstGoalId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Validamos que el servidor confirme el borrado (200 OK)
    expect(deleteResponse.status()).toBe(200);

    // 2. PRUEBA DE INEXISTENCIA: Intentamos consultar el registro borrado
    const getResponse = await request.get(`${BASE_URL}/api/v1/goals/${firstGoalId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Exigimos un 404 (Not Found) para confirmar que el recurso realmente desapareció
    expect(getResponse.status()).toBe(404);
  });
});