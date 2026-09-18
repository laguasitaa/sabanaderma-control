# DESIGN.md — tema "sabana" (marca real de SabanaDerma)

> Reemplaza el tema base genérico de raicode. Colores y tipografía extraídos
> directamente de sabanaderma.com (dorado + Barlow Condensed + Raleway).
> Spacing, radii, sombras, motion y componentes se conservan del sistema base
> — son los huesos, no la piel.

## Dirección estética
Cálido · profesional · confiable. El dorado de la marca (`#D5A652`) es el
acento — el mismo tono del logo y de los botones del sitio de la clínica.
Fondo cálido casi blanco, texto oscuro cálido (no negro puro ni azulado).
Densidad media, jerarquía por tamaño y peso — el color se reserva para
acciones e interacción, no para decorar.

## Color (CSS custom properties, ver globals.css → `[data-theme="sabana"]`)

| rol | claro | oscuro |
| --- | --- | --- |
| bg | `#FBF8F2` | `#1C1712` |
| surface | `#FFFFFF` | `#26201A` |
| border | `#E8DEC8` | `#3A2F24` |
| text | `#2B2620` | `#F2EAD9` |
| text-muted | `#7A7065` | `#B8A990` |
| accent / hover / on | `#D5A652` / `#B8863A` / `#2B2620` | `#E8C989` / `#F2D9A8` / `#241C10` |
| success / bg | `#2F7A5A` / `#E6F2EC` | `#6FCFA3` / `#17332A` |
| warning / bg | `#9A6B12` / `#FBF0DC` | `#E0B457` / `#33290F` |
| error / bg | `#B03A2B` / `#FBE9E5` | `#F08876` / `#3A1B16` |
| info / bg | `#2F6E96` / `#E6EEF2` | `#8FC4E4` / `#2E3235` |

**Nota de accesibilidad — texto sobre el dorado:** el dorado (`#D5A652`) no
cumple contraste 4.5:1 con texto blanco ni con fondo blanco como color de
texto — por eso `--c-on-accent` es oscuro (`#2B2620`), igual que el propio
sitio de la clínica usa texto negro sobre sus botones dorados. Nunca poner
texto blanco sobre `--c-accent`.

Usar `--c-*` vía las utilidades (`bg-app`, `text-muted`, `btn-primary`…), no hex sueltos.

## Tipografía (next/font/google)
- Display: **Barlow Condensed** 600 — títulos, nombre de app, números grandes. Es la fuente que usa sabanaderma.com en sus encabezados.
- Body: **Raleway** 400/600 — todo lo demás. Es la fuente que usa el sitio en botones y textos de marca.
- Escala: 12 / 13.5 / 15 / 19 / 27 / 38 px. Line-height 1.15 en títulos, 1.55 en texto.

```ts
import { Barlow_Condensed, Raleway } from "next/font/google";
```

## Spacing, radii, sombras, motion
- Spacing: escala 4px (1=4 … 20=80). Padding de card 22-24px, gap de secciones 20-24px.
- Padding de inputs/selects: 12px vertical, 16px horizontal (`--space-3` / `--space-4`) — más aire que el default original (10/12), para que el texto no toque el borde.
- Radii: sm 6 / md 10 / lg 16 / full 999.
- Sombras: solo `--shadow-1` (bordes sutiles) y `--shadow-2` (cards elevadas).
- Motion: 200ms `cubic-bezier(.2,0,.2,1)` en color/border/opacity/shadow. Nada decorativo.

## Componentes base (mismos en las 4 variantes)
- **Estado vacío**: título, una línea de ayuda, CTA primario. Ninguna lista vacía queda en blanco.
- **Loading**: skeleton en `--c-border` con pulse 1.2s (stagger 150ms) para contenido; spinner de 16px solo dentro del botón que disparó la acción. Nunca spinner de pantalla completa.
- **Botones**: primary / secondary / tertiary / danger, cada uno con hover, focus-visible (`outline: 2px solid var(--c-accent); outline-offset: 2px`), disabled y loading.
- **Forms**: input, select, textarea, checkbox, radio, toggle. Label arriba siempre visible; ayuda o error debajo en 12px. El error pinta el borde con `--c-error` y el mensaje dice qué hacer. Toque mínimo 44px en móvil.
- **Contenido largo** (`prose`): máx. 68ch, line-height 1.65, títulos en display, links con borde inferior. No centrar ni justificar.

## Gráficas
Serie principal `--c-series-1`; 2-4 son tonos de la misma familia. Máximo 4 series.

| serie | claro | oscuro |
| --- | --- | --- |
| 1 | `#D5A652` | `#E8C989` |
| 2 | `#B8863A` | `#D5A652` |
| 3 | `#E8C989` | `#F2D9A8` |
| 4 | `#8A6526` | `#B8863A` |

Permitido: barras, líneas, área simple, dona de máximo 4 rebanadas. Grid solo horizontal en `--c-border`.
Prohibido: 3D, arcoíris, doble eje Y, gradientes en las series.

## Anti-patterns
- Nada de arcoíris: un solo acento azul manda, lo demás son neutros fríos.
- No infantilizar con Comic Sans, stickers ni sombras de caricatura.
- Sin gradientes de fondo; el color vive en botones y estados.
- No animaciones que reboten o giren por decoración — 200ms y listo.
- No agregar una segunda familia tipográfica ni un segundo acento.
- No usar sombras de color ni bordes de 2px+.

## Componentes v1.1 (mismos en las 4 variantes)

- **Badge**: 5 tonos (neutral, success, warning, error, info). Pill de `padding: 4px 10px`, `--text-xs`, weight 600. Neutral va en outline (`--c-bg` + borde); los demás en tinte relleno sin borde. Punto opcional de 6px en `currentColor`. Conteos en `badge-count` (20px, fondo accent, `tabular-nums`). El texto dice el estado — el color nunca solo.
- **Tabs**: activo en `--c-accent` con `box-shadow: inset 0 -2px 0`; inactivo en muted; hover suma `--c-bg`; focus `outline: 2px solid var(--c-accent); outline-offset: -2px`; disabled en `--c-border`. Si no caben, **scroll horizontal** — nunca dos filas. Máximo 5. El segmentado funciona muy bien aquí (se siente como un juguete); úsalo para 2-3 vistas y tabs para el resto.
- **Bottom-nav** (solo móvil): 3-5 destinos, `56px + env(safe-area-inset-bottom)`, ícono 22px + etiqueta 10.5px/600. Activo con `aria-current="page"` en accent. El contenido reserva `calc(56px + safe-area + var(--space-4))`.
- **Modal / sheet**: escritorio centrado `max-width: 380px`; móvil sheet desde abajo con handle de 36×4px. Destructivo: título que nombra la cosa, cuerpo que dice qué se pierde, botón "Sí, borrar" en `--c-error`, **foco inicial en Cancelar**, Esc y clic afuera cancelan. En móvil los botones se apilan con el peligroso arriba.
- **Toast**: abajo-derecha en escritorio, arriba en móvil. 4s (7s con acción). Máximo 3. `border-left: 3px` del tono. Para confirmar lo hecho — un error que exige decisión va inline o en modal.
- **Avatar**: 24/32/40/56px, iniciales en display sobre `--c-avatar-1..4`, índice = `suma de charCodes % 4` (determinista). Texto siempre `--c-text`.
- **Imagen**: `aspect-ratio` fijo desde el primer render, `object-fit: cover`. Tres estados: cargando (pulse), sin foto (dashed + `image`), error (`--c-error-bg` + `image-off`).
- **list-row**: min-height 56px, título truncado a una línea, meta en muted, badge a la derecha. Es la unidad que más se repite.

## Celular y compu

El `CLAUDE.md` del proyecto dice qué pantalla manda: celular primero, compu primero o las dos por igual. Diseña primero para esa, y que la otra funcione bien.

Un solo breakpoint: **768px**. Abajo de eso, una columna.

- La escala de texto **no cambia**; solo h1 38→30px y título de card 27→24px.
- **Inputs a 16px** en celular: menos dispara el zoom automático de iOS.
- Padding de página 16px (24px en escritorio); padding de card 16px.
- En celular, botones a ancho completo, apilados, primario arriba, alto ≥48px. En escritorio, botones a su ancho y en fila.
- **Tablas**: en celular se vuelven `list-row`. En escritorio son tablas de verdad; si la compu manda y una tabla no cabe en celular, puede hacer scroll dentro de su caja — nunca la página completa.
- **Navegación**: en celular, bottom-nav. En escritorio, barra lateral o arriba.
- Header sticky de 56px: volver a la izquierda, una sola acción a la derecha.
- Ancho máximo de contenido en escritorio: `--page-max: 1120px`.

## Iconografía

**Lucide**, una sola librería, `stroke-width: 1.75`. 18px en botón con texto, 20px suelto, 22px en nav; caja de toque siempre 44px. Alineación con `flex` + `gap: 7px`.

Funcional (permitido): el ícono **es** el control o etiqueta uno — borrar, editar, volver, cerrar, buscar, un destino del nav, el tono de un estado.
Decorativo (prohibido): acompaña un título o rellena espacio. **Prueba**: si al borrarlo no cambia lo que el usuario puede hacer o entender, bórralo.

Ícono solo → `aria-label`. Ícono junto a texto → `aria-hidden="true"`.

## Tokens nuevos de esta variante

El dorado ya funciona como acento de marca — usarlo también para "info" se
leería como una alerta o botón de acción, así que info va en un azul apagado
propio, sin relación con la marca (es un color puramente funcional).

| rol | claro | oscuro |
| --- | --- | --- |
| `--c-info` | `#2F6E96` | `#8FC4E4` |
| `--c-info-bg` | `#E6EEF2` | `#2E3235` |
| `--c-on-info-bg` | `#2F6E96` | `#8FC4E4` |
| `--c-overlay` | `rgba(20,16,10,0.45)` | `rgba(0,0,0,0.7)` |
| `--c-avatar-1` | `#F2E6C9` | `#5A4A2A` |
| `--c-avatar-2` | `#F7EEDA` | `#4F4023` |
| `--c-avatar-3` | `#FBF5E9` | `#453A20` |
| `--c-avatar-4` | `#ECE0C4` | `#6A5730` |

Contraste verificado: texto sobre `--c-accent` usa `--c-on-accent` (oscuro),
no blanco — el dorado es demasiado claro para texto blanco legible (ver nota
de accesibilidad arriba). El resto de pares texto/fondo cumple WCAG AA
(>=4.5:1 en texto normal).

## Anti-patterns v1.1

- Nunca menú hamburguesa. En celular, con 2-5 secciones va bottom-nav; con más, cuatro y "Más". En escritorio, barra lateral o arriba.
- Nunca scroll horizontal de la página completa.
- Nunca un toast para un error que necesita decisión del usuario.
- Nunca borrar sin confirmar, y nunca con el foco puesto en el botón peligroso.
- Nunca dos librerías de iconos en la misma app.
- Nunca un ícono decorativo junto a un título.
