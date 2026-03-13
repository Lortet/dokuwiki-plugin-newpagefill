# Newpagefill

[🇫🇷 Français](README.md) | [🇬🇧 English](README_EN.md) | 🇩🇪 Deutsch | [🇪🇸 Español](README_ES.md)

Das Plugin kann:
- einen kleinen Dialog zur Seitenerstellung mit Titel und Bezeichner öffnen;
- automatisch einen Bezeichner aus dem Titel vorschlagen;
- die neue Seite mit einer Plugin-Vorlage vorfüllen, wenn keine native Vorlage vorhanden ist;
- native DokuWiki-Vorlagen um `@TITLE@` erweitern.

## Verwendung

Das Plugin fügt einen vereinfachten Workflow zur Seitenerstellung hinzu:
- einen Titel eingeben;
- optional einen Namensraum eingeben, wenn keiner übergeben wurde;
- das Plugin schlägt einen Bezeichner vor;
- der Editor wird direkt auf der neuen Seite geöffnet.

Wenn eine native DokuWiki-Vorlage vorhanden ist (`_template.txt` oder `__template.txt`), wird diese verwendet.
Andernfalls wendet das Plugin seine eigene konfigurierte Ersatzvorlage an.

## Konfiguration

Im Konfigurationsmanager:
- `template`: Ersatzvorlage, die nur verwendet wird, wenn keine native DokuWiki-Seitenvorlage gefunden wird;
- `default_start_mode`: Standard-Erstellungsmodus (`ask`, `start`, `none`, `same`).

Diese Vorlage kann enthalten:
- `@TITLE@`: vom Plugin berechneter Titel (spezifisch für newpagefill);
- alle nativen DokuWiki-Platzhalter: `@ID@`, `@NS@`, `@PAGE@`, `@USER@`, `@DATE@` usw. (vom DokuWiki-Core verwaltet, nicht von diesem Plugin).

## Verhalten von `@TITLE@`

Das Plugin füllt `@TITLE@` wie folgt:
- zuerst wird der `title`-Wert verwendet, sofern vorhanden;
- andernfalls versucht es, den Titel aus der Erstellungs-URL zu extrahieren;
- wenn die erstellte Seite eine Startseite ist (z. B. `start`), wird der Name des übergeordneten Namensraums verwendet;
- `_`-Zeichen werden in Leerzeichen umgewandelt.

## DokuWiki-Vorlagenkompatibilität

Das Plugin respektiert das native Vorlagensystem:
- `_template.txt`
- `__template.txt`

Es ersetzt es nicht.
Es fügt lediglich Unterstützung für `@TITLE@` hinzu — native DokuWiki-Platzhalter (`@ID@`, `@NS@` usw.) werden danach vom Core verarbeitet.

## Verfügbare JavaScript-Funktion

Das Plugin stellt auch eine globale JavaScript-Funktion bereit:

```js
window.NewPageFill.openCreatePageDialog(options)
```

Beispiel:

```js
window.NewPageFill.openCreatePageDialog({
  namespace: 'wiki:dokumentation',
  initialTitle: 'Neue Seite'
});
```

Nützliche Optionen:
- `namespace`: DokuWiki-Namensraum, in dem die Seite erstellt wird. Wenn nicht angegeben, kann er im Dialog eingegeben werden;
- `initialTitle`: beim Öffnen vorausgefüllter Titel;
- `start`:
  - `undefined` oder `null`: den im Plugin konfigurierten Standardmodus verwenden;
  - `'@ask@'`: Moduswahl erzwingen, auch wenn ein Standardmodus existiert;
  - `true`: die Wiki-Startseite verwenden, z. B. `start`;
  - `false`: die Seite direkt erstellen;
  - `'@same@'`: eine Unterseite mit demselben Namen wie der Bezeichner erstellen;
  - jede andere Zeichenkette: eine Unterseite mit diesem Wert erstellen;
- `sepchar`: Trennzeichen zur Erzeugung des Bezeichners.

Wenn `start` nicht angegeben ist und `default_start_mode = ask`, zeigt der Dialog drei Optionen:
- direkte Seite;
- Startseite;
- Unterseite mit gleichem Namen.
