# Informe de deudas — reglas de la vista

Sobrescribe a `MASTER.md` solo en lo que aparece aquí. Hecha en octubre de 2026 a pedido del usuario: un complemento opcional y recomendado de la carpeta crediticia, sin cálculos.

## Qué es

El informe oficial de deudas de la Comisión para el Mercado Financiero (CMF), que la persona saca por fuera con su ClaveÚnica y carga aquí. Innovacred **no calcula nada con él ni lo interpreta**: lo muestra y lo imprime tal como se cargó. No cuenta como pendiente.

## Marco

- Grupo propio en el menú: **Complementos**, con la entrada "Informe de deudas". Debajo del nombre, en letra chica: "Opcional · Recomendado" mientras no hay archivo (la entrada va en gris, discreta) y "Cargado" con un visto, en verde, cuando lo hay.
- Dirección: `#deudas`. En móvil no ocupa la barra inferior: está en "Más".

## Vista

| Estado | Qué se ve |
| --- | --- |
| Sin archivo | Título, frase de qué es y el rótulo "Opcional · Recomendado". A la izquierda, "Cómo obtenerlo en la CMF": la dirección exacta del portal en un recuadro petróleo claro (lo único que destaca de la vista), "Copiar enlace" y "Abrir el portal de la CMF" (pestaña nueva); los pasos numerados (portal, ClaveÚnica, código al correo, descargar el PDF y "Vuelve aquí y carga el PDF" con "Ir a la carga"); requisitos, costo, qué contiene y actualización; una línea para personas jurídicas y la fuente (ficha de ChileAtiende). A la derecha, "Carga el informe": por qué se recomienda, la zona para arrastrar con el botón "Elegir el PDF", "Solo PDF, hasta 15 MB" y la nota de privacidad |
| Verificando | La zona se reemplaza por "Verificando el documento", el nombre y los tres pasos (Leyendo el PDF, Buscando el código QR, Validando con la CMF) unidos por una línea: visto verde al terminar, anillo que gira en el que avanza, círculo vacío en los que faltan. "Modo demo: la verificación es simulada" y "Cancelar". El foco va al título; el paso en curso se anuncia. El menú dice "Verificando…" y se puede navegar mientras tanto |
| Rechazado (`NO_QR`, `NOT_CMF`, `MISMATCH`) | Recuadro rojo claro: "El documento no se aceptó", el motivo en negrita, "No se guardó ni se agregó a la carpeta…", y "Cargar otro PDF" y "Abrir el portal de la CMF". El archivo se descarta |
| Error del servicio | Recuadro ámbar: "No se pudo verificar ahora", que no es un problema del documento, "Reintentar" (mismo archivo) y "Cargar otro PDF" |
| Error del archivo | Antes de verificar (no es PDF, vacío, más de 15 MB, no se puede leer o tiene clave): el mensaje va bajo la zona con ícono, fondo rojo claro y `role="alert"`; la zona toma borde rojo |
| Verificado | Tarjeta del archivo: el sello verde "Verificado con la CMF · código QR" con fecha y hora de verificación (y "Modo demo…"), nombre, páginas, tamaño y fecha de carga; "Reemplazar" y "Quitar"; "Se muestra tal como se cargó…"; la nota de privacidad. El menú dice "Verificado". La guía queda plegada. Recién ahí se muestran las páginas, en orden, como imágenes |

Si la persona reemplaza un informe verificado, el anterior se mantiene hasta que el nuevo quede verificado; ante un rechazo o un error del servicio puede "Mantener el informe verificado".

Bajo 1180 px las dos tarjetas van a ancho completo, la guía primero. Bajo 720 px los botones ocupan el ancho y los datos del trámite van en una columna.

## Reglas

- **Solo lo verificado entra a la carpeta.** El contrato del backend está en `docs/contrato-verificacion-informe-deudas.md`; en la demo la verificación es simulada y se dice.
- **Tal como se cargó.** Las páginas se dibujan como imágenes (pdf.js); no se extrae texto ni cifras.
- **Privacidad dicha en la vista.** En la demo el archivo se procesa solo en este navegador, no se envía a ningún servidor y se pierde al recargar. Con el backend, qué se envía (el PDF o solo el contenido del QR) está por confirmar y el texto debe cambiar.
- **Textos fijos en un solo lugar:** `DEBT_TEXT` en `src/lib/informeDeudas.ts`. Una prueba revisa que no nombren un método ni evalúen.
- **Sin citar botones del portal de la CMF.** No se conocen sus rótulos exactos: los pasos describen la acción.

## PDF

Al final de la carpeta, en hoja nueva: "Informe de deudas (CMF)", una línea con el nombre del archivo, la fecha de carga y su emisor, la línea "Verificado con el código QR del documento el dd-mm-aaaa a las hh:mm" (en la demo, "(verificación simulada)"), y cada página del informe en su propia hoja. Si no se cargó: "No se cargó el informe de deudas; es opcional." La guía y la carga no se imprimen.
