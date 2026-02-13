import { useState, useEffect } from 'react';
import { DotnetBridge, useObservableCollection } from '@kikipoulet/react-dotnetbridge';
import { Card, Button, Chip, Surface, Avatar, Alert } from '@heroui/react';
import { BreadcrumbProvider } from '../../context/BreadcrumbContext';
import ArticleDetails from './ArticleDetails';

function ArticleShopContent() {
  const [shopService, setShopService] = useState(null);
  const [navigationState, setNavigationState] = useState({
    view: 'shop',
    selectedArticleId: null,
    selectedArticleName: null
  });
  const articles = useObservableCollection(shopService, 'Articles');

  useEffect(() => {
    const initService = async () => {
      const service = await DotnetBridge.getService('ArticleList');
      setShopService(service);
    };

    initService();
  }, []);

  const navigateToDetails = (article) => {
    setNavigationState({
      view: 'details',
      selectedArticleId: article.id,
      selectedArticleName: article.name
    });
  };

  const navigateToShop = () => {
    setNavigationState({
      view: 'shop',
      selectedArticleId: null,
      selectedArticleName: null
    });
  };

  const ProductCard = ({ article }) => (
    <Card variant="tertiary" className="h-full flex flex-col">
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-2xl">
        <img
          src={article.imageUrl}
          alt={article.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>

      <Card.Header className="flex-1 flex flex-col gap-1">
        <Card.Title className="line-clamp-1 text-lg font-semibold">
          {article.name}
        </Card.Title>
        <Card.Description className="line-clamp-2 text-sm">
          {article.description}
        </Card.Description>
      </Card.Header>

      <Card.Footer className="flex items-center justify-between gap-3">
        <Chip color="accent" size="lg" variant="soft">
          ${article.price}
        </Chip>
        <Button
          variant="primary"
          size="sm"
          onPress={() => navigateToDetails(article)}
          className="font-medium"
        >
          More Info
        </Button>
      </Card.Footer>
    </Card>
  );

  return (
    <>
      {navigationState.view === 'shop' ? (
        <Surface variant="default" className="min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                🛒 Boutique
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {articles.length} {articles.length === 1 ? 'article disponible' : 'articles disponibles'}
              </p>
            </div>

            {articles.length === 0 ? (
              <div className="flex justify-center py-20">
                <Alert variant="flat" className="max-w-md">
                  <Avatar 
                    size="lg" 
                    radius="lg"
                    className="w-16 h-16"
                  >
                    📦
                  </Avatar>
                  <div className="ml-4">
                    <h3 className="font-semibold text-lg">Aucun article disponible</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Revenez plus tard pour découvrir de nouveaux produits
                    </p>
                  </div>
                </Alert>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {articles.map((article) => (
                  <ProductCard key={article.Id} article={article} />
                ))}
              </div>
            )}
          </div>
        </Surface>
      ) : (
        <ArticleDetails
          key="details"
          articleId={navigationState.selectedArticleId}
          articleName={navigationState.selectedArticleName}
          onBack={navigateToShop}
        />
      )}
    </>
  );
}

function ArticleShop() {
  return (
    <BreadcrumbProvider>
      <ArticleShopContent />
    </BreadcrumbProvider>
  );
}

export default ArticleShop;
