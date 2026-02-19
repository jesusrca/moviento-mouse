Original prompt: ponlo en sensibilidad maxima por defecto y que los contorles esten ocultos para hacer click y se abran

- Revisado `index.html`: sensibilidad inicial en 0.5 y slider en 5.
- Pendiente: dejar sensibilidad al maximo por defecto y ocultar panel de controles con toggle por click.

- Hecho: sensibilidad por defecto en maximo (`value="10"` y `let sensitivity = 1`).
- Hecho: controles ocultos por defecto; boton flotante (`#controlsToggle`) abre/cierra panel (`#controlsPanel`) con clase `.open`.
- Ajuste UX: panel movido a `top: 72px` para no encimarse con el boton.
- Validacion: revision estatica del HTML/CSS/JS en `index.html` (sin corrida de navegador automatizada en esta iteracion).

- Hecho: seguimiento de cabeza hacia el mouse mejorado en `updateEyes()` con:
- normalizacion respecto al centro de la cara,
- limite de rotacion con `maxDeg`,
- suavizado por interpolacion (`face._rx`, `face._ry`).
- Hecho: mejoras CSS para transformacion 3D en `.character` (`transform-style`, `transform-origin`, `will-change`).

- Cambio mayor: Seccion 1 reemplazada por una escena 3D real con `three.js` (`#head3dCanvas`).
- Hecho: agregado `initHead3D()` con escena, camara perspectiva, luces, materiales y malla de cabeza (skull, ojos, pupilas, nariz, boca, sombrero).
- Hecho: agregado `updateHead3D()` con yaw/pitch hacia el mouse, limites y suavizado por frame.
- Hecho: `animate()` ahora llama `updateHead3D()` en lugar de `updateEyes()`.
- Hecho: fallback visual si `THREE` no carga (`#head3dFallback`).
- Nota: no se corrio prueba automatizada Playwright en esta iteracion.

- Integracion de modelo real: agregado `GLTFLoader` y carga de `11065_horsehead_v3.glb`.
- Estrategia: se mantiene cabeza procedural como fallback inmediato y se reemplaza por el `.glb` cuando termina de cargar.
- Ajuste automatico del modelo: centrado por bounding box, escala normalizada, rotacion inicial y sombras activas en mallas.

- Mejora de diagnostico visual: agregado `#head3dStatus` sobre el canvas con mensajes de carga/error.
- Caso cubierto: si se abre con `file://`, se muestra mensaje explicito para usar servidor local.

- Correccion de carga de librerias: eliminados `<script src>` fijos de CDN y reemplazados por `bootstrapHead3D()` con fallback de multiples fuentes.
- Nuevo flujo: intenta `three.min.js` y `GLTFLoader.js` en `./vendor` y luego en `unpkg`, `jsdelivr` (y `cdnjs` para three).
- Mensaje de estado ahora indica cuando falta internet/CDN y sugiere colocar librerias locales en `/vendor`.

- Cambio de modelo principal: reemplazada la carga de `11065_horsehead_v3.glb` por `Meshy_AI_Crystal_Golem_Behemot_0219171347_texture.glb`.
- Refactor menor: funcion renombrada de `loadHorseHeadModel` a `loadMainModel`.

- Migracion a Next.js: creada estructura base con `app/layout.js`, `app/page.js`, `app/globals.css`, `package.json` y `next.config.mjs`.
- Escena 3D en Next: ahora usa `three` y `GLTFLoader` desde dependencias npm (sin CDN).
- Modelo principal para Next: copiado a `public/model.glb` y cargado con ruta `/model.glb`.
- Controles: sensibilidad maxima por defecto y panel oculto con toggle.
- Ajuste solicitado: modelo volteado al frente en Next (`model.rotation.y = 0`).
- Repuesto modo de seguimiento elastico en controles de Next, junto con directo/suave.
- Logica de modos en loop: `direct` (instantaneo), `smooth` (lerp), `elastic` (resorte + damping).
- Nuevo bloque agregado debajo del 3D: seccion `Física Elástica` en Next.
- Implementado personaje rojo con comportamiento de resorte (spring + friction), deformacion por velocidad y ojos que siguen al mouse.
- Estilos alineados a la referencia: fondo azul completo, titulo superior centrado y esfera roja con ojos.

- Preparado flujo de compresion de GLB: agregado `scripts/compress-model.sh`.
- La app ahora intenta cargar primero `/model-compressed.glb` y hace fallback automatico a `/model.glb`.
