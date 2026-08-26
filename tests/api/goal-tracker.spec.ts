import { test, expect } from '@playwright/test';

// Leemos la URL base desde las variables de entorno
const BASE_URL = process.env.GOAL_TRACKER_BASE_URL || 'https://goal-tracker-api.onrender.com';

// Usamos 'test.describe.serial' para obligar a Playwright a ejecutar las pruebas
// una detrás de otra en orden estricto, ya que el Login depende del Registro.
test.describe.serial('Goal Tracker API Test Suite', () => {

  // Declaramos variables que necesitamos compartir entre las diferentes pruebas
  const userName = 'Guillermo QA';
  const userPassword = 'Password123!';
  
  // Generamos un correo único agregando los milisegundos actuales al string
  const userEmail = `qa_user_${Date.now()}@test.com`; 
  
  let authToken = ''; // Aquí guardaremos el token cuando el login sea exitoso

  // FASE 1: HEALTH CHECK ---
  test('Health Check - GET /api/v1/status', async ({ request }) => {
    //Aqui hacemos uso del metodo get, con nuestra cosntante declarada en la linea 4
    const response = await request.get(`${BASE_URL}/api/v1/status`);
    //Aqui hacemos la validacion del servicio
    expect(response.status()).toBe(200);

    //usamos la respuesta y le damos el formato json con la funcion .json, asignamos al body
    const body = await response.json();
    //aqui se hace la segunda asercion, si se obtiene un DOWN, Maintenance, nos dara problema
    expect(body.status).toBe('OPERATIONAL');
  });


  // REGISTRO DE USUARIO ---
  test('Registro - POST /api/v1/auth/register', async ({ request }) => {
    // Enviamos los datos en formato JSON dentro de la propiedad 'data'
    const response = await request.post(`${BASE_URL}/api/v1/auth/register`, {
      data: {
        name: userName,
        email: userEmail,
        password: userPassword
      }
    });

    // Validamos que el servidor responda con código 201 (Created)
    expect(response.status()).toBe(201);
    
    // Validamos que el cuerpo de la respuesta devuelva los datos correctos
    const body = await response.json();
    //console.log(body)
    expect(body.user.name).toBe(userName);
    expect(body.user.email).toBe(userEmail);
  });


  // LOGIN POSITIVO ---
  test('Login Positivo - POST ', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: {
        email: userEmail,
        password: userPassword
      }
    });

    // Validamos que el inicio de sesión sea exitoso (Status 200)
    expect(response.status()).toBe(200); 
    
    const body = await response.json();
    
    // Verificamos que el servidor nos entregó un token y lo almacenamos en memoria
    expect(body.token).toBeDefined();
    authToken = body.token;
  });



  // FASE 2.2: LOGIN NEGATIVO ---
  test('Login Negativo - POST ', async ({ request }) => {
    // Intentamos iniciar sesión con credenciales falsas a propósito
    const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: {
        email: 'correo_que_no_existe@test.com',
        password: 'ClaveIncorrecta'
      }
    });

    // Una credencial inválida DEBE ser rechazada con status 401 (Unauthorized)
    expect(response.status()).toBe(401);
    
    // Validamos el mensaje de error exacto que exige la documentación de la API
    const body = await response.json();
    expect(body.msg).toBe('Invalid Credentials');
  });

  
});