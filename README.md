<img width="355" height="331" alt="Capture d&#39;écran 2026-05-21 162924" src="https://github.com/user-attachments/assets/fb40b003-eda8-450e-975d-9b1d5f3058e2" />
<img width="548" height="326" alt="Capture d&#39;écran 2026-05-21 162956" src="https://github.com/user-attachments/assets/55c2a5e5-a33e-4032-9bb0-91e411ba8f07" />
<img width="920" height="322" alt="Capture d&#39;écran 2026-05-21 163142" src="https://github.com/user-attachments/assets/229dd0c2-dbf7-4638-8de2-214119b87a73" />


# 💎 Azul: Infinity Stones

Une adaptation numérique du célèbre jeu de société **Azul**, revisitée dans l’univers **Marvel** autour des Pierres d’Infinité.  
Ce projet est une **Single Page Application (SPA)** développée avec **React**, **Redux Toolkit** et **Vite**.

## 🚀 Fonctionnalités

- 🎲 **Moteur de jeu Azul complet** : respect strict des règles officielles (pioche, placement, pénalités).
- 👥 **Mode local 2 joueurs** : jouez à deux sur le même écran avec une mise à jour en temps réel des plateaux.
- 🧮 **Scoring dynamique** : calcul automatique des points incluant les bonus d’adjacence, les malus de ligne de plancher et les bonus de fin de partie.
- 🌌 **Design cosmique** : interface thématique avec des effets de lumière et de transparence inspirés des Pierres d’Infinité.

## 🛠️ Stack Technique

- **Frontend** : React 18
- **State Management** : Redux Toolkit
- **Styling** : SCSS (Modules) avec architecture moderne (Sass)
- **Build Tool** : Vite

## 🎮 Règles implémentées

- **Offre des fabriques** : piochez toutes les pierres d’une couleur d’une fabrique, le reste est envoyé au centre.
- **Placement** : remplissez vos lignes de motif. Le surplus est converti en énergie perdue (pénalités).
- **Mur de l’Infini** : une fois une ligne complétée, une pierre est transférée sur votre mur pour marquer des points.
- **Fin de partie** : la partie s’arrête dès qu’un joueur complète une ligne horizontale de 5 pierres.

## 📦 Installation et Lancement

### Cloner le dépôt

```bash
git clone https://github.com/votre-username/Azul-Infinity-Stones.git
cd Azul-Infinity-Stones
```

### Installer les dépendances

```bash
npm install
```

### Lancer le serveur de développement

```bash
npm run dev
```

### Lancer le backend

```bash
npm azul_backend
npm install
node server.js
```

L’application sera disponible sur **http://localhost:3000**.

## 📂 Structure du projet

```
src/
├── store/        # Contient le gameSlice (logique métier)
├── pages/
│   └── Game/     # Interface principale de jeu
├── components/   # Composants réutilisables
└── styles/       # Variables globales, mixins et thèmes SCSS
```
