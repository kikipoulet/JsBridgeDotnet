using System;
using System.Threading.Tasks;

namespace JsBridgeDotnet.Core
{
    /// <summary>
    /// Interface pour le gestionnaire de messages webview
    /// Permet de découpler ServiceBridge de l'implémentation spécifique (WebView2, Electron, etc.)
    /// </summary>
    public interface IWebMessageHandler : IDisposable
    {
        /// <summary>
        /// Événement déclenché lorsqu'un message est reçu du webview
        /// </summary>
        event EventHandler<string> MessageReceived;

        /// <summary>
        /// Initialise le handler de manière asynchrone
        /// </summary>
        Task InitializeAsync();

        /// <summary>
        /// Envoie un message au webview
        /// </summary>
        /// <param name="message">Message à envoyer (chaîne JSON)</param>
        void SendMessage(string message);

        /// <summary>
        /// Indique si le handler a été initialisé
        /// </summary>
        bool IsInitialized { get; }

        /// <summary>
        /// Dispatcher pour les opérations thread-safe
        /// </summary>
        System.Windows.Threading.Dispatcher Dispatcher { get; }
    }
}
