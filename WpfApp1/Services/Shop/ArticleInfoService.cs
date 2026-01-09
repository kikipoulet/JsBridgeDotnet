using CommunityToolkit.Mvvm.ComponentModel;
using JsBridgeDotnet.Core;
using Microsoft.Extensions.DependencyInjection;

namespace WpfApp1.Services.Shop;

[JsService("ArticleInfo")]
public partial class ArticleInfoService : ObservableObject
{
    [ObservableProperty] private Article article = null;
    
    public ArticleInfoService(string id)
    {
        Article = MainWindow.serviceProvider.GetRequiredService<ArticleListService>().Articles.FirstOrDefault(a => a.Id == id);

        Task.Run(() =>
        {
            for (int i = 0; i < 100; i++)
            {
                Article.Price *= 1.05;
                Thread.Sleep(1000);
            }
        });
    }
}