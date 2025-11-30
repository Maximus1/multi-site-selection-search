# Multi-Site Selection Search

**Multi-Site Selection Search** ist eine Chrome-Erweiterung, die es Ihnen ermöglicht, markierten Text schnell und gleichzeitig auf mehreren Webseiten zu suchen. Konfigurieren Sie Ihre eigenen Suchkategorien und optimieren Sie Ihren Recherche-Workflow.

## Features

- **Kategorisierte Suche**: Gruppieren Sie Ihre bevorzugten Suchmaschinen in Kategorien (z.B. "Shopping", "Entwicklung", "Nachrichten").
- **Kontextmenü-Integration**: Markieren Sie einfach Text auf einer beliebigen Seite, klicken Sie mit der rechten Maustaste und wählen Sie eine Ihrer Suchkategorien aus, um die Suche zu starten.
- **Vollständig anpassbar**: Fügen Sie Ihre eigenen Webseiten und Such-URLs hinzu. Der Platzhalter `%s` wird automatisch durch Ihren Suchbegriff ersetzt.
- **Import & Export**: Sichern Sie Ihre gesamte Konfiguration in einer JSON-Datei und stellen Sie sie bei Bedarf wieder her. Perfekt für Backups oder die Synchronisierung zwischen mehreren Geräten.
- **Einfache Bedienung**: Eine übersichtliche Optionsseite zur Verwaltung Ihrer Kategorien und Webseiten.

## Installation

1.  Laden Sie die Erweiterung aus dem Chrome Web Store (Link einfügen).
2.  Oder laden Sie dieses Repository herunter und installieren Sie es manuell über `chrome://extensions` im Entwicklermodus.

## Anwendung

### Eine Suche durchführen

1.  Markieren Sie einen beliebigen Text auf einer Webseite.
2.  Klicken Sie mit der rechten Maustaste auf die Markierung.
3.  Wählen Sie im Kontextmenü eine Ihrer konfigurierten Suchkategorien aus.
4.  Für jede Webseite in der ausgewählten Kategorie wird ein neuer Tab mit den Suchergebnissen geöffnet.

### Kategorien und Seiten konfigurieren

1.  Klicken Sie mit der rechten Maustaste auf das Erweiterungssymbol in Ihrer Browser-Symbolleiste und wählen Sie "Optionen".
2.  Auf der Einstellungsseite können Sie:
    - **Neue Kategorien hinzufügen**: Jede Kategorie kann eine eigene Sammlung von Webseiten enthalten.
    - **Seiten hinzufügen/entfernen**: Fügen Sie einer Kategorie neue Webseiten hinzu oder entfernen Sie bestehende.
    - **URLs anpassen**: Geben Sie für jede Webseite eine URL an und verwenden Sie `_**%s**_` als Platzhalter für den Suchbegriff.

**Beispiel für eine URL:**

```
https://www.google.com/search?q=%s
```

### Import & Export

Die Import- und Export-Funktion ermöglicht es Ihnen, Ihre gesamte Konfiguration zu sichern und wiederherzustellen.

- **Exportieren**: Klicken Sie auf der Optionsseite auf "Exportieren". Eine JSON-Datei mit all Ihren Kategorien und Seiten wird heruntergeladen.
- **Importieren**: Klicken Sie auf "Importieren" und wählen Sie eine zuvor exportierte JSON-Datei aus. Ihre Konfiguration wird wiederhergestellt und die Seite automatisch neu geladen.

## Entwicklung

Dieses Projekt wurde mit reinem JavaScript, HTML und CSS erstellt. Es werden keine externen Frameworks für die Kernfunktionalität benötigt.

### Code-Struktur

- `service-worker.js`: Enthält die Hintergrundlogik, wie die Erstellung des Kontextmenüs und das Öffnen der Such-Tabs.
- `options.html` / `options.js` / `options.css`: Bilden die Optionsseite, auf der Benutzer die Erweiterung konfigurieren können.
- `manifest.json`: Die Manifest-Datei der Chrome-Erweiterung.

## Unterstütze meinen Kater Micky

Wenn Ihnen diese App gefällt und Sie die Entwicklung (und meinen Kater) unterstützen möchten, würde ich mich über eine kleine Spende freuen!

<p>
  <a href="https://www.paypal.me/mbneedsmoney/5">
      <img src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" alt="paypal">
  </a>
</p>
Wenn Sie auf das Paypal Logo klicken, gelangen Sie zur Spendenseite, auf der Sie einen für Sie passenden Betrag Spenden können:
- Frühstück für Micky (1,00 €)
- Frühstück + Mittag für Micky (3,00 €)
- Ein Tag mal keine Mäuse essen (5,00 €)
- Die Woche ist gerettet (10,00 €)

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz.
