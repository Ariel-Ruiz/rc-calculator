/**
 * Calcula los puntos basados en la potencia y el bonus.
 * @param {string} poder - La potencia en formato string (e.g., "5.123 Ph/s", "500.123 Th/s").
 * @param {string} bonus - El bonus en formato string (e.g., "10%", "0.5%").
 * @returns {number} - Los puntos calculados.
 */
export function calcularPuntos(poder: string, bonus: string) {

  // Función de ayuda para limpiar y parsear valores numéricos
  const parseNumericValue = (str) => {
    const cleanedStr = str.replace(/[^\d.,]/g, '');
    return parseFloat(cleanedStr.replace(',', '.'));
  };

  // 1. PROCESAMIENTO DE DATOS

  let valorPoder = parseNumericValue(poder);
  let valorBonus = parseNumericValue(bonus);
  let poderEnPhs = 0;

  if (poder.includes('Eh/s')) {
    poderEnPhs = valorPoder * 1000;
  } else if (poder.includes('Ph/s')) {
    poderEnPhs = valorPoder;
  } else if (poder.includes('Th/s')) {
    poderEnPhs = valorPoder / 1000;
  }

  // 2. Calculo de puntos 
  let pointsXPh = 1
  let pointsXBonus = 1
  if (poderEnPhs > 10) {
    pointsXPh = 12800
    pointsXBonus = 40
  } else if (poderEnPhs >= 5) {
    pointsXPh = 16000
    pointsXBonus = 50
  } else if (poderEnPhs >= 1) {
    pointsXPh = 20000
    pointsXBonus = 62.5
  } else {
    // Todos los valores menores a 1Ph/s
    pointsXPh = 24800
    pointsXBonus = 77.5
  }

  let puntos = poderEnPhs * pointsXPh + (pointsXBonus * valorBonus)
  return Math.ceil(puntos)
}

export interface BurnItem {
  points: number;
  level: number;
  name: string;
  power: string;
  bonus: string;
}

/**
 * Transforma el texto de el ui del burning de RC a un array de objetos JSON.
 * @param {string} text - El texto a procesar.
 * @returns {Array<BurnItem>}
 */
export function textToJson(text: string): Array<BurnItem> {
  // 1. Dividir el texto en líneas y eliminar líneas vacías
  const lines = text.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const result = [];
  let currentItem: BurnItem;
  let state = 0; // 0: Buscando 'Currency icon', 1: Puntos, 2: Nivel/Nombre, 3: Poder, 4: Bonus

  const currencyIcon = "Currency icon";
  const specialEventImagePrefix = "Special event items image";
  const specialEventImageBase = "Special event items image"; // El caso sin número (Nivel 1)

  for (const line of lines) {
    switch (state) {
      case 0: // Buscando 'Currency icon' (Inicio de un nuevo elemento)
        if (line === currencyIcon) {
          currentItem = {} as BurnItem;
          state = 1;
        }
        break;

      case 1: // Puntos
        // El número que sigue es los puntos
        currentItem.points = parseInt(line.replace(/,/g, ''), 10); // Eliminar comas y convertir a entero
        state = 2;
        break;

      case 2: // Nivel y Nombre
        // Primero verificamos el nivel
        if (line.startsWith(specialEventImagePrefix)) {
          // Extraer el número después de 'image' (ej: 'image5' -> 5)
          const levelMatch = line.match(/image(\d+)/);

          if (levelMatch) {
            // Si encuentra un número (image1, image2, etc.), el nivel es el número + 1
            // Ej: image1 (match[1] = 1) -> Nivel 2
            // Ej: image5 (match[1] = 5) -> Nivel 6
            currentItem.level = parseInt(levelMatch[1], 10) + 1;
          } else if (line === specialEventImageBase) {
            // Caso especial: 'Special event items image' sin número
            currentItem.level = 1;
          } else {
            // Un caso que no debería ocurrir con el formato dado (mineros de colección)
            currentItem.level = 1;
          }
        }
        // El nombre es la siguiente línea, por eso no cambiamos el estado
        state = 2.5; // Estado intermedio para el nombre
        break;

      case 2.5: // Nombre
        currentItem.name = line;
        state = 3;
        break;

      case 3: // Poder (La línea después del nombre)
        currentItem.power = line;
        state = 4;
        break;

      case 4: // Bonus (La línea después del poder)
        currentItem.bonus = line;
        result.push(currentItem);

        // Volver al estado 0 para buscar el siguiente 'Currency icon'
        state = 0;
        break;
    }
  }

  return result;
}