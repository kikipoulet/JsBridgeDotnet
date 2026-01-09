import { useState, useEffect } from 'react';
import { Card, Button, Chip, Surface, Avatar, Link, Spinner } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {useObservableProperty} from "./dotnetbridge-react.js";

function ArticleDetails({ articleId, articleName, onBack }) {
  const [articleInfoService, setArticleInfoService] = useState(null);
    const [article, setarticle] = useObservableProperty(articleInfoService, 'Article');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('load service with id: ' + articleId );
        const service = await window.DotnetBridge.getService('ArticleInfo', {
          constructorParameters: [articleId]
        });
        console.log('loaded service!' );
        setArticleInfoService(service);
        setLoading(false);
      } catch (err) {
        console.log(err.message);
        setError('Failed to load article details');
        setLoading(false);
      }
    };

    loadArticle();
  }, [articleId]);

  if (loading) {
    return (
      <Surface variant="default" className="min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center min-h-screen"
        >
          <Spinner size="lg" />
        </motion.div>
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface variant="default" className="min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <Card variant="tertiary" className="p-8 text-center max-w-md">
            <Card.Header>
              <Card.Title className="text-danger">Error</Card.Title>
              <Card.Description>{error}</Card.Description>
            </Card.Header>
            <Card.Footer>
              <Button onPress={onBack}>Retour à la boutique</Button>
            </Card.Footer>
          </Card>
        </div>
      </Surface>
    );
  }


  return (
    <Surface variant="default" className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="flex items-center gap-2 mb-6">
          <Link onPress={onBack} underline="hover" className="text-sm">
            Boutique
          </Link>
          <span className="text-muted-foreground">→</span>
          <span className="text-foreground font-medium">{article?.name}</span>
        </div>

        <Card variant="tertiary" className="max-w-3xl mx-auto">
          <Card.Content className="flex flex-col md:flex-row gap-6 p-6">
            <Avatar className="shrink-0 w-full md:w-auto" size="lg">
              <Avatar.Image 
                src={article?.imageUrl} 
                alt={article?.name} 
                className="w-full md:w-auto"
              />
              <Avatar.Fallback>{article?.name?.charAt(0)}</Avatar.Fallback>
            </Avatar>

            <div className="flex-1 flex flex-col gap-4">
              <div>
                <Card.Title className="text-3xl font-bold mb-3">
                  {article?.name}
                </Card.Title>
                <Card.Description className="text-base leading-relaxed text-foreground/80">
                  {article?.description}
                </Card.Description>
              </div>
              
              <div className="flex items-center gap-4">
                <Chip color="accent" size="lg" variant="soft">
                  ${article?.price}
                </Chip>
              </div>

              <Card.Footer className="flex gap-3 mt-4 pt-4 border-t">
                <Button variant="primary" onPress={onBack} className="flex-1 md:flex-none">
                  Retour à la boutique
                </Button>
              </Card.Footer>
            </div>
          </Card.Content>
        </Card>
      </motion.div>
    </Surface>
  );
}

export default ArticleDetails;
