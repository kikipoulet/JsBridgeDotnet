using JsBridgeDotnet.Core;
using JsBridgeDotnet.WebView2Handler;
using Microsoft.Web.WebView2.Wpf;
using System;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;

namespace JsBridgeDotnet.WPF
{
    /// <summary>
    /// UserControl encapsulant une WebView2 et un ServiceBridge
    /// Fournit une interface simplifiée pour exposer des services C# à JavaScript
    /// </summary>
    public partial class JsBridgeWebView : UserControl
    {
        private ServiceBridge? _serviceBridge;
        private bool _isInitialized;

        /// <summary>
        /// Obtient le ServiceBridge pour enregistrer des services
        /// </summary>
        public ServiceBridge ServiceBridge
        {
            get
            {
                if (!_isInitialized || _serviceBridge == null)
                {
                    throw new InvalidOperationException("JsBridgeWebView is not initialized. Call InitializeAsync() first.");
                }
                return _serviceBridge;
            }
        }

        /// <summary>
        /// Obtient ou définit l'URI source de la WebView2
        /// </summary>
        public Uri Source
        {
            get => webView.Source;
            set => webView.Source = value;
        }

        /// <summary>
        /// Constructeur
        /// </summary>
        public JsBridgeWebView()
        {
            InitializeComponent();
            
#if DEBUG
            // Afficher le bouton de debug seulement en mode DEBUG
            debugButton.Visibility = Visibility.Visible;
#endif
        }

        /// <summary>
        /// Initialise la WebView2 et crée le ServiceBridge de manière asynchrone
        /// IMPORTANT: ConfigureLocalPage doit être appelé AVANT cette méthode
        /// car elle initialise CoreWebView2 avec le virtual host mapping
        /// </summary>
        /// <returns>Tâche représentant l'initialisation</returns>
        public async Task InitializeAsync()
        {
            if (_isInitialized)
                return;

            // Créer le message handler pour la WebView2 interne
            // Note: CoreWebView2 doit déjà être initialisé par ConfigureLocalPage
            var messageHandler = new WebView2MessageHandler(webView);
            await messageHandler.InitializeAsync();

            // Créer et stocker le ServiceBridge
            _serviceBridge = new ServiceBridge(messageHandler);
            _isInitialized = true;
        }

        /// <summary>
        /// Configure la WebView2 pour servir une page locale avec virtual host mapping
        /// Réutilise la méthode d'extension ConfigureLocalPage existante
        /// </summary>
        /// <param name="pathComponents">Composants du chemin (ex: "wwwroot", "react", "reactapp", "dist")</param>
        /// <returns>Tâche représentant la configuration</returns>
        public async Task ConfigureLocalPage(params string[] pathComponents)
        {
            // Réutiliser l'extension existante
            await webView.ConfigureLocalPage(pathComponents);
        }

        /// <summary>
        /// Handler pour le clic sur le bouton de debug
        /// Placeholder pour l'étape 5 (création du Debug Panel)
        /// </summary>
        private void OnDebugButtonClick(object sender, RoutedEventArgs e)
        {
            // TODO: Étape 5 - Ouvrir le Debug Panel
            MessageBox.Show("Debug Panel - Coming Soon!", "Debug", MessageBoxButton.OK, MessageBoxImage.Information);
        }
    }
}
