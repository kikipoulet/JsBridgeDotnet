using System;
using System.Text.Json.Serialization;

namespace JsBridgeDotnet.Core
{
    /// <summary>
    /// Types de messages supportés par le bridge
    /// </summary>
    public enum MessageType
    {
        /// <summary>
        /// Enregistrement d'un service côté C#
        /// </summary>
        RegisterService = 0,

        /// <summary>
        /// Appel de méthode C# depuis JavaScript
        /// </summary>
        CallMethod = 1,

        /// <summary>
        /// Résultat d'un appel de méthode
        /// </summary>
        MethodResult = 2,

        /// <summary>
        /// Abonnement à un événement C#
        /// </summary>
        SubscribeEvent = 3,

        /// <summary>
        /// Désabonnement d'un événement
        /// </summary>
        UnsubscribeEvent = 4,

        /// <summary>
        /// Événement déclenché par C#
        /// </summary>
        EventFired = 5,

        /// <summary>
        /// Message d'erreur
        /// </summary>
        ErrorResponse = 6,

        /// <summary>
        /// Changement de propriété INotifyPropertyChanged
        /// </summary>
        PropertyChangeFired = 7
    }

    /// <summary>
    /// Message de base pour la communication C# - JavaScript
    /// </summary>
    public class BridgeMessage
    {
        /// <summary>
        /// Identifiant unique du message pour la corrélation
        /// </summary>
        public string MessageId { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Type du message
        /// </summary>
        [JsonPropertyName("type")]
        public MessageType Type { get; set; }

        /// <summary>
        /// Nom du service concerné
        /// </summary>
        public string ServiceName { get; set; }

        /// <summary>
        /// Nom de la méthode ou de l'événement
        /// </summary>
        [JsonPropertyName("methodName")]
        public string MethodName { get; set; }

        /// <summary>
        /// Identifiant d'écouteur d'événement (pour les abonnements)
        /// </summary>
        [JsonPropertyName("listenerId")]
        public string ListenerId { get; set; }

        /// <summary>
        /// Paramètres de la méthode
        /// </summary>
        public object[] Parameters { get; set; }

        /// <summary>
        /// Résultat de l'appel de méthode ou données de l'événement
        /// </summary>
        public object Result { get; set; }

        /// <summary>
        /// Message d'erreur si applicable
        /// </summary>
        public string Error { get; set; }

        /// <summary>
        /// Indique si l'opération a réussi
        /// </summary>
        public bool Success { get; set; }
    }

    /// <summary>
    /// Métadonnées d'une méthode de service
    /// </summary>
    public class MethodMetadata
    {
        public string Name { get; set; }
        public ParameterMetadata[] Parameters { get; set; }
        public string ReturnType { get; set; }
    }

    /// <summary>
    /// Métadonnées d'un paramètre
    /// </summary>
    public class ParameterMetadata
    {
        public string Name { get; set; }
        public string Type { get; set; }
    }

    /// <summary>
    /// Métadonnées d'une propriété
    /// </summary>
    public class PropertyMetadata
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public object Value { get; set; }
    }

    /// <summary>
    /// Métadonnées d'un service
    /// </summary>
    public class ServiceRegistration
    {
        public string ServiceName { get; set; }
        public MethodMetadata[] Methods { get; set; }
        public string[] Events { get; set; }
        public PropertyMetadata[] Properties { get; set; }
        public bool SupportsPropertyChanged { get; set; }
    }
}
