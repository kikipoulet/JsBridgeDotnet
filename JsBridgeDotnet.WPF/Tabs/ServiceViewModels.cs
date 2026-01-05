using JsBridgeDotnet.Core;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Windows.Media;

namespace JsBridgeDotnet.WPF.Tabs
{
    /// <summary>
    /// Interface pour tous les nœuds du TreeView
    /// </summary>
    public interface ITreeNode
    {
        string DisplayName { get; }
        ObservableCollection<ITreeNode> Children { get; }
    }

    /// <summary>
    /// Nœud racine pour un service
    /// </summary>
    public class ServiceNode : ITreeNode
    {
        public string ServiceName { get; set; }
        public string ServiceType { get; set; }
        public string Lifetime { get; set; }
        public ObservableCollection<ITreeNode> Children { get; set; }

        public string DisplayName => $"{ServiceName} ({ServiceType})";

        public ServiceNode(ServiceDebugInfo serviceInfo)
        {
            ServiceName = serviceInfo.ServiceName;
            ServiceType = serviceInfo.ServiceType;
            Lifetime = serviceInfo.Lifetime;
            
            Children = new ObservableCollection<ITreeNode>();
            
            // Ajouter la catégorie Lifetime comme premier enfant
            var lifetimeNode = new CategoryNode("📋", $"Lifetime: {Lifetime}");
            Children.Add(lifetimeNode);
            
            // Ajouter les méthodes si disponibles
            if (serviceInfo.Methods?.Length > 0)
            {
                var methodsNode = new CategoryNode("Methods", "Methods");
                foreach (var method in serviceInfo.Methods)
                {
                    methodsNode.Items.Add(new MethodNode(method));
                }
                Children.Add(methodsNode);
            }
            
            // Ajouter les propriétés si disponibles
            if (serviceInfo.Properties?.Length > 0)
            {
                var propertiesNode = new CategoryNode("Properties", "Properties");
                foreach (var property in serviceInfo.Properties)
                {
                    propertiesNode.Items.Add(new PropertyNode(property));
                }
                Children.Add(propertiesNode);
            }
            
            // Ajouter les événements si disponibles
            if (serviceInfo.Events?.Length > 0)
            {
                var eventsNode = new CategoryNode("Events", "Events");
                foreach (var eventName in serviceInfo.Events)
                {
                    eventsNode.Items.Add(new EventNode(eventName));
                }
                Children.Add(eventsNode);
            }
        }
    }

    /// <summary>
    /// Catégorie (Methods, Properties, Events)
    /// </summary>
    public class CategoryNode : ITreeNode
    {
        public string Icon { get; set; }
        public string Name { get; set; }
        public ObservableCollection<ITreeNode> Items { get; set; }
        
        public string DisplayName => Name;
        public ObservableCollection<ITreeNode> Children => Items;

        public CategoryNode(string icon, string name)
        {
            Icon = icon;
            Name = name;
            Items = new ObservableCollection<ITreeNode>();
        }
    }

    /// <summary>
    /// Détail d'une méthode
    /// </summary>
    public class MethodNode : ITreeNode
    {
        public string Name { get; set; }
        public string ReturnType { get; set; }
        public ParameterMetadata[] Parameters { get; set; }
        public ObservableCollection<ITreeNode> Children { get; set; }

        public string DisplayName => $"{Name}() → {ReturnType}";

        public MethodNode(MethodMetadata method)
        {
            Name = method.Name;
            ReturnType = method.ReturnType ?? "void";
            Parameters = method.Parameters;
            
            Children = new ObservableCollection<ITreeNode>();
            
            // Ajouter les paramètres comme enfants
            if (Parameters?.Length > 0)
            {
                foreach (var param in Parameters)
                {
                    Children.Add(new ParameterNode(param));
                }
            }
        }
    }

    /// <summary>
    /// Détail d'un paramètre
    /// </summary>
    public class ParameterNode : ITreeNode
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public ObservableCollection<ITreeNode> Children { get; set; }

        public string DisplayName => $"{Name}: {Type}";

        public ParameterNode(ParameterMetadata param)
        {
            Name = param.Name;
            Type = param.Type;
            Children = new ObservableCollection<ITreeNode>();
        }
    }

    /// <summary>
    /// Détail d'une propriété
    /// </summary>
    public class PropertyNode : ITreeNode
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public object Value { get; set; }
        public bool IsObservableCollection { get; set; }
        public ObservableCollection<ITreeNode> Children { get; set; }

        public string DisplayName => $"{Name}: {FormatValue()}";

        public PropertyNode(PropertyMetadata property)
        {
            Name = property.Name;
            Type = property.Type;
            Value = property.Value;
            IsObservableCollection = property.IsObservableCollection;
            Children = new ObservableCollection<ITreeNode>();
        }

        private string FormatValue()
        {
            if (Value == null)
                return "null";
            
            if (IsObservableCollection)
                return $"[ObservableCollection, Count: {(Value as System.Collections.IList)?.Count ?? 0}]";
            
            return Value.ToString() ?? "null";
        }
    }

    /// <summary>
    /// Détail d'un événement
    /// </summary>
    public class EventNode : ITreeNode
    {
        public string Name { get; set; }
        public ObservableCollection<ITreeNode> Children { get; set; }

        public string DisplayName => Name;

        public EventNode(string name)
        {
            Name = name;
            Children = new ObservableCollection<ITreeNode>();
        }
    }

    /// <summary>
    /// Représente une instance de service pour le tab Instances
    /// </summary>
    public class InstanceNode
    {
        /// <summary>
        /// Nom du service
        /// </summary>
        public string ServiceName { get; set; }

        /// <summary>
        /// Type complet du service
        /// </summary>
        public string ServiceType { get; set; }

        /// <summary>
        /// ID de l'instance (null pour singleton, UUID pour transient)
        /// </summary>
        public string InstanceId { get; set; }

        /// <summary>
        /// Cycle de vie
        /// </summary>
        public string Lifetime { get; set; }

        /// <summary>
        /// Statut de l'instance
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// Indique si l'instance peut être supprimée (uniquement les transients)
        /// </summary>
        public bool CanKill => Lifetime == "Transient";

        /// <summary>
        /// Affichage compact de l'ID
        /// </summary>
        public string DisplayInstanceId => string.IsNullOrEmpty(InstanceId) ? "N/A" : $"{InstanceId.Substring(0, 8)}...";
    }

    /// <summary>
    /// Représente une entrée de log pour le tab Logs
    /// </summary>
    public class LogEntry
    {
        /// <summary>
        /// Timestamp de l'événement
        /// </summary>
        public DateTime Timestamp { get; set; }

        /// <summary>
        /// Direction de communication (C# → JS ou JS → C#)
        /// </summary>
        public string Direction { get; set; }

        /// <summary>
        /// Type de log (Message, MethodCalled, MethodCompleted, EventFired, Error)
        /// </summary>
        public string Type { get; set; }

        /// <summary>
        /// Nom du service concerné (optionnel)
        /// </summary>
        public string ServiceName { get; set; }

        /// <summary>
        /// Nom de la méthode ou de l'événement (optionnel)
        /// </summary>
        public string MethodName { get; set; }

        /// <summary>
        /// Message ou paramètres
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// Résultat de la méthode (si applicable)
        /// </summary>
        public string Result { get; set; }

        /// <summary>
        /// Message d'erreur (si applicable)
        /// </summary>
        public string Error { get; set; }

        /// <summary>
        /// Durée en millisecondes (pour les appels de méthode)
        /// </summary>
        public string Duration { get; set; }

        /// <summary>
        /// Couleur pour le style visuel
        /// </summary>
        public Brush Color { get; set; }

        /// <summary>
        /// Source du log (C# ou JavaScript)
        /// </summary>
        public string Source { get; set; }

        /// <summary>
        /// Constructeur depuis un DebugLogEntry
        /// </summary>
        public LogEntry(DebugLogEntry entry)
        {
            Timestamp = entry.Timestamp;
            Direction = entry.Direction == MessageDirection.CSharpToJavaScript ? "C# → JS" : "JS → C#";
            Type = entry.Type.ToString();
            ServiceName = entry.ServiceName;
            MethodName = entry.MethodName;
            Message = entry.Message ?? (entry.Parameters != null ? System.Text.Json.JsonSerializer.Serialize(entry.Parameters) : string.Empty);
            Result = entry.Result != null ? System.Text.Json.JsonSerializer.Serialize(entry.Result) : string.Empty;
            Error = entry.Error;
            Duration = entry.Duration.HasValue ? $"{entry.Duration.Value.TotalMilliseconds:F0}ms" : string.Empty;
            
            // Définir la couleur en fonction du type
            Color = GetColorByType(entry.Type);
            Source = "C#";
        }

        /// <summary>
        /// Obtient la couleur en fonction du type de log
        /// </summary>
        private static Brush GetColorByType(MessageType type)
        {
            return type switch
            {
                MessageType.ErrorResponse => new SolidColorBrush(Colors.Red),
                MessageType.MethodResult => new SolidColorBrush(Colors.Green),
                MessageType.EventFired => new SolidColorBrush(Colors.Orange),
                MessageType.CallMethod => new SolidColorBrush(Colors.Blue),
                _ => new SolidColorBrush(Colors.Black)
            };
        }
    }
}
