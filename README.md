# Newpagefill

🇫🇷 Français | [🇬🇧 English](README_EN.md) | [🇩🇪 Deutsch](README_DE.md) | [🇪🇸 Español](README_ES.md)

Le plugin peut :
- ouvrir une petite popup de création avec un titre et un identifiant ;
- proposer automatiquement un identifiant à partir du titre ;
- préremplir la page avec un template du plugin si aucun template natif n'existe ;
- enrichir les templates natifs DokuWiki avec `@TITLE@`.

## Utilisation

Le plugin ajoute une interface de création de page plus simple :
- vous saisissez un titre ;
- vous pouvez aussi saisir un namespace si aucun namespace n'est fourni au script ;
- le plugin propose un identifiant ;
- il ouvre ensuite directement l'éditeur de la nouvelle page.

Si un template natif DokuWiki existe (`_template.txt` ou `__template.txt`), il est utilisé.
Sinon, le plugin applique son propre template configuré.

## Configuration

Dans le gestionnaire de configuration :
- `template` : template de secours utilisé seulement si aucun template natif DokuWiki n'est trouvé
- `default_start_mode` : mode par défaut de création de la page (`ask`, `start`, `none`, `same`)

Ce template peut contenir :
- `@TITLE@` : titre calculé par le plugin (spécifique à newpagefill)
- tous les placeholders natifs DokuWiki : `@ID@`, `@NS@`, `@PAGE@`, `@USER@`, `@DATE@`, etc. (gérés par le core, pas par ce plugin)

## Comportement de `@TITLE@`

Le plugin remplit `@TITLE@` ainsi :
- il prend d'abord la valeur `title` si elle existe ;
- sinon, il essaie de la déduire depuis l'URL de création ;
- si la page créée est une page de démarrage comme `accueil`, il utilise le nom du namespace parent ;
- les `_` sont transformés en espaces.

## Compatibilité avec DokuWiki

Le plugin respecte le système natif de templates :
- `_template.txt`
- `__template.txt`

Il ne le remplace pas.
Il ajoute seulement le support de `@TITLE@` — les placeholders natifs DokuWiki (`@ID@`, `@NS@`, etc.) sont gérés par le core après coup.

## Fonction JavaScript disponible

Le plugin expose aussi une fonction JavaScript globale :

```js
window.NewPageFill.openCreatePageDialog(options)
```

Exemple :

```js
window.NewPageFill.openCreatePageDialog({
  namespace: 'wiki:documentation',
  initialTitle: 'Nouvelle page'
});
```

Options utiles :
- `namespace` : namespace DokuWiki dans lequel créer la page. S'il n'est pas fourni, la popup permet de le saisir
- `initialTitle` : titre proposé à l'ouverture
- `start` :
  - `undefined` ou `null` : utilise le mode par défaut configuré dans le plugin
  - `'@ask@'` : demande le type de création même si un mode par défaut existe
  - `true` : utilise la page de démarrage du wiki, par exemple `accueil`
  - `false` : crée la page directement
  - `'@same@'` : crée une sous-page portant le même nom que l'identifiant
  - toute autre chaîne : crée une sous-page avec cette valeur
- `sepchar` : séparateur utilisé pour générer l'identifiant

Si `start` n'est pas fourni et que `default_start_mode = ask`, la popup affiche les trois choix :
- page directe
- page de démarrage
- sous-page du même nom
