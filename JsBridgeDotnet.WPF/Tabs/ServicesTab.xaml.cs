using JsBridgeDotnet.Core;
using System.Collections.ObjectModel;
using System.Windows.Controls;

namespace JsBridgeDotnet.WPF.Tabs
{
    /// <summary>
    /// Tab affichant la liste des services enregistrés avec leurs métadonnées
    /// </summary>
    public partial class ServicesTab : UserControl
    {
        /// <summary>
        /// Collection observable des services pour le TreeView
        /// </summary>
        public ObservableCollection<ServiceNode> Services { get; }

        /// <summary>
        /// Constructeur
        /// </summary>
        public ServicesTab()
        {
            InitializeComponent();
            Services = new ObservableCollection<ServiceNode>();
            servicesTreeView.ItemsSource = Services;
        }

        /// <summary>
        /// Met à jour la liste des services
        /// </summary>
        /// <param name="services">Liste des services enregistrés</param>
        public void UpdateServices(System.Collections.Generic.IEnumerable<ServiceDebugInfo> services)
        {
            Services.Clear();
            
            foreach (var service in services)
            {
                Services.Add(new ServiceNode(service));
            }
        }
    }
}
