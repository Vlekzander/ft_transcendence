# Chat en jeu — intégration du 21 octobre 2026

## Base et changements

Base : archive transcendence-lobby-actuel.zip fournie le 21 octobre (branche feat/lobby).
Comparaison avec transcendence-canva-actuel.zip : Game.tsx est identique ; la page canvas prévoit un panneau de 320 px à gauche. Le chat occupe ce panneau et le canvas reste à droite sur grand écran. Les composants passent en colonne sur mobile.

Les nouveaux formulaires, invitations, copie du code, redirections de lobby et fichiers Docker sont conservés. Le chat utilise le registre WebSocket existant, les cookies d'authentification et les vrais membres du lobby. Aucun message n'est enregistré en base.

Les types SEND_GAME_CHAT, GAME_CHAT_MESSAGE, GAME_CHAT_GUESS et GAME_CHAT_ERROR sont définis avec Zod dans packages/shared/src/schemas/ws.schemas.ts. La validation entrante et sortante des messages privés est conservée. L'ancien WebSocket.types.ts n'est pas réintroduit.

Le contexte WebSocket expose l'état de connexion et un résultat d'envoi, stabilise les reconnexions et renouvelle la connexion après changement de compte. Un envoi confirmé efface le champ ; une erreur conserve le brouillon.

## Tester localement

Extraire dans un nouveau dossier. Copier le .env et le dossier docker/secrets de l'installation qui fonctionne (les identifiants doivent correspondre à la base existante). Pour une première installation seulement, copier .env.example vers .env puis lancer make secrets.

Depuis l'ancienne installation, arrêter les conteneurs avec docker compose down, sans -v, avant de démarrer celle-ci : le nom du projet Docker est partagé.

```sh
docker compose up -d --build
docker compose ps -a
docker compose logs --tail=60 backend frontend
```

Le backend doit afficher Express server running. En développement avec les ports par défaut, ouvrir http://localhost:5173/lobbies.

1. Se connecter avec un premier compte, créer un lobby.
2. Ouvrir une fenêtre privée avec un second compte et rejoindre le même lobby par invitation ou code.
3. Cliquer Open game dans les deux fenêtres.
4. Envoyer des messages dans les deux sens ; vérifier le nom et l'effacement du champ après confirmation.
5. Vérifier qu'un compte dans un autre lobby ne reçoit rien.
6. Bannir le second compte depuis le lobby : il ne reçoit plus les messages et l'accès à la page de jeu est retiré au prochain contrôle (3 secondes maximum en fonctionnement normal).
7. Rafraîchir : l'historique local du chat disparaît, comme prévu sans stockage.

## Mot secret et limites

Le moteur de manches doit appeler gameChatService.setRoundWord(lobbyUuid, mot) au début de chaque manche et setRoundWord(lobbyUuid, null) à la fin. Sans cet appel, le chat fonctionne normalement mais ne sait pas quel mot filtrer.

Une phrase contenant le mot est refusée. Une réponse égale au mot produit un événement de bonne réponse sans diffuser le mot lui-même, une fois par joueur et par manche. La comparaison utilise NFKC, minuscules et trim ; ce n'est pas un filtre anti-contournement complet.

Cette livraison ne crée pas de moteur de manches, de score ou de synchronisation du dessin. Game.tsx est conservé tel que fourni. Le statut connecté signifie connecté au WebSocket, pas une partie commencée. Le lobby continue son polling existant.

## Vérifications effectuées

- Installation via npm ci et génération Prisma.
- npm run build : partagé, serveur et interface compilent.
- 89 tests dans 8 fichiers : service chat, sockets chat réels, validation de paquets malformés, isolation de salon, ban/départ, filtrage du mot, services lobby, registre et WebSockets existants.
- Les tests réseau du chat simulent l'authentification et le module de messages privés ; ils ne sont pas un test complet PostgreSQL + authentification.
- Contrôle navigateur : navigation lobby → jeu, envoi/confirmation, noms, isolation, brouillon conservé, absence de boucle de reconnexion, redirection après exclusion et affichage ordinateur/mobile. API et WebSockets simulés pour ce contrôle visuel.
- ESLint ciblé sur le code modifié : aucune erreur ; deux avertissements Fast Refresh du fichier de contexte. Les tests sont exclus par la configuration ESLint du projet.

Commande de tests :

```sh
cd apps/server
npx vitest run tests/unit/modules/game-chat tests/integration/game-chat.websocket.integration.test.ts tests/unit/modules/lobby tests/unit/socket.test.ts tests/integration/websocket.server.integration.test.ts --maxWorkers=1
```

## Remettre dans Git

Cette archive n'est pas un dépôt Git. GAME_CHAT_CHANGES.txt liste les fichiers ajoutés/modifiés par rapport à l'archive du lobby reçue. Ne pas recopier tout ce projet par-dessus une branche game plus ancienne : cela mélangerait l'intégration du lobby et celle du chat sans leur historique.

Partir d'une branche de travail basée sur la version feat/lobby examinée, puis transférer seulement les fichiers listés et examiner git diff. Si feat/lobby a avancé depuis cette archive, comparer avant de remplacer ses fichiers. L'intégration de cette branche dans game doit préserver les commits de l'équipe et résoudre les conflits éventuels. Aucun commit ni push n'a été fait par cette livraison.
