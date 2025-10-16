# Buda Converter Backend

Esta aplicación permite realizar conversiones de monedas FIAT mediante criptomonedas como intermediarias, además de detectar oportunidades de arbitraje en mercados de Buda.com. Incluye un frontend simple para probar las funcionalidades y visualizar resultados en tablas amigables.

---

## Funcionalidades

1. **Mejor conversión entre divisas A y B**  
   - Dado un monto en la divisa de origen (`from`) y la divisa destino (`to`), la app calcula las mejores conversiones usando **un único cripto intermediario**.  
   - Devuelve las top 3 conversiones ordenadas por `amount_out`.  
   - Los intermediarios posibles son los que se encuentran en los mercados de Buda.  

2. **Detección de arbitraje**  
   - Analiza oportunidades de arbitraje considerando ciclos de hasta **6 pasos**.  
   - Los ciclos siempre terminan en la misma divisa inicial (`from`).  
   - Devuelve los **5 mejores ciclos** con su monto final y porcentaje de ganancia.  
   - Descarta ciclos sin ganancia o con pérdida.  

3. **Visualización de mercados**  
   - Muestra una tabla con todos los mercados disponibles y sus últimos precios.  
   - Incluye tanto mercados directos como inversos (por ejemplo `BTC-CLP` y `CLP-BTC`).  

---

## Uso de la API de Buda

La app utiliza la API pública de Buda para obtener:

- **Markets**: lista de todos los mercados disponibles (`getMarkets`)  
- **Ticker**: último precio de cada mercado (`getTicker`)  

Estos datos son usados para calcular conversiones y arbitrajes en tiempo real.  

---

## Algoritmos implementados

### 1. Mejor conversión A → B

- Se obtiene el listado de mercados de Buda.  
- Para cada cripto disponible como intermediario entre `from` y `to`:  
  1. Se calcula cuánto cripto se obtiene con `amount` de `from`.  
  2. Luego, se calcula cuánto se obtiene al convertir ese cripto a `to`.  
- Se retornan las **3 conversiones más rentables.

### 2. Detección de arbitraje

- Se obtiene el listado completo de mercados y precios.  
- Se construye un grafo de divisas y sus tasas de conversión.  
- Se aplica **Bellman-Ford** para detectar ciclos con ganancia:  
  - Solo se consideran ciclos de máximo 6 pasos.  
  - Cada ciclo empieza y termina en la misma divisa inicial (`from`).  
  - Se calcula el monto final y porcentaje de ganancia.  
- Se retornan los **5 mejores ciclos de arbitraje**.

---

## Endpoints disponibles

| Método | Ruta                 | Descripción |
|--------|--------------------|-------------|
| POST   | `/convert`          | Calcula top 3 conversiones de `from` → `to`. |
| POST   | `/arbitrage-test`   | Detecta oportunidades de arbitraje desde `from` con `amount`. |
| GET    | `/markets`          | Devuelve todos los mercados con último precio, incluyendo inversos. |

**Payload ejemplo para `/convert`:**
```json
{
  "from": "CLP",
  "to": "PEN",
  "amount": 10000
}

# Buda Converter - Frontend

## Descripción
El frontend es una aplicación en **React** que permite al usuario:

1. Seleccionar una divisa de origen y una divisa destino (por ejemplo, CLP → PEN).  
2. Ingresar un monto a convertir.  
3. Obtener las **mejores conversiones posibles** usando un único intermediario.  
4. Probar ciclos de **arbitraje** de hasta 6 pasos y ver la **ganancia porcentual** potencial.  
5. Visualizar una **tabla amigable** con los mercados disponibles y sus últimos precios.  

La aplicación se comunica con el backend mediante **API REST** (`/api/convert`, `/api/arbitrage-test`, `/api/markets`) que obtiene datos desde **Buda.com** usando su API pública de mercados y tickers. El frontend no requiere exponer claves de API ni hacer requests directos a Buda.com.

---

## Requerimientos
- Node.js ≥ 18  
- npm ≥ 9  
- Browser moderno (Chrome, Edge, Firefox, Safari)  
- Backend corriendo y accesible (por defecto en `http://localhost:3000`)

---

## Backend

### Instalación

1. Entrar a la carpeta backend:

```bash
cd backend
```

2. Instalar dependencias:

```bash
npm install
```

### Ejecución

```bash
# Modo desarrollo con recarga automática
npm run dev

# Solo producción
npm start
```

### Tests

```bash
npm test
```

Ejecuta los tests del backend (Jest) y verifica los cálculos de conversiones y arbitraje.

---

## Frontend

### Instalación

1. Entrar a la carpeta frontend:

```bash
cd frontend
```

2. Instalar dependencias:

```bash
npm install
```

### Ejecución

```bash
npm run dev
```

Por defecto, Vite levantará el frontend en `http://localhost:5173`.  
Asegúrate de que el backend esté corriendo para que las llamadas a la API funcionen.

## Docker (opcional)

### Backend

Archivo `Dockerfile` en `/backend`:

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Build y run con Docker

```bash
# Backend
cd backend
docker build -t buda-backend .
docker run -p 3000:3000 buda-backend
