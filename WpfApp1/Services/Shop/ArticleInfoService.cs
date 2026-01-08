using CommunityToolkit.Mvvm.ComponentModel;
using Microsoft.Extensions.DependencyInjection;

namespace WpfApp1.Services.Shop;

public partial class ArticleInfoService : ObservableObject
{
    [ObservableProperty] private Article _article;
    
    public ArticleInfoService(string id)
    {
        Article = MainWindow.serviceProvider.GetRequiredService<ArticleListService>().Articles.FirstOrDefault(a => a.Id == id);
    }
}