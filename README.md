# grist-widgets

Widget React/TypeScript embarqué dans un document [Grist](https://www.getgrist.com/).
Il sert d'interface de gestion à un laboratoire de recherche : membres,
partenaires, projets, actions, et un onglet Finance qui suit le budget et
importe les exports SIFAC.

Grist fournit la base de données et l'authentification. Le widget lit et écrit
dans les tables du document qui le charge.

## Lancer le projet

```
npm install
npm run dev      # http://localhost:5173, en données fictives
npm run build
```

En développement, `VITE_USE_MOCK=true` fait tourner l'application sur des
données fictives, sans Grist.

## Déploiement

Chaque push sur `main` reconstruit le widget et le publie sur GitHub Pages
(branche `gh-pages`), d'où Grist le charge.

## Auteur

Pierre Bdioui.

## Licence

Tous droits réservés. Le code est public pour consultation uniquement ; toute
réutilisation, modification ou redistribution demande l'accord écrit de
l'auteur. Voir [LICENSE](LICENSE).
