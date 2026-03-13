# Newpagefill

[🇫🇷 Français](README.md) | 🇬🇧 English | [🇩🇪 Deutsch](README_DE.md) | [🇪🇸 Español](README_ES.md)

The plugin can:
- open a small page creation dialog with a title and page ID;
- automatically suggest a page ID from the title;
- prefill the new page with a plugin template if no native template exists;
- extend native DokuWiki templates with `@TITLE@`.

## Usage

The plugin adds a simpler page creation flow:
- enter a title;
- optionally enter a namespace if none was provided by the caller;
- the plugin suggests a page ID;
- it then opens the editor for the new page directly.

If a native DokuWiki template exists (`_template.txt` or `__template.txt`), it is used.
Otherwise, the plugin applies its own configured fallback template.

## Configuration

In the configuration manager:
- `template`: fallback template used only when no native DokuWiki page template is found;
- `default_start_mode`: default page creation mode (`ask`, `start`, `none`, `same`).

This template may contain:
- `@TITLE@`: title computed by the plugin (specific to newpagefill);
- all native DokuWiki placeholders: `@ID@`, `@NS@`, `@PAGE@`, `@USER@`, `@DATE@`, etc. (handled by DokuWiki core, not by this plugin).

## `@TITLE@` behavior

The plugin fills `@TITLE@` as follows:
- it first uses the `title` value if it exists;
- otherwise, it tries to extract it from the creation URL;
- if the created page is a start page such as `start`, it uses the parent namespace name;
- `_` characters are converted to spaces.

## DokuWiki template compatibility

The plugin respects the native template system:
- `_template.txt`
- `__template.txt`

It does not replace it.
It only adds support for `@TITLE@` — native DokuWiki placeholders (`@ID@`, `@NS@`, etc.) are handled by the core afterward.

## Available JavaScript function

The plugin also exposes a global JavaScript function:

```js
window.NewPageFill.openCreatePageDialog(options)
```

Example:

```js
window.NewPageFill.openCreatePageDialog({
  namespace: 'wiki:documentation',
  initialTitle: 'New page'
});
```

Useful options:
- `namespace`: DokuWiki namespace where the page will be created. If not provided, the dialog lets the user enter it;
- `initialTitle`: title prefilled when opening the dialog;
- `start`:
  - `undefined` or `null`: use the default mode configured in the plugin;
  - `'@ask@'`: ask for the creation type even if a default mode exists;
  - `true`: use the wiki start page, for example `start`;
  - `false`: create the page directly;
  - `'@same@'`: create a subpage with the same name as the page ID;
  - any other string: create a subpage with that value;
- `sepchar`: separator used to generate the page ID.

If `start` is not provided and `default_start_mode = ask`, the dialog shows three choices:
- direct page;
- start page;
- subpage with the same name.
