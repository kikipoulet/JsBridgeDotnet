using Microsoft.Web.WebView2.Wpf;
using System;
using System.Threading.Tasks;
using JsWebviewConnector.Core;

namespace JsWebviewConnector.Extensions
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
                bridge.RegisterService(serviceName, serviceInstance);
            }

            return bridge;
        }
    }
}
