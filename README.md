_This project has been created as part of the 42 curriculum by apierret, magoosse, scesar, lmaysash, rtektas._

# ft_transcendence

## Description

A real-time multiplayer drawing and guessing web game inspired by the popular game Skribbl.io, developed as part of the 42 curriculum.

### Key Features

- **Real-Time Multiplayer Rooms**: Support for multiple players drawing and chatting without latency issues.
- **Interactive Drawing Canvas**: Real-time collaborative drawing features with customizable colors and multiple tools.
- **Turn and Word Management**: Automated game loops managing turns, the player(s) drawing, word selection, timers, and score calculation.
- **Social and User Management**: Secure authentication, user account management, public profiles, avatar uploads, a friend system, and live chat features.
- **Spectator Mode**: Ability for users to watch ongoing matches live without participating directly.
- **Game Statistics and Match History**: Track previous games, wins, scores, stats, and global leaderboards.
- **Customization Options**: Flexible game settings (durations, words, modes, etc.).

## Instructions

### Prerequisites

- This repository
- [make](https://www.gnu.org/software/make/)
- [Docker Engine](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [openssl](https://github.com/openssl/openssl)

### Env and secrets configuration

Before running the application, you need to configure your environment variables and SSL certificates.

1. Copy the example environment file and fill in your custom values:

```bash
   cp .env.example .env
```

2. Run `make secrets` to generate the self-signed SSL certificates (`ssl.crt` and `ssl.key`) required for HTTPS.

### Secrets

| File                     | Description     |
| :----------------------- | :-------------- |
| `docker/secrets/ssl.crt` | SSL Certificate |
| `docker/secrets/ssl.key` | SSL Private Key |

### Environnement Variables (`.env` file)

| Variable      | Description                                    | Example / Default     |
| :------------ | :--------------------------------------------- | :-------------------- |
| `WEB_PORT`    | Port number for the web application            | `4242`                |
| `DOMAIN_NAME` | Fully qualified domain name of the app         | `localhost`           |
| `DB_NAME`     | Name of the database to connect to             | `krustykrab`          |
| `DB_USER`     | Username for database authentication           | `spongebob`           |
| `DB_PASSWORD` | Password for database authentication           | `LeP@teC3stFun`       |
| `JWT_SECRET`  | Cryptographic key used to sign and verify JWTs | `LaP1zza!DuC@pit@ine` |

### Configuration

| File                              | Description                                                 |
| :-------------------------------- | :---------------------------------------------------------- |
| `Makefile`                        | Makefile for convenient build, run, and management commands |
| `prod-compose.yml`                | Production Docker Compose configuration                     |
| `docker/prod-backend.Dockerfile`  | Production Dockerfile for the backend                       |
| `docker/prod-frontend.Dockerfile` | Production Dockerfile for the frontend                      |
| `docker/backend-entrypoint.sh`    | Entrypoint script for initializing the backend container    |
| `docker/frontend-entrypoint.sh`   | Entrypoint script for initializing the frontend container   |
| `docker/nginx.conf`               | Nginx web server and reverse proxy configuration            |

### Usage

| Command                      | Description                                                   |
| :--------------------------- | :------------------------------------------------------------ |
| `make` / `make all`          | Build and start production containers in the background       |
| `make build-prod`            | Build production Docker images without cache                  |
| `make prod` / `make up-prod` | Start production containers in detached mode                  |
| `make down-prod`             | Stop and remove production containers                         |
| `make logs-prod`             | Follow logs from production containers                        |
| `make clean`                 | Stop environment and remove containers, networks, and volumes |
| `make fclean`                | Clean up everything including local Docker images             |
| `make re`                    | Clean environment, rebuild prod images from scratch           |
| `make status-prod`           | Show status of running production containers                  |
| `make secrets`               | Generate SSL certificates                                     |
| `make lint`                  | Run code linter (`npm run lint`)                              |
| `make format`                | Run code formatter (`npm run format`)                         |

### Accessing the Application

Once the containers are up and running, you can access the application:

- **Frontend (Web):** https://`DOMAIN_NAME`:`PORT` (ex: https://localhost:4242)
- **Backend (API):** https://`DOMAIN_NAME`:`PORT` (ex: https://localhost:4242/api)

### Data Storage & Persistence

To ensure data integrity, persistence, and proper database management across container restarts, the application uses dedicated Docker named volumes.

### Volumes Overview

| Volume Name     | Target Container | Description                                                                                     |
| :-------------- | :--------------- | :---------------------------------------------------------------------------------------------- |
| `database_data` | `database`       | Persists all PostgreSQL relational database records (users, match histories, stats, game data). |
| `avatars_data`  | `backend`        | Persists uploaded user profile avatars securely on the filesystem in production.                |

#### Security & Secrets Management

Sensitive credentials and configurations are kept entirely out of the source code. They are managed through **environment variables** (via a `.env` file) and **Docker Secrets** for file-based assets.

**Environment Variables (`.env`)**

- `DB_USER`: Username for database authentication.
- `DB_PASSWORD`: Password for database authentication.
- `JWT_SECRET`: Cryptographic key used to sign and verify JWT tokens.

**Docker Secrets (Mapped via `./docker/secrets/`)**

- `ssl.crt`: SSL certificate for HTTPS/TLS configuration.
- `ssl.key`: Private SSL key for HTTPS/TLS configuration.

## Ressources

AI was used as a mentor throughout the project, helping us master technologies through more engaging and concrete examples than official documentation, while continuously challenging our code and our vision for the project. Additionally, certain parts of the project were AI-assisted, representing a trivial proportion on the scale of the entire project, and it also proved useful during the drafting of this document.

- [Docker Documentation](https://docs.docker.com)
- [JavaScript Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [ExpressJS Documentation](https://expressjs.com/en/5x/starter/installing/)
- [PrismaORM Documentation](https://docs.prisma.io/docs/orm)
- [React Documentation](https://react.dev)
- [TailwindCSS Documentation](https://tailwindcss.com/docs/installation/using-vite)
- [WebSocket Documentation](https://websocket.org/reference/websocket-api/)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Monorepo guide](https://monorepo.guide/getting-started)

## Team Information

All team members showed exemplary dedication, actively participating and attending every weekly sync meeting throughout the project.

- [apierret](https://profile.intra.42.fr/users/apierret) (Technical Lead & Developer): Oversaw the technical architecture, technology stack decisions, backend core logic, database modeling, and code quality.
- [magoosse](https://profile.intra.42.fr/users/magoosse) (Product Owner & Developer): Defined product vision, prioritized features, validated completed work, and contributed to frontend UI implementation and game elements.
- [scesar](https://profile.intra.42.fr/users/scesar) (Project Manager / Scrum Master & Developer): Facilitated team coordination, tracked progress and deadlines, managed development tasks, and implemented game statistics, achievements, and leaderboards.
- [lmaysash](https://profile.intra.42.fr/users/lmaysash) (Developer): Designed and implemented core real-time features, drawing canvas mechanics, and lobby discovery systems.
- [rtektas](https://profile.intra.42.fr/users/rtektas) (Developer): Contributed to room management, multiplayer synchronization, match runtime phases, database game persistence, and in-game chat triggers.

## Project Management

To ensure a smooth workflow and maintain high code quality throughout the project lifecycle (including team transitions), we adopted structured project management and development practices:

- Planning & Task Tracking: We started by defining the project scope and targeting our core modules. We then broke down the development into structured tasks tracked via GitHub Projects using a Kanban board.
- **Communication & Syncs:**
    - Daily asynchronous communication and coordination took place on Discord.
    - Weekly sync calls were held to review progress (even partial), set goals and deliverables for the upcoming week, and resolve technical blockers together.
- **Git Workflow:** We followed a branch-per-feature workflow, where each feature was developed on its own dedicated branch and merged into the main codebase exclusively through Pull Requests (PRs).
- **Code Quality & CI/CD:**
    - We enforced code styling and quality using ESLint (linter) and Prettier (formatter), which ran automatically on commits.
    - Our CI pipeline automatically runs unit tests and verifies that the project builds successfully to prevent regressions and broken deployments.

## Technical Stack

- **Frontend:** React, React Router, Vite, TypeScript (_Chosen for its component-based architecture, blazing-fast bundling with Vite, and smooth navigation._)
- **Styling:** TailwindCSS (_Allows rapid, consistent, and fully responsive UI design._)
- **Backend:** Node.js, Express, TypeScript (_Provides a lightweight, flexible, and robust server architecture well-suited for REST endpoints and event handling._)
- **Real-Time:** WebSockets (`ws`) (_Crucial for ultra-low latency, bidirectional event-driven communication required for real-time canvas drawing synchronization and live chat._)
- **Database:** PostgreSQL (_Offers a powerful and reliable relational database system capable of cleanly handling complex relations like users, scores, and friend lists._)
- **ORM:** Prisma (_Provides a type-safe database client, intuitive schema modeling._)
- **Validation:** Zod (_Ensures strict runtime type validation for incoming API payloads and WebSocket messages, bridging client-server data safety._)
- **Code Quality:** ESLint + Prettier (_Automatically enforces consistent code formatting and catches potential bugs early in the development lifecycle._)
- **Infrastructure:** Docker & Docker Compose (_Guarantees a consistent, isolated environment across development, testing, and production, allowing the entire app to spin up with a single command._)
- **Architecture:** Monorepo (`web`, `server`, `shared`) (_Enables sharing common types, validation schemas, and interfaces between client and server to prevent duplication._)

## Database Schema

The application uses a PostgreSQL relational database managed via **Prisma ORM**, structuring the core entities, relationships, enums, and data types as follows:

### Enums

- **`GameMode`**: `SOLO`, `DUO`
- **`GameStatus`**: `PENDING`, `IN_PROGRESS`, `FINISHED`
- **`FriendshipStatus`**: `PENDING`, `ACCEPTED`

### Tables & Models & Relationships

#### 1. `User`

Stores user account details, authentication data, and status.

- `uuid`: `String` (PK, UUID, Default: UUIDv4)
- `email`: `String` (Unique)
- `username`: `String` (Unique)
- `password`: `String` (Hashed)
- `createdAt`: `DateTime` (Default: `now()`)
- `avatarPath`: `String?` (Nullable - profile picture path)
- `isActive`: `Boolean` (Default: `true`)
- **Relationships:**
    - **One-to-Many** with `Message` (as `MessageSender` and `MessageReceiver`).
    - **One-to-Many** with `Friendship` (as `FriendshipSender` and `FriendshipReceiver`).
    - **Many-to-Many** with `Game` through the join table `UserOnGame`.

#### 2. `Game`

Represents game rooms or matches.

- `uuid`: `String` (PK, UUID, Default: UUIDv7)
- `mode`: `GameMode` (Default: `SOLO`)
- `status`: `GameStatus` (Default: `PENDING`)
- `duration`: `Int` (Default: `0`)
- **Relationships:**
    - **Many-to-Many** with `User` through the join table `UserOnGame`.

#### 3. `UserOnGame` (Join Table)

Explicit join table handling the **Many-to-Many relationship** between `User` and `Game`, while tracking individual player scores.

- `id`: `Int` (PK, Auto-increment)
- `userId`: `String` (FK -> `User.uuid`, Cascade Delete)
- `gameId`: `String` (FK -> `Game.uuid`, Cascade Delete)
- `score`: `Int` (Default: `0`)
- **Constraints:** Unique combination of `[userId, gameId]`.

#### 4. `Friendship`

Handles friend requests and connections between users (acting as a relational bridge).

- `uuid`: `String` (PK, UUID, Default: UUIDv7)
- `senderId`: `String` (FK -> `User.uuid`, Cascade Delete)
- `receiverId`: `String` (FK -> `User.uuid`, Cascade Delete)
- `status`: `FriendshipStatus` (Default: `PENDING`)
- **Constraints:** Unique combination of `[senderId, receiverId]`.

#### 5. `Message`

Manages direct or chat messages exchanged between users.

- `uuid`: `String` (PK, UUID, Default: UUIDv7)
- `senderId`: `String` (FK -> `User.uuid`, Cascade Delete)
- `receiverId`: `String` (FK -> `User.uuid`, Cascade Delete)
- `content`: `String`
- **Relationships:**
    - **Many-to-One** with `User` (Sender).
    - **Many-to-One** with `User` (Receiver).

## Features List

Here is the complete list of implemented features, along with a brief description, technical highlights, and the team member(s) responsible for each:

- **User Authentication (`/login`, `/register`, `/logout`)**
    - **Description:** Secure authentication system with strict form validation. Handles user registration (with email, username, password confirmation, unique constraints checking, and bcrypt password hashing) and secure login/logout sessions.
    - **Contributors:** apierret

- **Account Management (`/account`)**
    - **Description:** Dedicated settings interface allowing users to modify their profile details (avatar, username, email, and password) with strict input validation and uniqueness enforcement.
    - **Contributors:** apierret

- **Social & Friends System (`/friends`)**
    - **Description:** Comprehensive network feature allowing users to search for other players, send friend requests, manage pending sent or received requests, and remove existing friends.
    - **Contributors:** apierret

- **User Profile & Public Page (`/user/:uuid`)**
    - **Description:** Public profile view displaying user details (avatar, username, real-time online/offline status, stats, match history, and achievements). Includes a dynamic action button to add as friend, accept incoming requests, or remove existing friends, alongside a shortcut to open private messaging.
    - **Contributors:** apierret

- **Direct Messaging (`/msg?user=:uuid`)**
    - **Description:** Private messaging interface enabling real-time conversations with other users. Features a sidebar listing ongoing conversations for seamless switching between chats.
    - **Contributors:** apierret

- **Legal Pages (`/tos`, `/privacy`)**
    - **Description:** Dedicated static views providing the Terms of Service (TOS) and Privacy Policy.
    - **Contributors:** apierret

- **Leaderboard (`/leaderboard`)**
    - **Description:** Global leaderboard displaying users with at least one victory, ranked in descending order based on their win count.
    - **Contributors:** scesar

- **Achievements System** (on `/user/:uuid` page)
    - **Description:** Gamification feature rewarding users for their actions and milestones within the platform, tracking progress and unlocking badges persistently in the database.
    - **Contributors:** scesar

- **Lobby Discovery & Management (`/lobby`)**
    - **Description:** Dedicated hub listing all public game rooms in real-time. Allows users to either join an existing public lobby, enter a private game using a custom shareable code, or create a new custom game room.
    - **Contributors:** lmaysash

- **Lobby Configuration & Room Control (`/lobbies/:uuid`)**
    - **Description:** Pre-game waiting room and management interface. The host can configure game settings (such as custom word pools, round parameters, visibility scope like public/private), share invitation links/codes, ban disruptive players, and trigger the game start once enough participants are ready. Participants can toggle their ready status, chat, or leave the room.
    - **Contributors:** lmaysash, rtektas

- **Live Multiplayer Game & Drawing Loop (`/lobbies/:uuid`)**
    - **Description:** Core gameplay session featuring a real-time collaborative drawing canvas, word-guessing mechanism via the live chat, dynamic point calculation, and specific rules for Duo mode (where two players play simultaneously). Supports seamless transitions from the lobby phase to the active gaming phase.
    - **Contributors:** magoosse, rtektas

## Modules

Our project reaches a total of **19 points** (14 required points + 5 bonus points) by implementing the following major and minor modules:

### Major Modules (2 points each)

- **Use a framework for both the frontend and backend**: Implemented React on the frontend and Express on the backend to cleanly structure our application architecture.
- **Implement real-time features using WebSockets or similar technology**: Integrated native WebSockets (`ws`) for low-latency, bidirectional, and event-driven communication (such as real-time online status and live interactions).
- **Allow users to interact with other users**: Built a comprehensive social system including friend requests, profile management, live online/offline status, and direct messaging between users.
- **Standard user management and authentication**: Secure authentication flow featuring strict form validation, bcrypt password hashing, JWT sessions, and complete account management (avatar, username, email, password).
- **Implement a complete web-based game where users can play against each other**: Developed a full drawing and guessing game loop with rules, turns, word selections, and scoring.
- **Remote players: Enable two players on separate computers to play the same game in real-time**: Network synchronization enabling players across different machines to connect and play simultaneously.
- **Multiplayer game (more than two players)**: Lobby architecture supporting rooms with 3 or more players interacting concurrently.

### Minor Modules (1 point each)

- **Use an ORM for the database**: Integrated Prisma ORM with PostgreSQL for type-safe queries, relational modeling, and seamless migrations.
- **Real-time collaborative features (shared workspaces, live editing, collaborative drawing, etc.)**: Built a live shared drawing canvas allowing real-time multi-tool collaboration.
- **Game statistics and match history**: Persistent storage and display of match history, individual rankings, scores, and user stats.
- **Game customization options**: Flexible settings allowing hosts to configure match durations, word packs, and custom game rules.
- **Implement spectator mode for games**: Allows users to join ongoing game sessions as spectators to watch matches live without participating directly.

## Individual Contributions

- **apierret**
    - **Contributions:** As Technical Lead, handled the core architecture, monorepo structuring, secure authentication flows, account management, social systems, user profiles, direct messaging, and public API endpoints.
    - **Challenges & Solutions:** Spearheaded the technical direction from the ground up, ensuring robust type safety with Zod, database modeling via Prisma ORM, and seamless backend services orchestration.

- **magoosse**
    - **Contributions:** Led the entire frontend redesign and UI architecture, developing the interactive collaborative drawing canvas along with its tools and real-time stroke synchronization.
    - **Challenges & Solutions:** Overcame complex rendering and synchronization hurdles to deliver a smooth, responsive, and lag-free drawing experience across clients.

- **scesar**
    - **Contributions:** Developed the game statistics, match history tracking, global leaderboard system, and the persistent achievements/gamification features. Acted as the team's anchor for organization, meeting tracking, and notes management.
    - **Challenges & Solutions:** Maintained clear project alignment, structured milestone tracking during syncs, and ensured persistent user progression and performance logic in the database.

- **lmaysash**
    - **Contributions:** Built the complete lobby architecture and management system (including public/private room creation, custom shareable codes, custom word packs, and comprehensive host control settings).
    - **Challenges & Solutions:** Handled complex room state management, participant permissions, and dynamic invitation handling for smooth multiplayer sessions.

- **rtektas**
    - **Contributions:** Developed the game phase runtime loop, database persistence for match data, the in-game chat system, and secret word triggers.
    - **Challenges & Solutions:** Ensured reliable state synchronization between ongoing game phases, secure database saving for match records, and real-time word-guessing integration.
