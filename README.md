# GraphLab UVG

**Plataforma interactiva de Matemática Discreta, teoría de grafos y algoritmos.**
Universidad del Valle de Guatemala, Campus Altiplano · Proyecto académico de Sergio Marco Antonio Gómez Toma.

> Sitio académico independiente: no es un sitio oficial de la Universidad del Valle de Guatemala y no usa su logotipo.

---

## Estado del proyecto

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Arquitectura, configuración, diseño global, panel principal, navegación y componentes reutilizables | ✅ Completada |
| 2 | Árboles binarios: editor, propiedades y recorridos animados | ✅ Completada |
| 3 | Editor de grafos: vértices, aristas, pesos, grados, matrices, JSON | ✅ Completada |
| 4 | Euler y Fleury, Hamilton, isomorfismo, Dijkstra, BFS y DFS | ✅ Completada |
| 5 | Laboratorio de práctica: ejercicios, calificación y retroalimentación | ✅ Completada |
| 6 | Pruebas de interfaz, optimización, documentación y publicación | 🟡 Lista para publicar en GitHub Pages (falta el primer despliegue) |

Los siete módulos están disponibles y probados.

**Dirección pública:** https://sergiogomez17.github.io/Proyecto-mate-discreta/ (GitHub Pages, gratuito, sin servidores externos). Se publica automáticamente en cada push a `main`; ver [Publicación en GitHub Pages](#publicación-en-github-pages).

### Qué se hizo en la Fase 6: calidad, optimización y documentación

- **Pruebas de punta a punta con Playwright** (`e2e/`), sobre la compilación de producción, en escritorio y en móvil (Pixel 7):
  - navegación y orden del menú;
  - cada tarjeta del inicio y cada ruta abierta directamente o recargada;
  - página 404, menú móvil y enlace «Saltar al contenido»;
  - el editor con ratón y teclado reales (clics en el lienzo, arrastre, Supr, deshacer, persistencia), importación de un archivo JSON y descarga de JSON y PNG;
  - reproducción automática en árboles, Dijkstra y BFS;
  - Fleury con un clic en el lienzo, isomorfismo y laboratorio;
  - borrado de todos los datos.
  - Cualquier error en la consola del navegador hace fallar la prueba.
- **Accesibilidad verificada con axe-core** (WCAG 2.1 A y AA) en las 10 páginas, sin problemas graves ni críticos. Se corrigieron dos:
  - el nombre accesible del logotipo no contenía su texto visible;
  - las tablas y el dibujo del árbol con desplazamiento horizontal no eran accesibles con el teclado. Ahora usan `ScrollArea`, que es enfocable y tiene nombre.
- **Corrección de errores y robustez:**
  - página de error propia para las rutas: si un módulo no se puede descargar (por ejemplo, tras publicar una versión nueva), se ofrece recargar en lugar de la pantalla técnica de React Router;
  - una prueba intermitente esperaba un efecto de React sin aguardarlo; se corrigió.
- **Optimización:**
  - **paquetes:** React y React Router van en un paquete propio que se conserva en caché entre versiones. React Flow (61 KB comprimido) y Motion (40 KB) se descargan solo en los módulos que los usan. El inicio carga unos 119 KB comprimidos de JavaScript;
  - **caché:** los archivos de `assets/` llevan una huella en el nombre, por lo que cada versión nueva usa nombres nuevos y el navegador nunca mezcla versiones.
- **Seguridad:**
  - **política de seguridad de contenido (CSP):** solo recursos del propio sitio. Se incluye en la compilación como etiqueta `<meta>` (GitHub Pages no permite encabezados propios) y las pruebas E2E se ejecutan con ella activa;
  - **otros encabezados:** `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy`;
  - **dependencias:** se actualizó Vitest a la versión 5, lo que elimina las vulnerabilidades críticas de las herramientas de prueba. `npm audit --omit=dev` (lo que se publica) informa **0 vulnerabilidades**. Persiste un aviso alto en `picomatch` 4.0.7 (ReDoS), usado solo al compilar con patrones propios y sin versión corregida publicada todavía.
- **Documentación:**
  - página de ayuda con la **documentación de cada algoritmo** (idea, complejidad y convenciones), el estado real de cada fase y la explicación de qué datos se guardan;
  - nuevo botón para **borrar todos los datos** de GraphLab;
  - metadatos para compartir el enlace (Open Graph).

### Qué funciona en la Fase 5: laboratorio de práctica (`/laboratorio`)

- **12 temas:** grados, árboles binarios, preorden, inorden, postorden, Euler, Fleury, Hamilton, isomorfismo, Dijkstra, BFS y DFS.
- **3 niveles por tema:** básico, intermedio y avanzado. El nivel cambia el tamaño y la dificultad del ejercicio, por ejemplo:
  - grados: aristas paralelas en intermedio y grafo dirigido en avanzado;
  - Dijkstra: peso cero y camino mínimo en intermedio, y grafo dirigido con posibles vértices inalcanzables en avanzado;
  - Euler avanzado: incluye grafos cuyas aristas no son conexas.
- **Generación de ejercicios válidos:** cada ejercicio se crea al azar con una semilla (es reproducible) y por construcción tiene solución. Por ejemplo:
  - Hamilton parte de un ciclo que recorre todos los vértices;
  - Fleury, de un grafo con todos los grados pares (o con exactamente dos impares);
  - isomorfismo usa una copia reetiquetada o una copia alterada cuya diferencia se verifica con la búsqueda exacta.
- **Respuestas interactivas:** campos numéricos, opciones, correspondencias y secuencias que se escriben o se construyen haciendo clic en los vértices o nodos de la figura.
- **Calificación matemática, no por texto:** cuando hay varias respuestas correctas, se acepta cualquiera.
  - **BFS y DFS:** se acepta cualquier orden de vecinos. Se simula la cola o la pila de llamadas y se indica si coincide con el orden alfabético.
  - **Fleury:** cualquier recorrido que use cada arista exactamente una vez.
  - **Hamilton:** cualquier ciclo hamiltoniano, en cualquier rotación, con o sin repetir el vértice inicial al final.
  - **Isomorfismo:** cualquier correspondencia biyectiva que conserve las aristas.
  - **Dijkstra:** cualquier camino de costo mínimo. Se aceptan «∞» o «inf» para los vértices inalcanzables.
  - **Recorridos de árboles:** la respuesta es única, por lo que se compara con el recorrido calculado e indica la posición del primer error.
- **Calificación y retroalimentación:**
  - porcentaje con crédito parcial por apartado;
  - mensajes que dicen qué corregir sin revelar el valor correcto;
  - se conserva la mejor calificación y se puede corregir y volver a comprobar.
- **Pistas progresivas:** tres por ejercicio, en orden creciente de ayuda; ninguna da la respuesta completa.
- **Solución:** solo se puede ver **después de comprobar al menos una vez**. Se calcula con los algoritmos del laboratorio y muestra la respuesta correcta de cada apartado.
- **Resultados e historial local** (en el navegador, máximo 100 registros):
  - ejercicios calificados, promedio y ejercicios perfectos;
  - promedio por tema;
  - lista con fecha, nivel, calificación, pistas usadas y si se vio la solución;
  - borrado con confirmación.

### Qué funciona en la Fase 4: algoritmos

Cada simulador tiene **su propio grafo de trabajo**, guardado en el navegador, con el mismo editor que «Teoría de grafos» (modos, pesos, deshacer, propiedades). El botón «Usar el grafo del editor» copia el grafo construido en el editor, y también se puede importar o exportar JSON. Mientras una simulación está en curso, la edición se bloquea (con un aviso) para que los pasos mostrados correspondan siempre al grafo dibujado.

**Euler y Fleury** (`/simulaciones/euler-hamilton`, pestaña «Euler y Fleury»):

- **Clasificación:** circuito euleriano, camino euleriano abierto o grafo no euleriano, con la explicación del criterio:
  - no dirigidos: 0, 2 o más de 2 vértices de grado impar;
  - dirigidos: equilibrio entre entrada y salida;
  - conexidad de las aristas; los vértices aislados se ignoran.
- **Tabla de grados** con su paridad (o equilibrio, en dirigidos). En el lienzo, los vértices impares se marcan.
- **Fleury interactivo:** se elige el vértice inicial y el sistema verifica que sirva (por ejemplo, «debe empezar en B o C»). Después, el usuario elige una arista por vez, en la lista o en el lienzo. En cada paso:
  - se muestran las aristas disponibles y se detectan los **puentes del grafo restante** (Tarjan, con aristas paralelas);
  - un **puente evitable** se advierte y se puede elegir otra arista o cruzarlo de todos modos;
  - no se permite repetir aristas;
  - el lienzo resalta el recorrido y numera las aristas usadas, y se muestra el orden de visita.
- **Final:** se comprueba si se usaron todas las aristas y se da la conclusión (circuito, camino o recorrido bloqueado).
- **Ayudas:** «Paso de Fleury», «Completar con Fleury» y «Deshacer arista».
- **Grafos dirigidos:** se usa el mismo procedimiento, avisando cuando una arista impediría completar el recorrido.

**Hamilton** (misma página, pestaña «Hamilton»):

- **Búsqueda por backtracking** de caminos o ciclos hamiltonianos, con vértice inicial opcional y límite configurable (10 000, 100 000 o 1 000 000 extensiones).
- **Tres resultados que nunca se confunden:**
  - *existe solución* (ruta verificada);
  - *se demostró que no existe*, por un argumento estructural (desconexión, vértices con un solo vecino…) o por búsqueda exhaustiva;
  - *búsqueda incompleta por el límite*: no se afirma nada.
- **Validación de rutas propias:** se construyen haciendo clic en los vértices del lienzo. Se detectan repeticiones, saltos sin arista, vértices faltantes y la arista de cierre del ciclo.

**Isomorfismo** (`/simulaciones/isomorfismo`):

- **Dos editores en la misma pantalla (G1 y G2)** y cuatro pares de ejemplo:
  - pentágono y estrella;
  - K3,3 y el prisma;
  - C6 y dos triángulos;
  - dos grafos dirigidos.
- **Tabla de invariantes:** tipo, vértices, aristas, secuencias de grados ordenadas (también de entrada y salida), componentes y triángulos.
- **Búsqueda exacta por backtracking con poda:** grados compatibles y conservación incremental de la multiplicidad de aristas. El resultado es una correspondencia verificada, una demostración de que no son isomorfos o un aviso de búsqueda incompleta. La secuencia de grados nunca se usa como prueba suficiente.
- **Correspondencias propuestas:** se verifica que sean biyectivas y que conserven cada conexión (con aristas paralelas y sentido de los arcos). Cada conexión que no se conserva se indica y se marca en rojo en ambos lienzos.

**Dijkstra** (`/simulaciones/dijkstra`):

- **Configuración:**
  - origen y destino (u opción «Todos»);
  - los pesos se editan con el editor;
  - sin ponderación, cada arista pesa 1.
- **Ejecución:** automática con cuatro velocidades o paso a paso, con pausa, retroceso y reinicio.
- **Pasos:** cada uno es una operación real del algoritmo: inicialización, elección del vértice definitivo y cada relajación, con su fórmula `d(v) = min(d(v), d(u) + w(u,v))` y el caso (mejora, empate o sin cambio).
- **Tabla** con distancia provisional, distancia definitiva, predecesor(es) y estado.
- **Lienzo:**
  - distancia de cada vértice;
  - vértice actual, definitivos y vecino que se relaja;
  - arista relajada y árbol de predecesores.
- **Resultado:** costo total y camino mínimo resaltado; si hay empates, todos los caminos mínimos y cuántos son.
- **Casos especiales:**
  - grafos dirigidos y no dirigidos;
  - pesos cero;
  - vértices inalcanzables (distancia ∞);
  - aristas paralelas (se usa la de menor peso);
  - **pesos negativos: el algoritmo no se ejecuta** y se listan las aristas que hay que corregir.

**BFS y DFS** (`/simulaciones/bfs-dfs`):

- **Configuración:**
  - pestañas BFS y DFS y vértice inicial;
  - opción de continuar con los vértices no alcanzados (bosque).
- **Ejecución:** automática o paso a paso, con los mismos controles.
- **En cada paso:**
  - vértice actual y orden de visita numerado;
  - **cola** (BFS) o **pila de llamadas** recursivas (DFS);
  - arista examinada, aristas exploradas y **árbol de recorrido**;
  - explicación de por qué un vecino se ignora (ya descubierto, o el padre).
- **Final:** secuencia final y aviso de los vértices no alcanzables.
- **Orden determinista:** los vecinos se exploran por nombre (alfabético y numérico: `v2` antes que `v10`). En dirigidos se siguen los arcos.

**Decisiones técnicas de la Fase 4.**

- `createGraphStore` crea almacenes independientes (editor, cada simulador, G1 y G2). Un contexto de React indica a los paneles de propiedades qué grafo editan.
- `GraphWorkspace` reúne la barra de herramientas, el lienzo y los avisos, y lo usan los cinco módulos de grafos.
- El lienzo recibe un «resaltado» (estado y etiqueta por vértice y por arista) calculado a partir del paso actual, sin duplicar el grafo.
- React Flow queda en un paquete compartido (unos 238 KB, 78 KB comprimido) que se descarga una sola vez para todos los simuladores de grafos. Cada página añade entre 12 y 34 KB.

### Qué funciona en la Fase 3: editor de grafos (`/simulaciones/grafos`)

- **Lienzo interactivo (React Flow)** con tres modos:
  - *Seleccionar y mover*: arrastrar vértices; clic en un vértice, una arista o su peso para editarlo; `Supr` elimina lo seleccionado y `Esc` cancela.
  - *Agregar vértices*: cada clic en un espacio vacío crea un vértice con el primer nombre libre (A, B, …).
  - *Agregar aristas*: clic en el origen y luego en el destino. Un clic en el mismo vértice explica que no se permiten lazos.
  - Zoom con botones o gesto de pellizco; la rueda del ratón desplaza la página y no queda atrapada en el lienzo.
- **Panel «Propiedades»** (también usable solo con teclado):
  - vértice seleccionado: grado, o grados de entrada y salida, vecinos, sucesores y predecesores; renombrar, crear arista desde él y eliminarlo (con confirmación que indica cuántas aristas incidentes se borran);
  - arista seleccionada: extremos, peso y aristas paralelas; cambiar el peso, invertir el sentido (si es dirigido) y eliminarla;
  - formularios para agregar vértices y aristas sin usar el lienzo.
- **Tipo de grafo:** interruptores «Dirigido» y «Ponderado». Al quitar la dirección, los arcos opuestos quedan como aristas paralelas y el editor lo informa. Al desactivar los pesos, se conservan, pero todas las aristas cuentan con peso 1.
- **Pesos:** enteros o decimales, con punto o coma (`2,5`), negativos incluidos (Dijkstra los rechazará en la Fase 4), con magnitud máxima de 1 000 000.
- **Historial:** Deshacer y Rehacer (50 pasos) para toda edición, incluidas la carga de ejemplos, la importación y el reinicio.
- **Resultados calculados en vivo:**
  - número de vértices y aristas, y comprobación del lema del apretón de manos (Σ grados = 2|E|);
  - tabla de grados con paridad; grado de entrada y de salida en grafos dirigidos;
  - matriz de adyacencia con la multiplicidad o con los pesos;
  - lista de adyacencia ordenada;
  - componentes conexas y, en grafos dirigidos, débilmente y fuertemente conexas (Kosaraju).
- **Ejemplos:** red de ciudades ponderada, puentes de Königsberg (multigrafo), «la casa», grafo dirigido con ciclos, grafo desconexo y K5.
- **Proyectos:**
  - guardar hasta 20 proyectos con nombre en el navegador; abrirlos y eliminarlos, con confirmación;
  - el grafo en edición también se guarda automáticamente;
  - los datos guardados se validan al cargarlos.
- **Exportar e importar:**
  - exportar **JSON**, **SVG** y **PNG** (las imágenes usan la misma geometría que el lienzo);
  - importar **JSON** con validación completa y mensajes que indican el elemento con error.
- **Dibujo:** las aristas van de centro a centro y se recortan en el borde del vértice; las paralelas y los arcos opuestos se curvan para no superponerse. Un cruce de aristas es solo visual y nunca crea un vértice.

**Formato JSON** (`graphlab-uvg/grafo`, versión 1):

```json
{
  "format": "graphlab-uvg/grafo",
  "version": 1,
  "name": "Red de ciudades",
  "directed": false,
  "weighted": true,
  "vertices": [{ "id": "v1", "label": "A", "x": 80, "y": 220 }],
  "edges": [{ "id": "e1", "source": "v1", "target": "v2", "weight": 4 }]
}
```

Para escribir un grafo a mano se acepta una forma abreviada:

- vértices como texto (`"vertices": ["A", "B", "C"]`), colocados en círculo si no tienen coordenadas;
- extremos de arista por nombre (`{ "source": "A", "target": "B" }`);
- aristas sin `id`, y sin `weight` (peso 1).

**Decisión técnica: el modelo es la única fuente de verdad.** React Flow solo dibuja. El grafo vive en el estado de la aplicación (`src/stores/graphStore.ts`), y todas las modificaciones pasan por funciones puras de `src/algorithms/graph/editing.ts`, que aplican la política (sin lazos, nombres únicos, pesos finitos). Así, las mismas reglas valen para el lienzo, los formularios, la importación y las fases siguientes.

### Qué funciona en la Fase 2: árboles binarios (`/simulaciones/arboles-binarios`)

- **Editor:**
  - crear la raíz; agregar hijo izquierdo o derecho; renombrar; intercambiar hijos;
  - eliminar un nodo con todo su subárbol, con confirmación que indica cuántos nodos se borran;
  - cinco árboles de ejemplo y reinicio del árbol, también con confirmación;
  - las etiquetas se validan: no vacías, sin espacios, de 6 caracteres como máximo y únicas;
  - el árbol se guarda en el navegador y, si los datos guardados no superan la validación, se descartan.
- **Validación de la estructura:** raíz única, un padre por nodo, sin ciclos ni nodos desconectados.
- **Propiedades:**
  - número de nodos, raíz, hojas, nodos internos, grado del árbol y niveles;
  - **altura en aristas** (un solo nodo: 0; árbol vacío: −1);
  - tabla con profundidad, padre, grado (número de hijos) y grado como grafo de cada nodo.
- **Recorridos animados:**
  - preorden, inorden, postorden y por niveles (BFS);
  - controles: Iniciar, Pausar, Continuar, Paso siguiente, Paso anterior, Reiniciar recorrido y cuatro velocidades.
- **Qué muestra cada paso:**
  - el nodo actual, con un anillo animado sobre el árbol;
  - los nodos visitados con su número de orden y la secuencia acumulada;
  - la pila de llamadas (o la cola, en BFS) y la explicación del movimiento;
  - al terminar, el resultado final.
- **Fidelidad de los pasos:** corresponden a las operaciones reales del algoritmo: entrar en la llamada recursiva, registrar el nodo y regresar al padre; en BFS, encolar y desencolar. Las pruebas comprueban que la secuencia animada coincide con una implementación recursiva de referencia.
- **Edición durante un recorrido:** si el árbol cambia, el recorrido se reinicia con los pasos recalculados.

**Decisión técnica: SVG en lugar de React Flow para los árboles.** En un árbol binario la posición de cada nodo está determinada por la estructura: la columna es su posición en inorden y la fila, su nivel. Un lienzo de arrastre libre permitiría dibujos engañosos, con un hijo izquierdo colocado a la derecha. Con SVG y esta disposición determinista, el dibujo siempre refleja el árbol real y se anima directamente. React Flow se usa en el editor de grafos (Fase 3), donde la posición sí es libre.

**División de código.** Cada simulador se descarga solo al abrirlo; mientras tanto se muestra un indicador de carga. El panel principal pesa unos 365 KB (117 KB comprimido); el módulo de árboles, 159 KB, y el editor de grafos, 252 KB (82 KB comprimido; la mayor parte es React Flow).

### Qué funciona en la Fase 1

- Panel principal con:
  - encabezado y título «GraphLab UVG», y las siete tarjetas de módulos;
  - información académica y guía de uso plegable (la preferencia se guarda);
  - un grafo de ejemplo cuyos grados y suma (lema del apretón de manos) se calculan con el módulo de algoritmos.
- Navegación **Inicio → Laboratorio → Simulaciones**, con «Ayuda», menú móvil accesible, migas de pan y página 404.
- Página de ayuda con la política de grafos, el estado de cada fase y el borrado de datos locales, que pide confirmación.
- Preferencias en `localStorage` con validación al cargar y respaldo en memoria si el navegador bloquea el almacenamiento.
- Algoritmos base, probados: cálculo de grados (incluidos dirigidos y multigrafos) y validación de grafos según la política.

## Tecnologías

| Área | Elección | Motivo |
|---|---|---|
| Interfaz | React 19 + TypeScript (modo estricto) | Componentes tipados y mantenibles |
| Compilación | Vite 7 | Arranque y compilación rápidos; salida estática apta para GitHub Pages |
| Estilos | Tailwind CSS 4 | La paleta institucional se define como tokens (`src/styles/index.css`) |
| Rutas | React Router 7 | Rutas generadas desde un registro único de módulos |
| Estado | Zustand 5 (+ `persist`) | Estado global sencillo con persistencia local |
| Iconos | Lucide React | Iconografía consistente |
| Editor de grafos | React Flow (`@xyflow/react`) | Lienzo con arrastre, zoom, selección y accesibilidad de teclado |
| Animaciones | Motion | Indicador animado del nodo actual en los recorridos |
| Tipografía | Inter (`@fontsource-variable/inter`) | Se sirve desde el propio sitio, sin CDN |
| Pruebas | Vitest + React Testing Library + jsdom | Pruebas unitarias y de interfaz |
| Pruebas E2E | Playwright + axe-core | Navegador real (Edge o Chrome) en escritorio y móvil, y accesibilidad |

No hay backend: la plataforma funciona en el navegador y guarda los datos localmente.

## Arquitectura

La lógica matemática vive en `src/algorithms/`, en TypeScript puro y sin dependencias de React, para poder probarla de forma aislada. Los componentes solo presentan resultados.

```
graphlab-uvg/
├── .github/workflows/
│   └── deploy.yml           Pruebas, compilación y publicación en GitHub Pages
├── public/                  Recursos estáticos (favicon)
├── src/
│   ├── app/                 Registro de módulos, rutas y raíz de la aplicación
│   ├── algorithms/
│   │   ├── practice/        Generadores con semilla, validadores matemáticos y ejercicios (12 temas × 3 niveles)
│   │   ├── graph/           Edición, representaciones, componentes, JSON, Euler/Fleury, Hamilton,
│   │   │                    isomorfismo, Dijkstra y BFS/DFS (con registro de pasos)
│   │   └── tree/            Propiedades, validación, edición, recorridos con pasos y disposición
│   ├── components/
│   │   ├── graph/           Lienzo React Flow, vértices, aristas curvas, geometría y exportación SVG
│   │   ├── layout/          Encabezado, pie, migas de pan, encabezado de página, carga
│   │   ├── tree/            Lienzo SVG del árbol con resaltado animado del recorrido
│   │   └── ui/              Botón, panel, insignia, interruptor, mensajes, diálogo de confirmación
│   ├── hooks/               usePlayer (reproductor de pasos con temporizador)
│   ├── modules/             Una carpeta por pantalla (dashboard, graphs, euler, isomorphism, dijkstra,
│   │                        traversals…); shared/ contiene el editor reutilizable y el reproductor
│   ├── stores/              Estado global con Zustand
│   ├── styles/              Tokens de diseño y estilos base
│   ├── tests/               Pruebas (algoritmos, utilidades, estado e interfaz)
│   ├── types/               Modelos de datos: grafos y árboles binarios
│   ├── utils/               Almacenamiento seguro, descargas y utilidades
│   └── main.tsx
├── e2e/                     Pruebas de punta a punta (Playwright + axe-core) y servidor que imita GitHub Pages
├── index.html
├── playwright.config.ts     Escritorio y móvil sobre la compilación de producción
├── vercel.json              Solo para una publicación alternativa en Vercel (ver al final)
└── vite.config.ts           Ruta base, páginas por ruta para GitHub Pages, CSP, paquetes y Vitest
```

**Registro único de módulos (`src/app/modules.ts`).** El panel principal, la página «Simulaciones», el pie de página y las rutas se generan desde esta lista. Para entregar un módulo basta con cambiar su `status` y sustituir `ModuleStatusPage` por su página real en `src/app/routes.tsx`.

**Componentes reutilizables.**

| Componente | Función |
|---|---|
| `Panel` | Contenedor con encabezado azul marino |
| `ModuleCard` | Tarjeta gris azulado semitransparente |
| `Button` / `ButtonLink` | Variantes primaria (morada), secundaria, sobre fondo oscuro y peligro |
| `Badge` | Insignias de estado |
| `ConfirmDialog` | Confirmación de acciones destructivas: foco atrapado, Escape para cancelar y foco inicial en «Cancelar» |
| `Switch` | Interruptor accesible (`role="switch"`) |
| `Feedback` | Mensajes de error (`role="alert"`) y de éxito (`role="status"`) |
| `GraphCanvas` | Lienzo del editor de grafos |
| `PageHeader` | Banda azul marino con migas de pan |

## Política de grafos

Todos los módulos y algoritmos siguen la misma política (detallada en `src/types/graph.ts`):

- **Lazos:** no permitidos.
- **Aristas paralelas:** permitidas (multigrafos, por ejemplo los puentes de Königsberg). Cuentan por separado para el grado, y la matriz de adyacencia muestra su multiplicidad.
- **Grafos dirigidos:** u→v y v→u son arcos distintos. Se distinguen grado de entrada y de salida.
- **Pesos:** reales finitos. Sin ponderación, cada arista pesa 1. Dijkstra rechaza pesos negativos.
- **Cruces de aristas:** en el dibujo no crean vértices.
- **Recorridos:** exploran a los vecinos por nombre, de forma determinista.
- **Árboles:** la altura es el número de aristas de la raíz a la hoja más lejana (un nodo: altura 0; árbol vacío: −1).

## Requisitos

- Node.js 20.19 o posterior (probado con Node 24) y npm 10 o posterior.

## Instalación y uso local

```bash
npm install
npm run dev
```

Abra `http://localhost:5173/Proyecto-mate-discreta/` (la aplicación usa la misma ruta base que en GitHub Pages).

| Script | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprobación de tipos y compilación de producción en `dist/` |
| `npm run preview` | Sirve la compilación de producción |
| `npm run typecheck` | Solo TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Pruebas con Vitest |
| `npm run check` | Tipos + lint + pruebas + compilación (lo mismo que conviene ejecutar antes de publicar) |
| `npm run test:e2e` | Pruebas de punta a punta con Playwright (compila y sirve la versión de producción) |
| `npm run check:all` | `check` y luego las pruebas de punta a punta |

## Pruebas

```bash
npm test            # unitarias y de interfaz (Vitest)
npm run test:e2e    # de punta a punta (Playwright)
```

**Resultado tras la Fase 6:**

- **Vitest:** 304 pruebas en 27 archivos, todas superadas.
- **Playwright:** 63 pruebas superadas en escritorio y móvil. Hay 5 omitidas a propósito porque solo aplican a uno de los dos: arrastre y teclado físico en escritorio, menú móvil en móvil.
- **Servidor de las pruebas E2E:** `e2e/pages-server.mjs`, que se comporta como GitHub Pages:
  - el sitio vive bajo `/Proyecto-mate-discreta/`;
  - no reescribe rutas;
  - redirige las carpetas sin barra final;
  - responde con `404.html` a las direcciones desconocidas.

  Las pruebas fallan si la página pide algún recurso fuera de esa carpeta o recibe un error al descargarlo.

**Pruebas de punta a punta.** Por defecto usan **Microsoft Edge** instalado en el equipo, así que no hay que descargar navegadores. Alternativas:

```bash
PW_CHANNEL=chrome npm run test:e2e     # Google Chrome instalado
npx playwright install chromium         # Chromium de Playwright (por ejemplo, en integración continua)
PW_CHANNEL=chromium npm run test:e2e
```

En PowerShell, la variable se define antes: `$env:PW_CHANNEL = "chrome"; npm run test:e2e`.

**Resultado tras la Fase 5:** 301 pruebas en 25 archivos.

**Laboratorio de práctica (Fase 5):**

- **Para los 36 pares de tema y nivel, con 6 semillas cada uno:**
  - el ejercicio es reproducible;
  - la respuesta calculada con los algoritmos obtiene 100 %;
  - una respuesta vacía obtiene 0 % sin errores;
  - la solución existe.
- **Variedad:** el ejercicio de isomorfismo genera casos isomorfos y no isomorfos; el de Euler, circuitos, caminos y grafos no eulerianos.
- **Validadores:** BFS acepta órdenes no alfabéticos y rechaza saltos de nivel; DFS acepta y rechaza según la profundidad; continuidad y repetición en recorridos eulerianos.
- **Calificación:**
  - crédito parcial sin revelar la respuesta;
  - posición del primer error en recorridos de árboles;
  - media calificación al reconocer un isomorfismo sin dar la correspondencia;
  - rotaciones del ciclo hamiltoniano;
  - lectura de «∞».
- **Interfaz:**
  - grados calificados con error y luego corregidos; historial y solución solo después de comprobar;
  - recorrido construido con clics en el árbol y pistas;
  - orden BFS escrito por el estudiante;
  - borrado del historial con confirmación.

`vite.config.ts` fija un límite de 20 s por prueba: las de interfaz recorren simulaciones completas y, en paralelo, pueden superar los 5 s por defecto.

**Resultado tras la Fase 4:** 242 pruebas en 23 archivos.

**Algoritmos (Fase 4):**

- **Euler:**
  - clasificación de K5 (circuito), la casa (camino entre B y C) y Königsberg (no euleriano);
  - vértices aislados, aristas en dos componentes, grafos dirigidos;
  - validación del vértice inicial.
- **Puentes:** detección en un grafo con dos ciclos unidos; las aristas paralelas nunca son puente.
- **Fleury:**
  - produce recorridos válidos (cada arista una vez y de forma continua) en varios grafos, en multigrafos y en dirigidos;
  - detecta el puente evitable y comprueba que cruzarlo impide terminar.
- **Hamilton:**
  - ciclo en la casa; Petersen tiene camino pero se demuestra por búsqueda exhaustiva que no tiene ciclo;
  - el límite produce «búsqueda incompleta»;
  - demostraciones estructurales; sentido de los arcos e inicio fijo;
  - validación de rutas (repeticiones, saltos, cierre).
- **Isomorfismo:**
  - pentágono y estrella; K3,3 frente al prisma (difieren solo en triángulos);
  - C8 con cuerdas distintas: todos los invariantes iguales y se demuestra por búsqueda exhaustiva que no son isomorfos;
  - C6 frente a dos triángulos; dirigidos;
  - multiplicidad; verificación de correspondencias.
- **Dijkstra:**
  - distancias conocidas;
  - **comparación con Bellman-Ford desde cada origen en cinco grafos**;
  - fórmulas de relajación; empates con dos caminos mínimos; peso cero; inalcanzables; dirigidos; aristas paralelas; pesos negativos.
- **BFS y DFS:**
  - orden de visita; cola y pila en cada paso;
  - árbol con n − 1 aristas; bosque; dirigidos;
  - cada vértice una sola vez.

**Interfaz (Fase 4):**

- **Dijkstra:**
  - paso a paso hasta el camino mínimo, con la edición bloqueada mientras dura;
  - empates e inalcanzables;
  - rechazo de pesos negativos.
- **BFS y DFS:** cola en BFS, pila en DFS, resultado con vértices no alcanzables y modo bosque.
- **Fleury:** clasificación, inicio inválido, recorrido completo y advertencia de puente evitable.
- **Hamilton:** búsqueda y ruta construida con clics en el lienzo.
- **Isomorfismo:** correspondencia encontrada y verificada; ruptura de la biyección; K3,3 y prisma.

**Resultado tras la Fase 3:** 182 pruebas en 18 archivos.

**Editor de grafos (Fase 3):**

- **Edición:**
  - nombres válidos y únicos;
  - rechazo de lazos; aristas paralelas permitidas;
  - eliminar un vértice borra sus aristas incidentes;
  - lectura de pesos (coma decimal, negativos, rechazos);
  - límites del editor;
  - paso de dirigido a no dirigido.
- **Representaciones:**
  - matriz simétrica con multiplicidad (Königsberg) y matriz dirigida (fila = origen);
  - lista de adyacencia con orden natural (`v2` antes que `v10`);
  - grados de los ejemplos (Königsberg 5, 3, 3, 3; K5, todos 4).
- **Conexidad:**
  - grafo desconexo con vértice aislado;
  - componentes fuertemente conexas de un grafo dirigido;
  - ciclo dirigido frente a camino dirigido; grafo vacío.
- **JSON:**
  - cada ejemplo se exporta y se vuelve a importar idéntico;
  - forma abreviada;
  - 13 casos de archivo inválido con su mensaje;
  - nombres de archivo seguros;
  - validación de datos guardados.
- **Dibujo:**
  - recorte en el borde del vértice;
  - curvas para aristas paralelas y arcos opuestos;
  - formato de pesos;
  - contenido del SVG exportado.
- **Estado:**
  - deshacer y rehacer;
  - selección coherente;
  - proyectos (guardar, sobrescribir, abrir, eliminar, límite);
  - descarte de datos guardados inválidos.
- **Interfaz:**
  - el lienzo dibuja los vértices y aristas del ejemplo;
  - agregar vértices y aristas desde los formularios;
  - mensajes de error;
  - seleccionar un vértice en el lienzo, renombrarlo, eliminarlo con confirmación y deshacer;
  - seleccionar una arista por su peso y modificarlo;
  - modo dirigido;
  - importar JSON válido e inválido; exportar JSON;
  - guardar y abrir proyectos.

En jsdom, el arrastre de vértices de React Flow no puede simularse (sus eventos no traen `view`). El arrastre, la creación de vértices y aristas con clics y las flechas se verificaron en el navegador.

**Árboles binarios (Fase 2):**

- **Recorridos con resultado conocido:**
  - árbol de expresión: el inorden da `a + b · c − d`;
  - árbol de búsqueda: el inorden sale ordenado;
  - un árbol con nodos de un solo hijo, el árbol vacío y el de un solo nodo.
- **Pasos de la simulación:**
  - la secuencia animada coincide con la de referencia, con un registro por nodo;
  - cada llamada recursiva se abre y se cierra, y el nodo actual está en la cima de la pila;
  - en BFS, la cola es correcta en cada paso;
  - las explicaciones mencionan los subárboles vacíos.
- **Estructura y edición:**
  - altura en aristas, niveles, hojas y grados;
  - disposición (columnas en inorden y cada hijo del lado que le corresponde);
  - validación: ciclos, dos padres, nodos desconectados y etiquetas repetidas;
  - operaciones de edición y reproductor de pasos.
- **Interfaz:**
  - editar el árbol y que las propiedades se recalculen;
  - mensajes de error y eliminación con confirmación;
  - recorrido paso a paso hasta el resultado final;
  - reproducción automática con pausa y continuación (temporizadores simulados);
  - reinicio del recorrido al modificar el árbol.

**Fase 1:**

- **Algoritmos:** grados en grafos no dirigidos, dirigidos y con aristas paralelas (Königsberg); vértices aislados; lema del apretón de manos; validación de lazos, nombres repetidos, extremos inexistentes y pesos no finitos.
- **Estado y almacenamiento:** persistencia de preferencias, descarte de datos alterados y funcionamiento sin `localStorage`.
- **Interfaz:**
  - panel principal: identidad, orden de la navegación, una tarjeta por módulo con su enlace, información académica y la guía de uso plegable;
  - navegación: apertura de cada módulo, migas de pan, ausencia de controles simulados, página 404 y menú móvil;
  - diálogo de confirmación: no borra nada sin confirmar, Escape cancela y el foco queda atrapado.

## Publicación en GitHub Pages

El repositorio es [Sergiogomez17/Proyecto-mate-discreta](https://github.com/Sergiogomez17/Proyecto-mate-discreta) y la dirección pública:

**https://sergiogomez17.github.io/Proyecto-mate-discreta/**

No hace falta ningún servidor ni servicio de pago: GitHub compila el proyecto y publica los archivos estáticos.

### Configuración (una sola vez)

1. En GitHub, abra el repositorio → **Settings** → **Pages**.
2. En **Build and deployment → Source**, elija **GitHub Actions**.

### Publicar una versión

Haga push a `main`:

```bash
git push origin main
```

El workflow `.github/workflows/deploy.yml` se ejecuta solo (también se puede lanzar a mano en **Actions → Desplegar en GitHub Pages → Run workflow**):

1. instala las dependencias con `npm ci` (Node.js 24);
2. revisa el código con ESLint;
3. ejecuta las pruebas (`npm test`);
4. compila con `npm run build`, que también comprueba los tipos;
5. publica la carpeta `dist` con las acciones oficiales `configure-pages`, `upload-pages-artifact` y `deploy-pages`.

Si una prueba o la compilación fallan, no se publica nada y el sitio sigue mostrando la versión anterior. El avance se ve en la pestaña **Actions**; al terminar, el paso «Publicar» muestra la dirección.

### Cómo funcionan las rutas en GitHub Pages

- **Ruta base:** `vite.config.ts` define `base: '/Proyecto-mate-discreta/'`, de modo que el JavaScript, el CSS, las fuentes y el ícono se piden desde esa carpeta. React Router usa la misma base (`basename` en `src/app/App.tsx`), y todos los enlaces internos la incluyen.
- **Recargar páginas internas:** GitHub Pages solo sirve archivos, no reescribe rutas. Por eso la compilación copia `index.html` en una carpeta por cada ruta de la aplicación (`laboratorio/index.html`, `simulaciones/dijkstra/index.html`, …; la lista está en `src/app/staticPaths.ts` y una prueba comprueba que coincide con los módulos). Al recargar o abrir un enlace a un módulo, GitHub Pages responde 200 y la aplicación muestra esa página. Una dirección sin barra final se redirige a la misma con barra (`…/laboratorio` → `…/laboratorio/`), y funciona igual.
- **Direcciones inexistentes:** se publica también una copia como `404.html`, así que la aplicación arranca y muestra su propia página «Página no encontrada».
- **Seguridad:** GitHub Pages no permite encabezados HTTP propios. La política de seguridad de contenido viaja en una etiqueta `<meta>` de `index.html`.

### Probar localmente como en GitHub Pages

```bash
npm run build
node e2e/pages-server.mjs 4173
```

Abra `http://localhost:4173/Proyecto-mate-discreta/`. Las pruebas `npm run test:e2e` usan este mismo servidor.

**Comprobación después de publicar:**

1. Abra la dirección pública y recorra los siete módulos.
2. Recargue una ruta interna, por ejemplo `…/Proyecto-mate-discreta/laboratorio`.
3. Abra una dirección inexistente y confirme que aparece «Página no encontrada».
4. Revise que la consola del navegador no muestre errores.

El docente solo necesita la dirección pública: no tiene que instalar nada ni crear cuenta.

### Alternativa: Vercel

`vercel.json` se conserva para quien prefiera Vercel, que publica en la raíz de un dominio. En ese caso compile con la ruta base `/` definiendo la variable de entorno `BASE_PATH=/` en la configuración del proyecto en Vercel.

## Diseño

Paleta institucional definida en `src/styles/index.css`:

| Uso | Color |
|---|---|
| Encabezados | azul marino `#061438` y `#071A42` |
| Acentos | celeste `#00E5FF` y `#22D3EE` |
| Botones | morado `#6D28D9` (hover `#5B21B6`) |
| Fondo | `#EDF4FC` |
| Tarjetas | `rgba(190, 205, 230, 0.42)`, con desenfoque solo si el navegador lo admite |

La transparencia se aplica a los fondos, nunca al texto. El foco visible es celeste sobre fondos oscuros y morado sobre fondos claros.

> **Pendiente:** el documento de requisitos menciona una imagen de referencia del diseño que no se adjuntó en la conversación de desarrollo. La Fase 1 sigue la paleta y las indicaciones escritas; al recibir la imagen se ajustará la composición.
