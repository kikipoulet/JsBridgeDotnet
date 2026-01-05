using JsBridgeDotnet.Core;
using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Controls;

namespace JsBridgeDotnet.WPF.Tabs
{
    /// <summary>
    /// Tab affichant tous les logs de communication C# ↔ JavaScript
    /// </summary>
    public partial class LogsTab : UserControl
    {
        /// <summary>
        /// Collection observable des logs pour le DataGrid
        /// </summary>
        public ObservableCollection<LogEntry> Logs { get; }

        /// <summary>
        /// ServiceBridge pour accéder aux services enregistrés (optionnel, pour référence)
        /// </summary>
        private ServiceBridge _serviceBridge;

        /// <summary>
        /// Constructeur
        /// </summary>
        public LogsTab()
        {
            InitializeComponent();
            Logs = new ObservableCollection<LogEntry>();
            logsDataGrid.ItemsSource = Logs;
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
        /// Ajoute un log depuis un DebugLogEntry
        /// </summary>
        /// <param name="entry">Entrée de log à ajouter</param>
        public void AddLog(DebugLogEntry entry)
        {
            var logEntry = new LogEntry(entry);
            
            // Utiliser le Dispatcher pour mettre à jour l'UI depuis le thread UI
            Dispatcher.Invoke(() =>
            {
                Logs.Add(logEntry);
                
                // Scroll automatiquement vers le dernier log
                if (logsDataGrid.Items.Count > 0)
                {
                    logsDataGrid.ScrollIntoView(logEntry);
                }
            });
        }

        /// <summary>
        /// Vide la liste des logs
        /// </summary>
        public void ClearLogs()
        {
            Dispatcher.Invoke(() =>
            {
                Logs.Clear();
            });
        }

        /// <summary>
        /// Handler pour le bouton Clear Logs
        /// </summary>
        private void OnClearLogs(object sender, RoutedEventArgs e)
        {
            ClearLogs();
        }

        /// <summary>
        /// Handler pour le bouton Export Logs
        /// </summary>
        private void OnExportLogs(object sender, RoutedEventArgs e)
        {
            ExportLogsToCsv();
        }

        /// <summary>
        /// Exporte les logs vers un fichier CSV
        /// </summary>
        private void ExportLogsToCsv()
        {
            if (Logs.Count == 0)
            {
                MessageBox.Show("No logs to export.", "Export Logs", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            // Créer le contenu CSV
            var csv = new System.Text.StringBuilder();
            csv.AppendLine("Timestamp,Direction,Type,Service,Method,Message,Result,Error,Duration");

            foreach (var log in Logs)
            {
                // Échapper les guillemets et les virgules
                var timestamp = log.Timestamp.ToString("HH:mm:ss.fff");
                var direction = EscapeCsvField(log.Direction);
                var type = EscapeCsvField(log.Type);
                var service = EscapeCsvField(log.ServiceName);
                var method = EscapeCsvField(log.MethodName);
                var message = EscapeCsvField(log.Message);
                var result = EscapeCsvField(log.Result);
                var error = EscapeCsvField(log.Error);
                var duration = EscapeCsvField(log.Duration);

                csv.AppendLine($"{timestamp},{direction},{type},{service},{method},{message},{result},{error},{duration}");
            }

            // Sauvegarder le fichier
            var saveFileDialog = new Microsoft.Win32.SaveFileDialog
            {
                Filter = "CSV Files (*.csv)|*.csv|All Files (*.*)|*.*",
                DefaultExt = "csv",
                FileName = $"debug_logs_{DateTime.Now:yyyyMMdd_HHmmss}.csv"
            };

            if (saveFileDialog.ShowDialog() == true)
            {
                System.IO.File.WriteAllText(saveFileDialog.FileName, csv.ToString());
                MessageBox.Show($"Logs exported to {saveFileDialog.FileName}", "Export Successful", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }

        /// <summary>
        /// Échappe un champ CSV (ajoute des guillemets si nécessaire)
        /// </summary>
        private string EscapeCsvField(string field)
        {
            if (string.IsNullOrEmpty(field))
                return "";
            
            if (field.Contains(",") || field.Contains("\"") || field.Contains("\n"))
            {
                return $"\"{field.Replace("\"", "\"\"")}\"";
            }
            
            return field;
        }
    }
}
