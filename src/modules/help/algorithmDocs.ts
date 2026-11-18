export interface AlgorithmDoc {
  name: string;
  /** Dónde se usa en la plataforma. */
  where: string;
  idea: string;
  complexity: string;
  notes?: string;
}

/** Documentación breve de cada algoritmo implementado (V = vértices, E = aristas, n = nodos). */
export const ALGORITHM_DOCS: readonly AlgorithmDoc[] = [
  {
    name: 'Grados y lema del apretón de manos',
    where: 'Teoría de grafos · Laboratorio',
    idea: 'Cada arista suma 1 al grado de cada extremo (en dirigidos, a la salida del origen y a la entrada del destino). La suma de los grados es 2|E|.',
    complexity: 'O(V + E)',
    notes: 'Las aristas paralelas cuentan por separado.',
  },
  {
    name: 'Componentes conexas y fuertemente conexas',
    where: 'Teoría de grafos',
    idea: 'Búsqueda en anchura desde cada vértice no visitado (ignorando la dirección). En dirigidos, además, Kosaraju: un DFS para el orden de finalización y otro sobre el grafo transpuesto.',
    complexity: 'O(V + E)',
  },
  {
    name: 'Recorridos de árboles binarios',
    where: 'Árboles binarios · Laboratorio',
    idea: 'Preorden (raíz, izquierdo, derecho), inorden (izquierdo, raíz, derecho) y postorden (izquierdo, derecho, raíz) son recursivos; por niveles usa una cola. Cada paso animado es una llamada, un registro o un regreso real.',
    complexity: 'O(n)',
    notes: 'La altura se mide en aristas: un solo nodo tiene altura 0 y el árbol vacío, −1.',
  },
  {
    name: 'BFS y DFS',
    where: 'BFS y DFS · Laboratorio',
    idea: 'BFS visita por niveles con una cola; DFS avanza en profundidad con recursión (pila de llamadas). Los vecinos se exploran en orden alfabético y numérico, sin duplicados.',
    complexity: 'O(V + E)',
    notes: 'En el laboratorio se acepta cualquier orden de vecinos: se valida simulando la cola o la pila.',
  },
  {
    name: 'Clasificación euleriana',
    where: 'Euler y Hamilton · Laboratorio',
    idea: 'Con las aristas en una sola componente: 0 vértices de grado impar → circuito; 2 → camino abierto entre ellos; más → no existe. En dirigidos se exige equilibrio entre entrada y salida (salvo inicio y fin).',
    complexity: 'O(V + E)',
    notes: 'Los vértices aislados no influyen.',
  },
  {
    name: 'Algoritmo de Fleury',
    where: 'Euler y Hamilton',
    idea: 'Desde un vértice inicial válido, se recorre una arista por vez y no se cruza un puente del grafo restante si hay otra opción. Los puentes se calculan con el algoritmo de Tarjan.',
    complexity: 'O(E · (V + E))',
    notes: 'Con aristas paralelas, ninguna de ellas es puente. En dirigidos se comprueba que, tras tomar la arista, aún se pueda completar el recorrido.',
  },
  {
    name: 'Caminos y ciclos hamiltonianos',
    where: 'Euler y Hamilton · Laboratorio',
    idea: 'Backtracking: se extiende la ruta con vecinos no visitados y se retrocede al bloquearse. Antes se buscan pruebas estructurales de inexistencia (desconexión, vértices con un solo vecino…).',
    complexity: 'Exponencial en el peor caso; límite configurable de extensiones.',
    notes: 'Tres resultados distintos: existe solución, se demostró que no existe o búsqueda incompleta por el límite.',
  },
  {
    name: 'Isomorfismo de grafos',
    where: 'Isomorfismo · Laboratorio',
    idea: 'Primero se comparan invariantes (vértices, aristas, secuencias de grados, componentes, triángulos). Luego, backtracking con poda: solo vértices de igual grado y cada asignación conserva la multiplicidad de aristas con los ya asignados.',
    complexity: 'Exponencial en el peor caso; límite de 200 000 asignaciones.',
    notes: 'Igualdad de invariantes no prueba el isomorfismo: hace falta una correspondencia verificada.',
  },
  {
    name: 'Dijkstra',
    where: 'Dijkstra · Laboratorio',
    idea: 'Se fija cada vez el vértice no definitivo de menor distancia y se relajan sus aristas: d(v) = min(d(v), d(u) + w(u,v)). Los empates en la relajación guardan predecesores adicionales para mostrar todos los caminos mínimos.',
    complexity: 'O(V² + E) (selección lineal del mínimo)',
    notes: 'No se ejecuta con pesos negativos. Empates en la selección: orden alfabético. Sin ponderación, cada arista pesa 1.',
  },
];
