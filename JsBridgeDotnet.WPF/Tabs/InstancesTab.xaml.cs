using JsBridgeDotnet.Core;
using System.Collections.ObjectModel;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Threading;

namespace JsBridgeDotnet.WPF.Tabs
{
    /// <summary>
    /// Tab affichant toutes les instances actives de services
    /// </summary>
    public partial class InstancesTab : UserControl
    {
        /// <summary>
        /// Collection observable des instances pour le DataGrid
        /// </summary>
        public ObservableCollection<InstanceNode> Instances { get; }

        /// <summary>
        /// Commande pour tuer une instance transient
        /// </summary>
        public ICommand KillCommand { get; }

        /// <summary>
        /// ServiceBridge pour accéder aux services enregistrés
        /// </summary>
        private ServiceBridge _serviceBridge;

        /// <summary>
        /// Constructeur
        /// </summary>
        public InstancesTab()
        {
            InitializeComponent();
            Instances = new ObservableCollection<InstanceNode>();
            instancesDataGrid.ItemsSource = Instances;
            KillCommand = new RelayCommand(OnKillInstance);
        }

        /// <summary>
        /// Définit le ServiceBridge à utiliser
        /// </summary>
        /// <param name="serviceBridge">Instance du ServiceBridge</param>
        public void SetServiceBridge(ServiceBridge serviceBridge)
        {
            _serviceBridge = serviceBridge;
        }

        /// <summary>
        /// Met à jour la liste des instances
        /// </summary>
        /// <param name="services">Liste des services enregistrés</param>
        public void UpdateInstances(System.Collections.Generic.IEnumerable<ServiceDebugInfo> services)
        {
            Instances.Clear();
            
            foreach (var service in services)
            {
                var instance = new InstanceNode
                {
                    ServiceName = service.ServiceName,
                    ServiceType = service.ServiceType,
                    InstanceId = service.InstanceId,
                    Lifetime = service.Lifetime,
                    Status = "Active"
                };
                
                Instances.Add(instance);
            }
        }

        /// <summary>
        /// Handler pour supprimer une instance transient
        /// </summary>
        private void OnKillInstance(object parameter)
        {
            if (parameter is InstanceNode instanceNode && _serviceBridge != null)
            {
                // Note: Pour l'instant, on ne peut pas vraiment tuer une instance depuis le DebugPanel
                // car le ServiceBridge n'expose pas cette méthode publique
                // On affiche juste un message informatif
                System.Windows.MessageBox.Show(
                    $"Kill functionality not yet implemented for instance '{instanceNode.DisplayInstanceId}' of service '{instanceNode.ServiceName}'.\n\n" +
                    "This feature requires adding a method to ServiceBridge to manually dispose transient instances.",
                    "Feature Not Implemented",
                    System.Windows.MessageBoxButton.OK,
                    System.Windows.MessageBoxImage.Information);
            }
        }

        /// <summary>
        /// Commande simple pour WPF
        /// </summary>
        private class RelayCommand : ICommand
        {
            private readonly Action<object> _execute;
            private readonly Func<object, bool> _canExecute;

            public RelayCommand(Action<object> execute, Func<object, bool> canExecute = null)
            {
                _execute = execute;
                _canExecute = canExecute;
            }

            public event EventHandler CanExecuteChanged
            {
                add { CommandManager.RequerySuggested += value; }
                remove { CommandManager.RequerySuggested -= value; }
            }

            public bool CanExecute(object parameter)
            {
                return _canExecute == null || _canExecute(parameter);
            }

            public void Execute(object parameter)
            {
                _execute?.Invoke(parameter);
            }
        }
    }
}
