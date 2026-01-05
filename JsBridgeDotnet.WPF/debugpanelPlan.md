## 📋 Description de la fonctionnalité

Créer un UserControl WPF qui encapsule une WebView2 et le ServiceBridge, offrant un panel de debug intégré (affichable via un bouton en overlay en mode debug) qui permet de visualiser en temps réel :

- **Tab Services** : Les services enregistrés avec leurs métadonnées (méthodes, propriétés, événements)
- **Tab Services Instances** : Les instances de services utilisées en cours
- **Tab Logs** : Tous les logs confondus et listés chronologiquement (messages C# ↔ JavaScript)
- **Tab Network** : Les logs mis ensemble par requête, groupés par MessageId pour voir la séquence complète

Le tout sans surcoût en production car le code de debug n'est activé que si compilé en mode DEBUG, utilisation du preprocessing pour determiner.
 
---

## 🔄 Ordre d'implémentation

### 1. Extensions du système de messages existant

- Ajouter un nouveau type de message `DebugLog` dans l'enum `MessageType`
- Créer la classe `DebugLogEntry` (direction, type, serviceName, methodName, message, parameters, result, error, timestamp, duration, messageId)
- Créer la classe `ServiceDebugInfo` pour les métadonnées de service

### 2. Étendre ServiceBridge avec événements de debug

- Ajouter des événements `MessageSent`, `MessageReceived`, `MethodCalled`, `MethodCompleted`, `EventFired`, `ErrorOccurred`
- Émettre ces événements à chaque opération du bridge
- Créer une méthode `GetRegisteredServices()` qui retourne les métadonnées des services enregistrés

### 3. Gestion du mode debug via preprocessing

- Utiliser le define symbol `DEBUG` du compilateur C# pour déterminer si les événements de debug doivent être émis
- En mode DEBUG : activer tous les événements de debug
- En mode RELEASE : ne pas émettre les événements de debug (zero overhead)

### 4. Création du UserControl principal

- Créer `JsBridgeWebView` UserControl WPF contenant une WebView2
- Le UserControl expose une propriété `ServiceBridge` accessible de l'extérieur, instancié par lui meme mais exposé pour que l'user puisse register ses services
- Le UserControl encapsule l'initialisation de la WebView2 et du ServiceBridge
- Le UserControl gère le button overlay pour afficher/masquer le panel de debug
- Le UserControl s'abonne aux événements de debug du ServiceBridge
- le usercontrol permet de naviguer vers un dossier local (voir MainwWindow.cs actuel)

### 5. Création du Debug Panel

- Créer `DebugPanel` UserControl WPF avec une interface à 4 onglets (Services, Services Instance, Logs, Network)
- **Tab Services** : Liste des services enregistrés avec leurs métadonnées, clic pour voir les détails
- **Tab Services Instances** : Les instances de services utilisées en cours
- **Tab Logs** : Tous les logs confondus et listés chronologiquement (messages C# ↔ JavaScript)
- **Tab Network** : Les logs mis ensemble par requête, groupés par MessageId pour voir la séquence complète
- Le panel s'abonne aux événements de debug et met à jour l'UI en temps réel

### 6. Capture et stockage des logs

- À chaque message envoyé par le bridge : créer un `DebugLogEntry` (direction C# → JS)
- À chaque message reçu par le bridge : créer un `DebugLogEntry` (direction JS → C#)
- À chaque méthode appelée : créer un `DebugLogEntry` avec les paramètres
- À chaque réponse reçue : créer un `DebugLogEntry` avec le résultat
- À chaque événement déclenché : créer un `DebugLogEntry`
- À chaque erreur : créer un `DebugLogEntry` avec le message d'erreur
- Stocker tous les logs dans une liste centralisée

### 7. Corrélation des logs par requête

- Les messages bridge sont groupés par MessageId dans le Tab Network
- Les requêtes sont associées à leurs réponses via le MessageId
- Les durées sont calculées (temps de réponse)
- Les groupes montrent la séquence complète : requête → réponse
- Les erreurs sont associées à leur requête correspondante

---

## ✅ Résultat final

L'utilisateur final du UserControl a simplement à :

1. Ajouter le `JsBridgeWebView` à son application
2. Appeler `InitializeAsync()`
3. Enregistrer ses services via `ServiceBridge.RegisterSingletonService()`
4. Naviguer vers son application JS

Et il peut appuyer sur **F12** pour voir un panel de debug à 3 onglets (Services, Logs, Network) sans aucun code supplémentaire.