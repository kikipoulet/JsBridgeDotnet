using JsBridgeDotnet.Core;
using JsBridgeDotnet.WPF.Tabs;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;

namespace JsBridgeDotnet.WPF
{
    /// <summary>
    /// Debug Panel avec 4 onglets pour visualiser les communications C# ↔ JavaScript
    /// </summary>
    public partial class DebugPanel : UserControl
    {
#if DEBUG
        private readonly ServiceBridge _serviceBridge;
        private readonly ServicesTab _servicesTab;
        private readonly DispatcherTimer _refreshTimer;

        /// <summary>
        /// Constructeur
        /// </summary>
        /// <param name="serviceBridge">Instance du ServiceBridge à surveiller</param>
        public DebugPanel(ServiceBridge serviceBridge)
        {
            InitializeComponent();

            _serviceBridge = serviceBridge ?? throw new ArgumentNullException(nameof(serviceBridge));

            // Créer et initialiser le ServicesTab
            _servicesTab = new ServicesTab();

            // Injecter le ServicesTab dans le TabItem "Services"
            servicesTab.Content = _servicesTab;

            // Charger les services existants
            RefreshServices();

            // Créer un timer pour rafraîchir périodiquement les services
            _refreshTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(5)
            };
            _refreshTimer.Tick += OnRefreshTimerTick;
            _refreshTimer.Start();

            // S'abonner aux événements de debug du ServiceBridge
            // (TODO: sera utilisé pour les futurs tabs Logs et Network)
            _serviceBridge.MessageSent += OnMessageSent;
            _serviceBridge.MessageReceived += OnMessageReceived;
            _serviceBridge.MethodCalled += OnMethodCalled;
            _serviceBridge.MethodCompleted += OnMethodCompleted;
            _serviceBridge.EventFired += OnEventFired;
            _serviceBridge.ErrorOccurred += OnErrorOccurred;
            
            // S'abonner à l'événement Unloaded pour nettoyer les ressources
            Unloaded += (sender, args) =>
            {
                OnUnloaded();
            };
        }

        /// <summary>
        /// Rafraîchir la liste des services depuis le ServiceBridge
        /// </summary>
        private void RefreshServices()
        {
            try
            {
                var services = _serviceBridge.GetRegisteredServices();
                _servicesTab.UpdateServices(services);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error refreshing services: {ex.Message}");
            }
        }

        /// <summary>
        /// Handler du timer de rafraîchissement
        /// </summary>
        private void OnRefreshTimerTick(object? sender, EventArgs e)
        {
            RefreshServices();
        }

        /// <summary>
        /// Event handlers pour les événements de debug
        /// (TODO: seront utilisés pour les futurs tabs Logs et Network)
        /// </summary>
        private void OnMessageSent(DebugLogEntry entry)
        {
            // TODO: À implémenter pour le LogsTab
        }

        private void OnMessageReceived(DebugLogEntry entry)
        {
            // TODO: À implémenter pour le LogsTab
        }

        private void OnMethodCalled(DebugLogEntry entry)
        {
            // TODO: À implémenter pour le LogsTab
        }

        private void OnMethodCompleted(DebugLogEntry entry)
        {
            // TODO: À implémenter pour le LogsTab
        }

        private void OnEventFired(DebugLogEntry entry)
        {
            // TODO: À implémenter pour le LogsTab
        }

        private void OnErrorOccurred(DebugLogEntry entry)
        {
            // TODO: À implémenter pour le LogsTab
        }

        /// <summary>
        /// Libère les ressources quand le UserControl est déchargé
        /// </summary>
        private void OnUnloaded()
        {
            _refreshTimer?.Stop();
            
            // Se désabonner des événements
            _serviceBridge.MessageSent -= OnMessageSent;
            _serviceBridge.MessageReceived -= OnMessageReceived;
            _serviceBridge.MethodCalled -= OnMethodCalled;
            _serviceBridge.MethodCompleted -= OnMethodCompleted;
            _serviceBridge.EventFired -= OnEventFired;
            _serviceBridge.ErrorOccurred -= OnErrorOccurred;
        }
#else
        /// <summary>
        /// Constructeur (mode RELEASE - ne rien faire)
        /// </summary>
        /// <param name="serviceBridge">Non utilisé en mode RELEASE</param>
        public DebugPanel(ServiceBridge serviceBridge)
        {
            InitializeComponent();
        }
#endif
    }
}
