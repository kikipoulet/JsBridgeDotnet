using System.Collections.ObjectModel;
using JsBridgeDotnet.Core;

namespace WpfApp1.Services.Shop;

public class Article
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double Price { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
}

[JsService("ArticleList")]
public class ArticleListService
{
    public ObservableCollection<Article> Articles { get; set; } = new ObservableCollection<Article>()
    {
        new Article
        {
            Id = "1",
            Name = "Laptop Pro 15",
            Description = "High-performance laptop with 16GB RAM, 512GB SSD, and dedicated graphics card",
            Price = 1299.99,
            ImageUrl = "https://via.placeholder.com/300x200/4287f5/ffffff?text=Laptop"
        },
        new Article
        {
            Id = "2", 
            Name = "Wireless Mouse",
            Description = "Ergonomic wireless mouse with precision tracking and long battery life",
            Price = 29.99,
            ImageUrl = "https://via.placeholder.com/300x200/f54242/ffffff?text=Mouse"
        },
        new Article
        {
            Id = "3",
            Name = "Mechanical Keyboard",
            Description = "RGB backlit mechanical keyboard with cherry MX switches",
            Price = 89.99,
            ImageUrl = "https://via.placeholder.com/300x200/42f554/ffffff?text=Keyboard"
        },
        new Article
        {
            Id = "4",
            Name = "4K Monitor",
            Description = "27-inch 4K IPS monitor with HDR support and USB-C connectivity",
            Price = 399.99,
            ImageUrl = "https://via.placeholder.com/300x200/f5a442/ffffff?text=Monitor"
        },
        new Article
        {
            Id = "5",
            Name = "USB-C Hub",
            Description = "Multi-port USB-C hub with HDMI, USB 3.0, and SD card reader",
            Price = 49.99,
            ImageUrl = "https://via.placeholder.com/300x200/a442f5/ffffff?text=Hub"
        },
        new Article
        {
            Id = "6",
            Name = "Webcam HD",
            Description = "1080p HD webcam with auto-focus and noise-cancelling microphone",
            Price = 79.99,
            ImageUrl = "https://via.placeholder.com/300x200/42f5f5/ffffff?text=Webcam"
        }
    };
}
