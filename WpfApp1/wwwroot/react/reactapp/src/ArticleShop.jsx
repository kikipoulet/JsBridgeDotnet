import { useState, useEffect } from 'react';
import './dotnetbridge.js';
import { useObservableCollection } from './dotnetbridge-react.js';
import { Card, Button, Chip, Surface } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';

function ArticleShop() {
  const [shopService, setShopService] = useState(null);
  const articles = useObservableCollection(shopService, 'Articles');

  useEffect(() => {
    const initService = async () => {
      const service = await window.DotnetBridge.getService('ArticleList');
      setShopService(service);
    };

    initService();
  }, []);

  const handleAddToCart = (article) => {
    console.log(`Added to cart: ${article.Name} - $${article.Price}`);
  };

  const ProductCard = ({ article }) => (
      <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
          layout
      >
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
                onPress={() => handleAddToCart(article)}
                className="font-medium"
            >
              Ajouter
            </Button>
          </Card.Footer>
        </Card>
      </motion.div>
  );

  return (
      <Surface variant="default" className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              🛒 Boutique
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {articles.length} {articles.length === 1 ? 'article disponible' : 'articles disponibles'}
            </p>
          </motion.div>

          {articles.length === 0 ? (
              <motion.div
                  initial={{ }}
                  animate={{ }}
                  className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Aucun article disponible pour le moment
                </p>
              </motion.div>
          ) : (
              <motion.div
                  layout
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                <AnimatePresence mode="popLayout">
                  {articles.map((article, index) => (
                      <motion.div
                          key={article.Id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{
                            duration: 0.4,
                            delay: index * 0.08,
                            type: 'spring',
                            stiffness: 150,
                            damping: 20
                          }}
                      >
                        <ProductCard article={article} />
                      </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
          )}
        </div>
      </Surface>
  );
}

export default ArticleShop;