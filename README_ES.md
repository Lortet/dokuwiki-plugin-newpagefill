# Newpagefill

[🇫🇷 Français](README.md) | [🇬🇧 English](README_EN.md) | [🇩🇪 Deutsch](README_DE.md) | 🇪🇸 Español

El plugin puede:
- abrir un pequeño diálogo de creación de página con título e identificador;
- sugerir automáticamente un identificador a partir del título;
- rellenar la nueva página con una plantilla del plugin si no existe ninguna plantilla nativa;
- extender las plantillas nativas de DokuWiki con `@TITLE@`.

## Uso

El plugin añade un flujo de creación de página más sencillo:
- introducir un título;
- introducir opcionalmente un espacio de nombres si no se proporcionó ninguno;
- el plugin sugiere un identificador;
- se abre directamente el editor en la nueva página.

Si existe una plantilla nativa de DokuWiki (`_template.txt` o `__template.txt`), se utiliza.
De lo contrario, el plugin aplica su propia plantilla de reserva configurada.

## Configuración

En el gestor de configuración:
- `template`: plantilla de reserva utilizada solo cuando no se encuentra ninguna plantilla de página nativa de DokuWiki;
- `default_start_mode`: modo de creación de página predeterminado (`ask`, `start`, `none`, `same`).
- `show_subpage_button_in_page_menu`: anade un boton `Crear una subpagina` al menu de pagina.

Cuando `show_subpage_button_in_page_menu` esta activado, el plugin tambien expone la accion DokuWiki `newpagefill_subpage`.
Por lo tanto, este boton puede ocultarse mediante `disableactions`, por ejemplo:

```text
newpagefill_subpage
```

Esta plantilla puede contener:
- `@TITLE@`: título calculado por el plugin (específico de newpagefill);
- todos los marcadores nativos de DokuWiki: `@ID@`, `@NS@`, `@PAGE@`, `@USER@`, `@DATE@`, etc. (gestionados por el núcleo de DokuWiki, no por este plugin).

## Comportamiento de `@TITLE@`

El plugin rellena `@TITLE@` de la siguiente manera:
- primero utiliza el valor `title` si existe;
- de lo contrario, intenta extraerlo de la URL de creación;
- si la página creada es una página de inicio como `start`, utiliza el nombre del espacio de nombres padre;
- los caracteres `_` se convierten en espacios.

## Compatibilidad con plantillas DokuWiki

El plugin respeta el sistema de plantillas nativo:
- `_template.txt`
- `__template.txt`

No lo reemplaza.
Solo añade soporte para `@TITLE@` — los marcadores nativos de DokuWiki (`@ID@`, `@NS@`, etc.) son gestionados por el núcleo después.

## Función JavaScript disponible

El plugin también expone una función JavaScript global:

```js
window.NewPageFill.openCreatePageDialog(options)
```

Ejemplo:

```js
window.NewPageFill.openCreatePageDialog({
  namespace: 'wiki:documentacion',
  initialTitle: 'Nueva página'
});
```

Opciones útiles:
- `namespace`: espacio de nombres de DokuWiki donde se creará la página. Si no se proporciona, el diálogo permite introducirlo;
- `initialTitle`: título prerrellenado al abrir el diálogo;
- `start`:
  - `undefined` o `null`: usar el modo predeterminado configurado en el plugin;
  - `'@ask@'`: forzar la elección del modo aunque exista un modo predeterminado;
  - `true`: usar la página de inicio del wiki, por ejemplo `start`;
  - `false`: crear la página directamente;
  - `'@same@'`: crear una subpágina con el mismo nombre que el identificador;
  - cualquier otra cadena: crear una subpágina con ese valor;
- `sepchar`: separador utilizado para generar el identificador.

Si `start` no se proporciona y `default_start_mode = ask`, el diálogo muestra tres opciones:
- página directa;
- página de inicio;
- subpágina con el mismo nombre.
