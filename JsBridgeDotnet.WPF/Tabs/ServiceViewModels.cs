using JsBridgeDotnet.Core;
using System.Collections.ObjectModel;
using System.ComponentModel;

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

        public string DisplayName => $"  {Name}: {Type}";

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

        public string DisplayName => $"{Name}: {Type} = {FormatValue()}";

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
}
