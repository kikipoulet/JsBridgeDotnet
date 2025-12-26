using Microsoft.Web.WebView2.Wpf;
using System;
using System.IO;
using System.Threading.Tasks;
using JsBridgeDotnet.Core;

namespace JsBridgeDotnet.Extensions
{
    /// <summary>
    /// Extensions pour faciliter l'utilisation du ServiceBridge avec WebView2
    /// </summary>
    public static class WebViewExtensions
    {
        /// <summary>
        /// Crée et retourne un ServiceBridge pour cette WebView2
        /// </summary>
        /// <param name="webView">Instance WebView2</param>
        /// <returns>Instance de ServiceBridge</returns>
        public static async Task<ServiceBridge> CreateServiceBridgeAsync(this WebView2 webView)
        {
            if (webView == null)
                throw new ArgumentNullException(nameof(webView));

            // S'assurer que WebView2 est initialisé
            await webView.EnsureCoreWebView2Async();

            return new ServiceBridge(webView);
        }

        /// <summary>
        /// Crée un ServiceBridge et enregistre automatiquement les services spécifiés
        /// </summary>
        /// <param name="webView">Instance WebView2</param>
        /// <param name="services">Dictionnaire de nom -> instance de service</param>
        /// <returns>Instance de ServiceBridge configurée</returns>
        public static async Task<ServiceBridge> CreateServiceBridgeAsync(
            this WebView2 webView,
            params (string serviceName, object serviceInstance)[] services)
        {
            var bridge = await CreateServiceBridgeAsync(webView);

            foreach (var (serviceName, serviceInstance) in services)
            {
                bridge.RegisterSingletonService(serviceName, serviceInstance);
            }

            return bridge;
        }
        
        
        
        /// <summary>
        /// Navigue vers une page HTML locale dans le dossier de l'application
        /// </summary>
        /// <param name="webView">Instance WebView2</param>
        /// <param name="relativePath">Chemin relatif depuis BaseDirectory (ex: "wwwroot", "pages/home")</param>
        /// <param name="fileName">Nom du fichier HTML (ex: "index.html")</param>
        public static void NavigateToLocalPage(this WebView2 webView, params string[] pathComponents)
        {
            if (webView == null)
                throw new ArgumentNullException(nameof(webView));
    
            if (pathComponents == null || pathComponents.Length == 0)
                throw new ArgumentException("At least one path component must be provided", nameof(pathComponents));

            // Créer le chemin complet en utilisant params
            var fullPath = Path.Combine(
                new[] { AppDomain.CurrentDomain.BaseDirectory }
                    .Concat(pathComponents)
                    .ToArray());
    
            var fileUri = new Uri("file:///" + fullPath);
            webView.Source = fileUri;
        }


    }
}
