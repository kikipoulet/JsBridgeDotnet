using JsBridgeDotnet.Core;
using Microsoft.Web.WebView2.Wpf;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace JsBridgeDotnet.WebView2Handler
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

            var messageHandler = new WebView2MessageHandler(webView);
            await messageHandler.InitializeAsync();

            return new ServiceBridge(messageHandler);
        }

        /// <summary>
        /// Navigue vers une page HTML locale dans le dossier de l'application
        /// </summary>
        /// <param name="webView">Instance WebView2</param>
        /// <param name="pathComponents">Composants du chemin (ex: "wwwroot", "index.html")</param>
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
