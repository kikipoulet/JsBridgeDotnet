Voici les directives pour le développement React : 

- Tu utilises les composants HeroUI pour le dévellopement de l'interface, framer-motion pour les animations
- Utilises le MCP HeroUI dès que nécéssaire pour chercher les composants dont tu as besoin, ou simplement confirmer comment tu comptes les utiliser
- Designe l'interface avec une UI/UX recherché, avec une rigueur digne d'un produite Apple dont SteveJobs serait fier
- Anime tout les composants de façon riche mais subtile. On veut animer chaque interaction et microinteraction pour rendre l'interface vivante, mais de façon sobre. on préfère les micros interactions animée qualitativement que spectaculairement.
- chaque composant qui apparait ou disparait doit le faire en animant au moins sa hauteur. chaque élément dont c'est le cas ne doit pas contenir de margin, car cela crée un sursaut lorsqu'il disparait. La margin doit être effectué différement afin de ne pas avoir de sursaut. 
- Ne JAMAIS animer `height` sur un élément qui a déjà des margins CSS (classes Tailwind comme mb-*, space-y-*)