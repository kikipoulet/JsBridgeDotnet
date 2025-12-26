using JsBridgeDotnet.Core;
using System;
using System.Threading.Tasks;
using Microsoft.Web.WebView2.Wpf;

namespace JsBridgeDotnet.WebView2Handler
{
    /// <summary>
    /// Implémentation de IWebMessageHandler pour WebView2
    /// </summary>
    public class WebView2MessageHandler : IWebMessageHandler
    {
        private readonly WebView2 _webView;
        private bool _isInitialized;

        public event EventHandler<string> MessageReceived;

        public bool IsInitialized => _isInitialized;
        public System.Windows.Threading.Dispatcher Dispatcher => _webView.Dispatcher;

        public WebView2MessageHandler(WebView2 webView)
        {
            _webView = webView ?? throw new ArgumentNullException(nameof(webView));
        }

        /// <summary>
        /// Initialise le handler WebView2 de manière asynchrone
        /// </summary>
        public async Task InitializeAsync()
        {
            if (_isInitialized)
                return;

            await _webView.EnsureCoreWebView2Async();

            if (_webView.CoreWebView2 == null)
            {
                throw new InvalidOperationException("WebView2 initialization failed. CoreWebView2 is null.");
            }

            _webView.CoreWebView2.WebMessageReceived += OnWebMessageReceived;
            _isInitialized = true;
        }

        /// <summary>
        /// Envoie un message à WebView2
        /// </summary>
        public void SendMessage(string message)
        {
            if (!_isInitialized)
            {
                throw new InvalidOperationException("WebView2MessageHandler is not initialized. Call InitializeAsync() first.");
            }

            if (_webView.CoreWebView2 == null)
            {
                throw new InvalidOperationException("WebView2 CoreWebView2 is null.");
            }

            _webView.CoreWebView2.PostWebMessageAsString(message);
        }

        /// <summary>
        /// Handler pour les messages reçus de WebView2
        /// </summary>
        private void OnWebMessageReceived(object sender, Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                var messageJson = e.TryGetWebMessageAsString();
                MessageReceived?.Invoke(this, messageJson);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error handling web message: {ex.Message}");
            }
        }

        /// <summary>
        /// Libère les ressources
        /// </summary>
        public void Dispose()
        {
            if (_webView.CoreWebView2 != null)
            {
                _webView.CoreWebView2.WebMessageReceived -= OnWebMessageReceived;
            }
            _isInitialized = false;
        }
    }
}
